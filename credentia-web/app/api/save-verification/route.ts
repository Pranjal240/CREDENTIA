import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  try {
    const { studentId, type, analysis, fileUrl, status } = await request.json()

    if (!studentId || !type || !analysis) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields for saving' },
        { status: 400 }
      )
    }

    // 1. Ensure `students` row exists
    await supabaseAdmin.from('students').upsert(
      { id: studentId },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    // 2. Confidence metric
    const confidence = type === 'resume'
      ? (analysis.ats_score || 0)
      : (analysis.confidence || 0)

    // 3. Upsert into verifications table
    const { data: existing } = await supabaseAdmin
      .from('verifications')
      .select('id')
      .eq('student_id', studentId)
      .eq('type', type)
      .maybeSingle()

    if (existing) {
      await supabaseAdmin
        .from('verifications')
        .update({
          status,
          ai_result: analysis,
          ai_confidence: confidence,
          document_url: fileUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin.from('verifications').insert({
        student_id: studentId,
        type,
        status,
        ai_result: analysis,
        ai_confidence: confidence,
        document_url: fileUrl,
      })
    }

    // 4. Type-specific students table updates
    if (type === 'resume') {
      const upsertData: any = {
        id: studentId,
        resume_url: fileUrl,
        ats_score: analysis.ats_score || 0,
        updated_at: new Date().toISOString(),
      }
      if (analysis.student_name) upsertData.name = analysis.student_name
      if (analysis.city) upsertData.city = analysis.city
      if (analysis.state) upsertData.state = analysis.state
      if (analysis.course) upsertData.course = analysis.course
      if (analysis.branch) upsertData.branch = analysis.branch
      if (analysis.graduation_year) {
        upsertData.graduation_year = typeof analysis.graduation_year === 'number'
          ? analysis.graduation_year
          : parseInt(analysis.graduation_year) || null
      }
      if (analysis.experience_years !== undefined && analysis.experience_years !== null) {
        upsertData.experience_years = analysis.experience_years
      }
      if (analysis.top_skills && Array.isArray(analysis.top_skills)) {
        upsertData.skills = analysis.top_skills
      }
      await supabaseAdmin.from('students').upsert(upsertData, { onConflict: 'id' })

      // Also update full_name in profiles if extracted from resume and not already set
      if (analysis.student_name) {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .eq('id', studentId)
          .single()
        if (!prof?.full_name || prof.full_name.trim() === '') {
          await supabaseAdmin
            .from('profiles')
            .update({ full_name: analysis.student_name, updated_at: new Date().toISOString() })
            .eq('id', studentId)
        }
      }
    } else if (type === 'aadhaar' && analysis.verified) {
      await supabaseAdmin.from('students').upsert({
        id: studentId,
        aadhaar_verified: true,
        aadhaar_last4: analysis.aadhaar_last4 || null,
        aadhaar_name: analysis.name || null,
        aadhaar_dob: analysis.dob || null,
        aadhaar_state: analysis.state || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    } else if (type === 'degree' && analysis.verified) {
      await supabaseAdmin.from('students').upsert({
        id: studentId,
        degree_verified: true,
        course: analysis.course || analysis.degree || null,
        cgpa: analysis.grade_cgpa || null,
        graduation_year: analysis.year_of_passing ? parseInt(analysis.year_of_passing) || null : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    } else if (type === 'police' && analysis.verified) {
      await supabaseAdmin.from('students').upsert({
        id: studentId,
        police_verified: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }

    // 5. Recalculate profile completion percentage
    const { data: studentData } = await supabaseAdmin
      .from('students')
      .select('name, course, branch, city, cgpa, graduation_year, ats_score, degree_verified, police_verified, aadhaar_verified, resume_url')
      .eq('id', studentId)
      .single()

    if (studentData) {
      const fields = [
        studentData.name, studentData.course, studentData.branch,
        studentData.city, studentData.cgpa, studentData.graduation_year,
        studentData.resume_url
      ]
      const filledFields = fields.filter(f => f !== null && f !== undefined && f !== '').length
      const verifications = [studentData.degree_verified, studentData.police_verified, studentData.aadhaar_verified].filter(Boolean).length
      const pct = Math.round(((filledFields / fields.length) * 60) + ((verifications / 3) * 40))

      await supabaseAdmin.from('students')
        .update({ profile_complete_pct: Math.min(pct, 100), updated_at: new Date().toISOString() })
        .eq('id', studentId)
    }

    // 6. Cache invalidation
    revalidatePath('/dashboard/student', 'layout')
    revalidatePath(`/dashboard/student/${type}`, 'page')
    revalidatePath('/dashboard/admin', 'page')
    revalidatePath('/dashboard/university', 'page')

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error(`Save verification error [${error.message}]:`, error)
    return NextResponse.json(
      { success: false, error: error.message || 'Saving failed' },
      { status: 500 }
    )
  }
}

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

    // 1. Ensure `students` row exists to satisfy Foreign Key constraints for older accounts
    await supabaseAdmin.from('students').upsert(
      { id: studentId },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    // 2. Unified UPSERT into `verifications` table
    const { data: existing } = await supabaseAdmin
      .from('verifications')
      .select('id')
      .eq('student_id', studentId)
      .eq('type', type)
      .maybeSingle()

    // Determine confidence metric depending on type
    const confidence = type === 'resume' 
      ? (analysis.ats_score || 0) 
      : (analysis.confidence || 0)

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
        type: type,
        status: status,
        ai_result: analysis,
        ai_confidence: confidence,
        document_url: fileUrl,
      })
    }

    // 2. Type-specific `students` table mapping
    if (type === 'resume') {
      const upsertData: any = {
        id: studentId,
        resume_url: fileUrl,
        ats_score: analysis.ats_score || 0,
        updated_at: new Date().toISOString(),
      }
      // Auto-populate profile fields from AI extraction (only if not already set)
      if (analysis.student_name) upsertData.name = analysis.student_name
      if (analysis.city) upsertData.city = analysis.city
      if (analysis.state) upsertData.state = analysis.state
      if (analysis.course) upsertData.course = analysis.course
      if (analysis.branch) upsertData.branch = analysis.branch
      if (analysis.graduation_year) upsertData.graduation_year = typeof analysis.graduation_year === 'number' ? analysis.graduation_year : parseInt(analysis.graduation_year) || null
      if (analysis.experience_years !== undefined && analysis.experience_years !== null) upsertData.experience_years = analysis.experience_years
      if (analysis.top_skills && Array.isArray(analysis.top_skills)) upsertData.skills = analysis.top_skills

      await supabaseAdmin.from('students').upsert(upsertData, { onConflict: 'id' })
    } 
    else if (type === 'aadhaar' && analysis.verified) {
      await supabaseAdmin.from('students').upsert({
        id: studentId,
        aadhaar_verified: true,
        aadhaar_last4: analysis.aadhaar_last4 || null,
        aadhaar_name: analysis.name || null,
        aadhaar_dob: analysis.dob || null,
        aadhaar_state: analysis.state || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }
    else if (type === 'degree' && analysis.verified) {
      await supabaseAdmin.from('students').upsert({
        id: studentId,
        degree_verified: true,
        course: analysis.course || analysis.degree || null,
        cgpa: analysis.grade_cgpa || null,
        graduation_year: analysis.year_of_passing ? parseInt(analysis.year_of_passing) || null : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }

    // 3. Bruteforce Cache Invalidation
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

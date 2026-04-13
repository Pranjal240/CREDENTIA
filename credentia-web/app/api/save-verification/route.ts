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
        updated_at: new Date().toISOString(),
      }
      // Only set ats_score if it's a valid non-zero number
      if (analysis.ats_score && analysis.ats_score > 0) {
        upsertData.ats_score = analysis.ats_score
      }
      if (analysis.student_name) upsertData.name = analysis.student_name
      if (analysis.city) upsertData.city = analysis.city
      if (analysis.state) upsertData.state = analysis.state
      if (analysis.course) upsertData.course = analysis.course
      if (analysis.branch) upsertData.branch = analysis.branch
      // Always update CGPA from AI — latest extraction wins
      let finalCgpaStr = analysis.cgpa;
      if (!finalCgpaStr && analysis.summary) {
        const match = analysis.summary.match(/cgpa\s*(?:of|is|:)?\s*([0-9.]+)/i);
        if (match) finalCgpaStr = match[1];
      }
      // Force update the analysis object so that verifications.ai_result correctly holds the extracted value
      if (finalCgpaStr) analysis.cgpa = finalCgpaStr;

      if (finalCgpaStr) {
        const cgpaVal = parseFloat(String(finalCgpaStr).replace(/[^0-9.]/g, ''))
        if (!isNaN(cgpaVal) && cgpaVal > 0) {
          upsertData.cgpa = cgpaVal
        }
      }
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
    } else if (type === 'aadhaar') {
      await supabaseAdmin.from('students').upsert({
        id: studentId,
        aadhaar_verified: ['ai_approved', 'admin_verified', 'verified'].includes(status),
        aadhaar_last4: analysis.aadhaar_last4 || null,
        aadhaar_name: analysis.name || null,
        aadhaar_dob: analysis.dob || null,
        aadhaar_state: analysis.state || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    } else if (type === 'degree') {
      // Parse CGPA from degree — could be "7.54", "8.2 CGPA", etc.
      let cgpaVal = null
      if (analysis.grade_cgpa) {
        const parsed = parseFloat(String(analysis.grade_cgpa).replace(/[^0-9.]/g, ''))
        if (!isNaN(parsed) && parsed > 0) cgpaVal = parsed
      }
      await supabaseAdmin.from('students').upsert({
        id: studentId,
        degree_verified: ['ai_approved', 'admin_verified', 'verified'].includes(status),
        course: analysis.course || analysis.degree || null,
        cgpa: cgpaVal,
        graduation_year: analysis.year_of_passing ? parseInt(analysis.year_of_passing) || null : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    } else if (type === 'police') {
      await supabaseAdmin.from('students').upsert({
        id: studentId,
        police_verified: ['ai_approved', 'admin_verified', 'verified'].includes(status),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    } else if (type === 'marksheet_10th') {
      // AI-extracted 10th percentage — sync to students table for cross-portal visibility
      const pct = analysis.percentage ? parseFloat(analysis.percentage.replace('%', '')) : null
      if (pct !== null && !isNaN(pct)) {
        await supabaseAdmin.from('students').upsert({
          id: studentId,
          percentage_10th: pct,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      }
    } else if (type === 'marksheet_12th') {
      // AI-extracted 12th percentage — sync to students table for cross-portal visibility
      const pct = analysis.percentage ? parseFloat(analysis.percentage.replace('%', '')) : null
      if (pct !== null && !isNaN(pct)) {
        await supabaseAdmin.from('students').upsert({
          id: studentId,
          percentage_12th: pct,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })
      }
    }
    // passport (other) — stored in verifications only, contributes to profile completion

    // 5. Fetch all verifications for this student to recalculate scores
    const { data: allVerifs } = await supabaseAdmin
      .from('verifications')
      .select('type, status')
      .eq('student_id', studentId)

    const { data: studentData } = await supabaseAdmin
      .from('students')
      .select('name, course, branch, city, cgpa, graduation_year, ats_score, degree_verified, police_verified, aadhaar_verified, resume_url')
      .eq('id', studentId)
      .single()

    // 6. Recalculate profile completion percentage + trust score
    if (studentData) {
      // Profile completion: based on filled fields (60%) + core verifications (40%)
      const fields = [
        studentData.name, studentData.course, studentData.branch,
        studentData.city, studentData.cgpa, studentData.graduation_year,
        studentData.resume_url
      ]
      const filledFields = fields.filter(f => f !== null && f !== undefined && f !== '').length
      const coreVerifiedCount = [studentData.degree_verified, studentData.police_verified, studentData.aadhaar_verified].filter(Boolean).length
      const pct = Math.round(((filledFields / fields.length) * 60) + ((coreVerifiedCount / 3) * 40))

      // Trust score: based on ALL verification types, dynamically weighted
      const verifiedStatuses = ['ai_approved', 'admin_verified', 'verified']
      const coreTypes = ['resume', 'police', 'aadhaar', 'degree']
      const bonusTypes = ['marksheet_10th', 'marksheet_12th', 'passport']
      const coreVerified = (allVerifs || []).filter(v => coreTypes.includes(v.type) && verifiedStatuses.includes(v.status)).length
      const bonusVerified = (allVerifs || []).filter(v => bonusTypes.includes(v.type) && verifiedStatuses.includes(v.status)).length
      // Core types: 4 pillars, each worth 21.25% (total 85%)
      // Bonus types: each adds 5% (capped at 15% total)
      const trustScore = Math.min(
        Math.round((coreVerified / 4) * 85) + Math.min(bonusVerified * 5, 15),
        100
      )

      const totalVerifiedDocs = (allVerifs || []).filter(v => verifiedStatuses.includes(v.status)).length

      await supabaseAdmin.from('students')
        .update({
          profile_complete_pct: Math.min(pct, 100),
          trust_score: trustScore,
          verified_docs_count: totalVerifiedDocs,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
    }

    // 7. Cache invalidation — cover all portals
    revalidatePath('/dashboard/student', 'layout')
    revalidatePath(`/dashboard/student/${type}`, 'page')
    revalidatePath('/dashboard/student/saved', 'page')
    revalidatePath('/dashboard/admin', 'page')
    revalidatePath('/dashboard/admin/analytics', 'page')
    revalidatePath('/dashboard/university', 'page')
    revalidatePath('/dashboard/university/analytics', 'page')
    revalidatePath('/dashboard/company', 'page')

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error(`Save verification error [${error.message}]:`, error)
    return NextResponse.json(
      { success: false, error: error.message || 'Saving failed' },
      { status: 500 }
    )
  }
}

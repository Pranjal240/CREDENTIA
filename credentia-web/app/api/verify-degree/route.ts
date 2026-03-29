import { NextResponse } from 'next/server'
import { analyzeDegree } from '@/lib/groq'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { fileUrl, studentId } = await request.json()

    if (!fileUrl || !studentId) {
      return NextResponse.json({ success: false, error: 'Missing fileUrl or studentId' }, { status: 400 })
    }

    let content = ''
    try {
      const response = await fetch(fileUrl)
      content = await response.text()
    } catch {
      content = `Degree certificate URL: ${fileUrl}`
    }

    const analysis = await analyzeDegree(content)

    if (analysis.verified) {
      await supabaseAdmin.from('students').update({
        degree_verified: true,
        university_name: analysis.university_name || null,
        course: analysis.course || analysis.degree || null,
        cgpa: analysis.grade_cgpa || null,
        graduation_year: analysis.year_of_passing || null,
        updated_at: new Date().toISOString(),
      }).eq('id', studentId)
    }

    // Upsert verification
    const { data: existing } = await supabaseAdmin.from('verifications')
      .select('id').eq('student_id', studentId).eq('type', 'degree').maybeSingle()

    if (existing) {
      await supabaseAdmin.from('verifications').update({
        status: analysis.verified ? 'verified' : 'rejected',
        ai_analysis: analysis,
        file_url: fileUrl,
        verified_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await supabaseAdmin.from('verifications').insert({
        student_id: studentId,
        type: 'degree',
        status: analysis.verified ? 'verified' : 'rejected',
        ai_analysis: analysis,
        file_url: fileUrl,
        verified_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error: any) {
    console.error('Degree verification error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Verification failed' }, { status: 500 })
  }
}

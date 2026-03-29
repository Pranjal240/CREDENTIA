import { NextResponse } from 'next/server'
import { analyzeResume } from '@/lib/groq'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { fileUrl, studentId } = await request.json()

    if (!fileUrl || !studentId) {
      return NextResponse.json({ success: false, error: 'Missing fileUrl or studentId' }, { status: 400 })
    }

    // Fetch file content (for text-based analysis)
    let content = ''
    try {
      const response = await fetch(fileUrl)
      content = await response.text()
    } catch {
      content = `Resume URL: ${fileUrl}`
    }

    const analysis = await analyzeResume(content)

    // Update student record
    await supabaseAdmin.from('students').update({
      resume_url: fileUrl,
      ats_score: analysis.ats_score || 0,
      resume_analysis: analysis,
      updated_at: new Date().toISOString(),
    }).eq('id', studentId)

    // Upsert verification record
    const { data: existing } = await supabaseAdmin.from('verifications')
      .select('id').eq('student_id', studentId).eq('type', 'resume').maybeSingle()

    if (existing) {
      await supabaseAdmin.from('verifications').update({
        status: 'verified',
        ai_analysis: analysis,
        file_url: fileUrl,
        verified_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await supabaseAdmin.from('verifications').insert({
        student_id: studentId,
        type: 'resume',
        status: 'verified',
        ai_analysis: analysis,
        file_url: fileUrl,
        verified_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error: any) {
    console.error('Resume analysis error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Analysis failed' }, { status: 500 })
  }
}

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

    // Update student record — only columns that actually exist
    await supabaseAdmin.from('students').update({
      resume_url: fileUrl,
      ats_score: analysis.ats_score || 0,
      updated_at: new Date().toISOString(),
    }).eq('id', studentId)

    // Upsert verification record — use correct column names
    const { data: existing } = await supabaseAdmin.from('verifications')
      .select('id').eq('student_id', studentId).eq('type', 'resume').maybeSingle()

    if (existing) {
      await supabaseAdmin.from('verifications').update({
        status: 'ai_approved',
        ai_result: analysis,
        ai_confidence: analysis.ats_score || 0,
        document_url: fileUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await supabaseAdmin.from('verifications').insert({
        student_id: studentId,
        type: 'resume',
        status: 'ai_approved',
        ai_result: analysis,
        ai_confidence: analysis.ats_score || 0,
        document_url: fileUrl,
      })
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error: any) {
    console.error('Resume analysis error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Analysis failed' }, { status: 500 })
  }
}

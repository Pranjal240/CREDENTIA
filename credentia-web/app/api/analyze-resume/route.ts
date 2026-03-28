import { NextResponse } from 'next/server'
import { analyzeResume } from '@/lib/groq'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { fileUrl, linkUrl, studentId, textContent } = await req.json()
    const supabase = createServerSupabaseClient()

    let content = textContent || ''

    if (fileUrl || linkUrl) {
      const url = fileUrl || linkUrl
      try {
        const res = await fetch(url)
        content = await res.text()
      } catch {
        content = `Resume from URL: ${url}. Please analyze as a professional resume.`
      }
    }

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    const analysis = await analyzeResume(content)

    // Save to Supabase
    await supabase.from('verifications').upsert({
      student_id: studentId,
      type: 'resume',
      status: analysis.ats_score >= 60 ? 'ai_approved' : 'needs_review',
      document_url: fileUrl,
      external_link: linkUrl,
      ai_confidence: analysis.ats_score,
      ai_result: analysis,
    }, { onConflict: 'student_id,type' })

    // Update ats_score on students table
    await supabase.from('students').update({ ats_score: analysis.ats_score }).eq('id', studentId)

    return NextResponse.json({ success: true, analysis })
  } catch (error: any) {
    console.error('Resume analysis error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

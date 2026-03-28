import { NextResponse } from 'next/server'
import { analyzeDegree } from '@/lib/groq'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { fileUrl, linkUrl, studentId, textContent } = await req.json()
    const supabase = createSupabaseServerClient()

    let content = textContent || ''

    if (fileUrl || linkUrl) {
      try {
        const res = await fetch(fileUrl || linkUrl)
        content = await res.text()
      } catch {
        content = `Degree certificate from ${fileUrl || linkUrl}`
      }
    }

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    const analysis = await analyzeDegree(content)

    await supabase.from('verifications').upsert({
      user_id: studentId,
      type: 'degree',
      status: analysis.confidence >= 75 ? 'ai_approved' : 'needs_review',
      document_url: fileUrl,
      external_link: linkUrl,
      ai_confidence: analysis.confidence,
      ai_result: analysis,
    }, { onConflict: 'user_id,type' })

    if (analysis.confidence >= 75) {
      await supabase.from('students').update({ degree_verified: true }).eq('id', studentId)
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

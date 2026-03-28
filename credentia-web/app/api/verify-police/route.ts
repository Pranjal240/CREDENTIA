import { NextResponse } from 'next/server'
import { analyzePoliceDocument } from '@/lib/groq'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { fileUrl, linkUrl, manualData, studentId } = await req.json()
    const supabase = createServerSupabaseClient()

    let content = ''

    if (manualData) {
      content = `Police Verification Certificate Details:
Certificate Number: ${manualData.certificateNumber || 'Not provided'}
Issue Date: ${manualData.issueDate || 'Not provided'}
Issuing Authority: ${manualData.issuingAuthority || 'Not provided'}
District: ${manualData.district || 'Not provided'}
State: ${manualData.state || 'Not provided'}
This is a police verification certificate submission.`
    } else if (fileUrl || linkUrl) {
      const url = fileUrl || linkUrl
      try {
        const res = await fetch(url)
        content = await res.text()
      } catch {
        content = `Police certificate from URL: ${url}. Treat as a police verification certificate from India.`
      }
    }

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    const analysis = await analyzePoliceDocument(content)

    // Determine status based on confidence
    let status = 'rejected'
    if (analysis.confidence >= 85) status = 'ai_approved'
    else if (analysis.confidence >= 60) status = 'needs_review'

    await supabase.from('verifications').upsert({
      student_id: studentId,
      type: 'police',
      status,
      document_url: fileUrl,
      external_link: linkUrl,
      ai_confidence: analysis.confidence,
      ai_result: analysis,
    }, { onConflict: 'student_id,type' })

    return NextResponse.json({ success: true, analysis, status })
  } catch (error: any) {
    console.error('Police verification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

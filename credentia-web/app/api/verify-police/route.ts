import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { analyzePoliceDoc } from '@/lib/groq'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import('unpdf')
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}

export async function POST(request: Request) {
  try {
    const { fileUrl, manualData, studentId } = await request.json()

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Missing studentId' }, { status: 400 })
    }

    let analysis: any = {}
    let status = 'needs_review'

    if (manualData && Object.values(manualData).some((v: any) => v?.trim())) {
      analysis = {
        is_police_certificate: true,
        confidence: 60,
        certificate_number: manualData.certificateNumber || null,
        issuing_authority: manualData.issuingAuthority || null,
        issue_date: manualData.dateOfIssue || null,
        district: manualData.district || null,
        state: manualData.state || null,
        status: 'NEEDS_REVIEW',
        fraud_indicators: [],
        issues: ['Manual entry — requires admin verification'],
      }
      status = 'needs_review'
    } else if (fileUrl) {
      let content = ''
      let isImage = false
      const lowerUrl = fileUrl.toLowerCase()

      try {
        if (
          lowerUrl.includes('.png') ||
          lowerUrl.includes('.jpg') ||
          lowerUrl.includes('.jpeg') ||
          lowerUrl.includes('.webp')
        ) {
          const response = await fetch(fileUrl)
          const arrayBuffer = await response.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          const mimeType = lowerUrl.endsWith('.png')
            ? 'image/png'
            : lowerUrl.endsWith('.webp')
            ? 'image/webp'
            : 'image/jpeg'
          content = `data:${mimeType};base64,${base64}`
          isImage = true
        } else if (lowerUrl.includes('.pdf')) {
          const response = await fetch(fileUrl)
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          content = await extractPdfText(buffer)
        } else {
          const response = await fetch(fileUrl)
          content = await response.text()
        }
      } catch (err: any) {
        console.error('Police file fetch error:', err)
        return NextResponse.json(
          { success: false, error: 'Could not read document content: ' + err.message },
          { status: 400 }
        )
      }

      analysis = await analyzePoliceDoc(content, isImage)

      if (analysis.confidence >= 80 && analysis.is_police_certificate) {
        status = 'ai_approved'
      } else if (analysis.is_police_certificate) {
        status = 'needs_review'
      } else {
        status = 'rejected'
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Provide file or manual data' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabaseAdmin
      .from('verifications')
      .select('id')
      .eq('student_id', studentId)
      .eq('type', 'police')
      .maybeSingle()

    if (existing) {
      await supabaseAdmin
        .from('verifications')
        .update({
          status,
          ai_result: analysis,
          ai_confidence: analysis.confidence || 0,
          document_url: fileUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin.from('verifications').insert({
        student_id: studentId,
        type: 'police',
        status,
        ai_result: analysis,
        ai_confidence: analysis.confidence || 0,
        document_url: fileUrl || null,
      })
    }

    revalidatePath('/dashboard/student/overview')
    revalidatePath('/dashboard/student/police')
    revalidatePath('/dashboard/admin')

    return NextResponse.json({ success: true, analysis, status })
  } catch (error: any) {
    console.error('Police verification error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    )
  }
}

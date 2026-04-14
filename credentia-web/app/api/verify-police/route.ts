import { NextResponse } from 'next/server'
import { analyzePoliceDoc } from '@/lib/groq'

export const runtime = 'nodejs'
export const maxDuration = 60

async function tryExtractPdfText(buffer: Buffer): Promise<string | null> {
  try {
    const result = await Promise.race([
      (async () => {
        const { extractText, getDocumentProxy } = await import('unpdf')
        const pdf = await getDocumentProxy(new Uint8Array(buffer))
        const { text } = await extractText(pdf, { mergePages: true })
        return text && text.trim().length > 20 ? text : null
      })(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
    ])
    return result
  } catch (err) {
    console.warn('[verify-police] unpdf failed, using vision fallback:', (err as Error).message)
    return null
  }
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
        const controller = new AbortController()
        const fetchTimeout = setTimeout(() => controller.abort(), 15000)
        const response = await fetch(fileUrl, { signal: controller.signal })
        clearTimeout(fetchTimeout)

        if (!response.ok) throw new Error(`Failed to fetch file: HTTP ${response.status}`)
        const contentType = (response.headers.get('content-type') || '').toLowerCase()
        const isImageUrl = lowerUrl.includes('.png') || lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.webp') || contentType.startsWith('image/')
        const isPdfUrl = lowerUrl.includes('.pdf') || contentType.includes('application/pdf')

        if (isImageUrl) {
          const arrayBuffer = await response.arrayBuffer()
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          const mimeType = contentType.startsWith('image/') ? contentType.split(';')[0] :
            lowerUrl.endsWith('.png') ? 'image/png' :
            lowerUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
          content = `data:${mimeType};base64,${base64}`
          isImage = true
        } else if (isPdfUrl) {
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          let extractedText: string | null = null
          if (buffer.length < 2 * 1024 * 1024) {
            extractedText = await tryExtractPdfText(buffer)
          }

          if (extractedText) {
            content = extractedText
            isImage = false
          } else {
            const base64 = buffer.toString('base64')
            content = `data:application/pdf;base64,${base64}`
            isImage = true
          }
        } else {
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

    return NextResponse.json({ success: true, analysis, status, fileUrl })
  } catch (error: any) {
    console.error('Police verification error:', error)
    return NextResponse.json({
      success: true,
      analysis: { is_police_certificate: false, confidence: 0, issues: ['AI analysis failed — sent for manual review'] },
      fileUrl: '',
      status: 'needs_review'
    })
  }
}

import { NextResponse } from 'next/server'
import { analyzeResume } from '@/lib/groq'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Try extracting text from a PDF using unpdf.
 * Returns null if it fails (WASM crash, worker missing, etc.)
 * Wrapped in Promise.race with 5s timeout for safety.
 */
async function tryExtractPdfText(buffer: Buffer): Promise<string | null> {
  try {
    const result = await Promise.race([
      (async () => {
        const { extractText, getDocumentProxy } = await import('unpdf')
        const pdf = await getDocumentProxy(new Uint8Array(buffer))
        const { text } = await extractText(pdf, { mergePages: true })
        return text && text.trim().length > 20 ? text : null
      })(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
    ])
    return result
  } catch (err) {
    console.warn('[analyze-resume] unpdf extraction failed, will use vision fallback:', (err as Error).message)
    return null
  }
}

export async function POST(request: Request) {
  try {
    const { fileUrl, studentId } = await request.json()

    if (!fileUrl || !studentId) {
      return NextResponse.json({ success: false, error: 'Missing fileUrl or studentId' }, { status: 400 })
    }

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
        // Images → send as base64 to vision model
        const arrayBuffer = await response.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = contentType.startsWith('image/') ? contentType.split(';')[0] :
          lowerUrl.endsWith('.png') ? 'image/png' :
          lowerUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
        content = `data:${mimeType};base64,${base64}`
        isImage = true
      } else if (isPdfUrl) {
        // PDFs → try fast text extraction first, fall back to vision
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const extractedText = await tryExtractPdfText(buffer)

        if (extractedText) {
          // Text extraction succeeded → use fast text model (saves API quota)
          content = extractedText
          isImage = false
        } else {
          // Text extraction failed → convert to base64 and use vision model
          console.log('[analyze-resume] Using vision fallback for PDF')
          const base64 = buffer.toString('base64')
          content = `data:application/pdf;base64,${base64}`
          isImage = true
        }
      } else {
        content = await response.text()
      }
    } catch (err: any) {
      console.error('File parsing error:', err)
      return NextResponse.json(
        { success: false, error: 'Could not read document: ' + (err.message || 'unknown error') },
        { status: 400 }
      )
    }

    if (!content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Document appears to be empty or unreadable. Try uploading a clearer file.' },
        { status: 400 }
      )
    }

    const analysis = await analyzeResume(content, isImage)
    const status = analysis.ats_score && analysis.ats_score > 0 ? 'ai_approved' : 'needs_review'

    return NextResponse.json({ success: true, analysis, fileUrl, status })
  } catch (error: any) {
    console.error('Resume analysis error:', error)
    return NextResponse.json({
      success: true,
      analysis: {
        ats_score: 0,
        authenticity_score: 0,
        summary: 'AI analysis encountered an error. The document has been saved for manual review.',
        strengths: [],
        improvements: ['Please re-upload if this persists'],
        keywords_found: [],
        keywords_missing: [],
        top_skills: [],
        issues: ['AI analysis failed — sent for manual review']
      },
      fileUrl: '',
      status: 'needs_review'
    })
  }
}

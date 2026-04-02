import { NextResponse } from 'next/server'
import { analyzeMarksheet } from '@/lib/groq'

export const runtime = 'nodejs'

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import('unpdf')
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text } = await extractText(pdf, { mergePages: true })
  return text
}

export async function POST(request: Request) {
  try {
    const { fileUrl, studentId, marksheetType } = await request.json()

    if (!fileUrl || !studentId) {
      return NextResponse.json({ success: false, error: 'Missing fileUrl or studentId' }, { status: 400 })
    }

    const type = marksheetType === '12th' ? '12th' : '10th'

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
      console.error('Marksheet file fetch error:', err)
      return NextResponse.json(
        { success: false, error: 'Could not read document content: ' + err.message },
        { status: 400 }
      )
    }

    const analysis = await analyzeMarksheet(content, isImage, type)

    // Status logic — be LENIENT for genuine documents:
    // - verified=true + confidence ≥ 40 → ai_approved (most real docs pass this)
    // - verified=true + confidence < 40 → needs_review (admin reviews edge cases)
    // - verified=false → needs_review (NOT rejected — let admin decide, AI can be wrong)
    const status = analysis.verified && (analysis.confidence || 0) >= 40
      ? 'ai_approved'
      : 'needs_review'

    return NextResponse.json({ success: true, analysis, fileUrl, status })
  } catch (error: any) {
    console.error('Marksheet verification error:', error)
    // On AI failure, return needs_review so admin can handle it manually
    return NextResponse.json({
      success: true,
      analysis: { verified: false, confidence: 0, issues: ['AI analysis failed — sent for manual review'] },
      fileUrl: '',
      status: 'needs_review'
    })
  }
}

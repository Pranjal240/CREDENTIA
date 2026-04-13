import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { analyzeResume } from '@/lib/groq'
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
    const { fileUrl, studentId } = await request.json()

    if (!fileUrl || !studentId) {
      return NextResponse.json({ success: false, error: 'Missing fileUrl or studentId' }, { status: 400 })
    }

    let content = ''
    let isImage = false
    const lowerUrl = fileUrl.toLowerCase()

    try {
      const response = await fetch(fileUrl)
      if (!response.ok) throw new Error('Failed to fetch file from storage')
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
        content = await extractPdfText(buffer)
      } else {
        content = await response.text()
      }
    } catch (err: any) {
      console.error('File parsing error:', err)
      return NextResponse.json(
        { success: false, error: 'Could not read document content: ' + err.message },
        { status: 400 }
      )
    }

    if (!content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Document appears to be empty or unreadable' },
        { status: 400 }
      )
    }

    const analysis = await analyzeResume(content, isImage)

    return NextResponse.json({ success: true, analysis, fileUrl })
  } catch (error: any) {
    console.error('Resume analysis error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' },
      { status: 500 }
    )
  }
}

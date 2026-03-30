import { NextResponse } from 'next/server'
import { analyzeResume } from '@/lib/groq'
import { supabaseAdmin } from '@/lib/supabase'

// @ts-ignore
import pdfParse from 'pdf-parse'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { fileUrl, studentId } = await request.json()

    if (!fileUrl || !studentId) {
      return NextResponse.json({ success: false, error: 'Missing fileUrl or studentId' }, { status: 400 })
    }

    // Fetch file content and extract text if it's a PDF
    let content = ''
    try {
      const response = await fetch(fileUrl)
      if (!response.ok) throw new Error('Failed to fetch file from storage')
      
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      if (fileUrl.toLowerCase().includes('.pdf')) {
        // Polyfill DOMMatrix for pdf.js running in Node.js
        if (typeof global !== 'undefined') {
          if (!(global as any).DOMMatrix) (global as any).DOMMatrix = class DOMMatrix {}
          if (!(global as any).DOMPoint) (global as any).DOMPoint = class DOMPoint {}
        }
        
        const pdfData = await pdfParse(buffer)
        content = pdfData.text
      } else {
        content = buffer.toString('utf-8')
      }
    } catch (err: any) {
      console.error('File parsing error:', err)
      return NextResponse.json({ success: false, error: 'Could not read document content: ' + err.message }, { status: 400 })
    }

    if (!content.trim()) {
      return NextResponse.json({ success: false, error: 'Document appears to be empty or unreadable' }, { status: 400 })
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

import { NextResponse } from 'next/server'
import { analyzeDegree } from '@/lib/groq'
import { supabaseAdmin } from '@/lib/supabase'

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
      if (lowerUrl.includes('.png') || lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.webp')) {
        content = fileUrl
        isImage = true
      } else if (lowerUrl.includes('.pdf')) {
        const response = await fetch(fileUrl)
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const pdfParse = require('pdf-parse')
        const pdfData = await pdfParse(buffer)
        content = pdfData.text
      } else {
        const response = await fetch(fileUrl)
        content = await response.text()
      }
    } catch (err: any) {
      console.error('Degree file fetch error:', err)
      return NextResponse.json({ success: false, error: 'Could not read document content: ' + err.message }, { status: 400 })
    }

    const analysis = await analyzeDegree(content, isImage)

    if (analysis.verified) {
      await supabaseAdmin.from('students').update({
        degree_verified: true,
        course: analysis.course || analysis.degree || null,
        cgpa: analysis.grade_cgpa || null,
        graduation_year: analysis.year_of_passing ? parseInt(analysis.year_of_passing) || null : null,
        updated_at: new Date().toISOString(),
      }).eq('id', studentId)
    }

    // Upsert verification — correct column names
    const { data: existing } = await supabaseAdmin.from('verifications')
      .select('id').eq('student_id', studentId).eq('type', 'degree').maybeSingle()

    const newStatus = analysis.verified ? 'ai_approved' : 'rejected'

    if (existing) {
      await supabaseAdmin.from('verifications').update({
        status: newStatus,
        ai_result: analysis,
        ai_confidence: analysis.confidence || 0,
        document_url: fileUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await supabaseAdmin.from('verifications').insert({
        student_id: studentId,
        type: 'degree',
        status: newStatus,
        ai_result: analysis,
        ai_confidence: analysis.confidence || 0,
        document_url: fileUrl,
      })
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error: any) {
    console.error('Degree verification error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Verification failed' }, { status: 500 })
  }
}

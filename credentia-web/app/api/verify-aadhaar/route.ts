import { NextResponse } from 'next/server'
import { analyzeAadhaar } from '@/lib/groq'
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
      console.error('Aadhaar file fetch error:', err)
      return NextResponse.json({ success: false, error: 'Could not read document content: ' + err.message }, { status: 400 })
    }

    const analysis = await analyzeAadhaar(content, isImage)

    // Update student — NEVER store full Aadhaar
    if (analysis.verified) {
      await supabaseAdmin.from('students').update({
        aadhaar_verified: true,
        aadhaar_last4: analysis.aadhaar_last4 || null,
        aadhaar_name: analysis.name || null,
        aadhaar_dob: analysis.dob || null,
        aadhaar_state: analysis.state || null,
        updated_at: new Date().toISOString(),
      }).eq('id', studentId)
    }

    // Upsert verification — correct column names
    const { data: existing } = await supabaseAdmin.from('verifications')
      .select('id').eq('student_id', studentId).eq('type', 'aadhaar').maybeSingle()

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
        type: 'aadhaar',
        status: newStatus,
        ai_result: analysis,
        ai_confidence: analysis.confidence || 0,
        document_url: fileUrl,
      })
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error: any) {
    console.error('Aadhaar verification error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Verification failed' }, { status: 500 })
  }
}

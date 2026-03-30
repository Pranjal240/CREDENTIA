import { NextResponse } from 'next/server'
import { analyzePoliceDoc } from '@/lib/groq'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { fileUrl, manualData, studentId } = await request.json()

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Missing studentId' }, { status: 400 })
    }

    let analysis: any = {}
    let status = 'needs_review'

    if (manualData && Object.values(manualData).some((v: any) => v?.trim())) {
      // Manual entry
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
      // AI analysis
      let content = ''
      let isImage = false
      const lowerUrl = fileUrl.toLowerCase()

      try {
        if (lowerUrl.includes('.png') || lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg') || lowerUrl.includes('.webp')) {
          // Pass the URL directly to the Multi-modal Vision API
          content = fileUrl
          isImage = true
        } else if (lowerUrl.includes('.pdf')) {
          // Parse PDF text securely
          const response = await fetch(fileUrl)
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const pdfParse = require('pdf-parse')
          const pdfData = await pdfParse(buffer)
          content = pdfData.text
        } else {
          // Fallback text parser
          const response = await fetch(fileUrl)
          content = await response.text()
        }
      } catch (err: any) {
        console.error('Police file fetch error:', err)
        return NextResponse.json({ success: false, error: 'Could not read document content: ' + err.message }, { status: 400 })
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
      return NextResponse.json({ success: false, error: 'Provide file or manual data' }, { status: 400 })
    }

    // Upsert verification — correct column names
    const { data: existing } = await supabaseAdmin.from('verifications')
      .select('id').eq('student_id', studentId).eq('type', 'police').maybeSingle()

    if (existing) {
      await supabaseAdmin.from('verifications').update({
        status,
        ai_result: analysis,
        ai_confidence: analysis.confidence || 0,
        document_url: fileUrl || null,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
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

    return NextResponse.json({ success: true, analysis, status })
  } catch (error: any) {
    console.error('Police verification error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Verification failed' }, { status: 500 })
  }
}

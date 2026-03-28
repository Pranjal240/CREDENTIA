import { NextResponse } from 'next/server'
import { analyzeAadhaar } from '@/lib/groq'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { fileUrl, studentId, textContent } = await req.json()
    const supabase = createSupabaseServerClient()

    let content = textContent || ''

    if (fileUrl) {
      try {
        const res = await fetch(fileUrl)
        content = await res.text()
      } catch {
        content = `Aadhaar document from ${fileUrl}`
      }
    }

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 })
    }

    const analysis = await analyzeAadhaar(content)

    // Save to verifications - NEVER store full Aadhaar
    await supabase.from('verifications').upsert({
      user_id: studentId,
      type: 'aadhaar',
      status: analysis.confidence >= 75 ? 'ai_approved' : 'needs_review',
      document_url: fileUrl,
      ai_confidence: analysis.confidence,
      ai_result: {
        verified: analysis.verified,
        name: analysis.name,
        dob: analysis.dob,
        gender: analysis.gender,
        state: analysis.state,
        aadhaar_last4: analysis.aadhaar_last4,
        confidence: analysis.confidence,
        // NEVER store full Aadhaar number
      },
    }, { onConflict: 'user_id,type' })

    // Update students table with safe data only
    if (analysis.confidence >= 75) {
      await supabase.from('students').update({
        aadhaar_verified: true,
        aadhaar_last4: analysis.aadhaar_last4,
        aadhaar_name: analysis.name,
        aadhaar_state: analysis.state,
        aadhaar_dob: analysis.dob,
      }).eq('id', studentId)
    }

    // Return safe data only (no full Aadhaar)
    return NextResponse.json({
      success: true,
      analysis: {
        verified: analysis.verified,
        name: analysis.name,
        dob: analysis.dob,
        gender: analysis.gender,
        state: analysis.state,
        aadhaar_last4: analysis.aadhaar_last4,
        confidence: analysis.confidence,
      },
    })
  } catch (error: any) {
    console.error('Aadhaar verification error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

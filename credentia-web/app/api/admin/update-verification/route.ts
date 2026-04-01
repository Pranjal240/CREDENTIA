import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { verificationId, status, confidence, adminId } = await req.json()
    if (!verificationId || !status) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString()
    }
    if (confidence !== undefined) {
      updateData.ai_confidence = Number(confidence)
    }

    const { error } = await supabaseAdmin.from('verifications').update(updateData).eq('id', verificationId)

    if (error) throw error

    await supabaseAdmin.from('audit_logs').insert({
      admin_id: adminId || 'unknown',
      action: 'admin_update_verification',
      target_id: verificationId,
      target_type: 'verification',
      metadata: { new_status: status }
    })

    return NextResponse.json({ success: true, updated: updateData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

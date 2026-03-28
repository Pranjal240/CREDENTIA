import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const { verificationId, studentId, action, reason } = await req.json()
    const supabase = createAdminSupabaseClient()

    if (action === 'approve') {
      await supabase.from('verifications').update({
        status: 'admin_verified',
        updated_at: new Date().toISOString(),
      }).eq('id', verificationId)

      await supabase.from('students').update({ police_verified: true }).eq('id', studentId)
    } else if (action === 'reject') {
      await supabase.from('verifications').update({
        status: 'rejected',
        rejection_reason: reason || 'Not submitted by admin',
        updated_at: new Date().toISOString(),
      }).eq('id', verificationId)
    } else if (action === 'toggle_share') {
      const { data: student } = await supabase.from('students').select('police_share_with_companies').eq('id', studentId).single()
      await supabase.from('students').update({ police_share_with_companies: !student?.police_share_with_companies }).eq('id', studentId)
    }

    // Add notification
    if (studentId && action !== 'toggle_share') {
      await supabase.from('notifications').insert({
        user_id: studentId,
        title: `Police Certificate ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: action === 'approve'
          ? 'Your police certificate has been verified by CREDENTIA admin. Your profile is now fully verified!'
          : `Your police certificate was rejected. Reason: ${reason || 'Contact support for details.'}`,
        type: 'verification',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

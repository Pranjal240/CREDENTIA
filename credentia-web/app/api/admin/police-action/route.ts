import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { verificationId, action } = await request.json()

    if (!verificationId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'admin_verified' : 'rejected'

    // Update verification status
    const { data: verification, error: verErr } = await supabaseAdmin
      .from('verifications')
      .update({
        status: newStatus,
        admin_reviewed_at: new Date().toISOString(),
      })
      .eq('id', verificationId)
      .select('student_id')
      .single()

    if (verErr) throw verErr

    // If approved, update student's police_verified flag
    if (action === 'approve' && verification?.student_id) {
      await supabaseAdmin.from('students').update({
        police_verified: true,
        updated_at: new Date().toISOString(),
      }).eq('id', verification.student_id)
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error: any) {
    console.error('Police action error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Action failed' }, { status: 500 })
  }
}

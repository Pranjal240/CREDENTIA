import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { audit, cleanText, requireAdmin } from '@/lib/admin'
import { recalcStudent } from '@/lib/student-scores'

export const dynamic = 'force-dynamic'

const ALLOWED = ['admin_verified', 'rejected', 'needs_review', 'pending'] as const

/**
 * An admin decision on one document: approve it, reject it with a reason, or
 * send it back to review. The student's scores are recalculated and the action
 * is logged. The admin comes from the session.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const verificationId = typeof body?.verificationId === 'string' ? body.verificationId : ''
  const status = typeof body?.status === 'string' ? body.status : ''
  if (!verificationId || !(ALLOWED as readonly string[]).includes(status)) return NextResponse.json({ error: 'Choose a document and a decision.' }, { status: 400 })
  const reason = cleanText(body?.reason, 500)
  if (status === 'rejected' && !reason) return NextResponse.json({ error: 'Give the student a reason for rejecting this document.' }, { status: 400 })

  try {
    const { data: before } = await supabaseAdmin.from('verifications').select('id, student_id, type, status').eq('id', verificationId).maybeSingle()
    if (!before) return NextResponse.json({ error: 'That document was not found.' }, { status: 404 })

    const now = new Date().toISOString()
    const { error } = await supabaseAdmin
      .from('verifications')
      .update({
        status,
        updated_at: now,
        admin_reviewed_by: admin.userId,
        admin_reviewed_at: now,
        rejection_reason: status === 'rejected' ? reason : null,
      })
      .eq('id', verificationId)
    if (error) throw error

    await recalcStudent(before.student_id as string)
    await audit(admin, 'admin_update_verification', 'verification', verificationId, { type: before.type, student_id: before.student_id, from: before.status, to: status, reason: reason || undefined })

    // Tell the student, so a rejection is not found by accident.
    await supabaseAdmin.from('notifications').insert({
      user_id: before.student_id,
      title: status === 'rejected' ? 'A document was rejected' : status === 'admin_verified' ? 'A document was verified' : 'A document is under review',
      message: status === 'rejected' ? `Your ${String(before.type).replace(/_/g, ' ')} was rejected: ${reason}` : status === 'admin_verified' ? `An admin verified your ${String(before.type).replace(/_/g, ' ')}.` : `Your ${String(before.type).replace(/_/g, ' ')} is being reviewed again.`,
      type: 'verification',
      action_url: '/dashboard/student/saved',
      is_read: false,
    })

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error('[admin/update-verification] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The decision could not be saved.' }, { status: 500 })
  }
}

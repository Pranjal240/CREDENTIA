import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { audit, cleanText, requireAdmin } from '@/lib/admin'
import { recalcStudent } from '@/lib/student-scores'

export const dynamic = 'force-dynamic'

/** Approves or rejects several documents at once. Students are told and their scores recalculated. */
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const ids: string[] = Array.isArray(body?.verificationIds) ? body.verificationIds.filter((id: unknown): id is string => typeof id === 'string').slice(0, 100) : []
  const action = body?.action === 'reject' ? 'reject' : body?.action === 'approve' ? 'approve' : ''
  const reason = cleanText(body?.reason, 500)
  if (ids.length === 0 || !action) return NextResponse.json({ error: 'Select documents and a decision.' }, { status: 400 })
  if (action === 'reject' && !reason) return NextResponse.json({ error: 'Give a reason for rejecting these documents.' }, { status: 400 })

  try {
    const status = action === 'approve' ? 'admin_verified' : 'rejected'
    const now = new Date().toISOString()
    const { data: updated, error } = await supabaseAdmin
      .from('verifications')
      .update({ status, updated_at: now, admin_reviewed_by: admin.userId, admin_reviewed_at: now, rejection_reason: action === 'reject' ? reason : null })
      .in('id', ids)
      .select('id, student_id, type')
    if (error) throw error

    const rows = updated ?? []
    const students = Array.from(new Set(rows.map((row) => row.student_id as string)))
    await Promise.all(students.map((id) => recalcStudent(id)))
    await supabaseAdmin.from('notifications').insert(
      rows.map((row) => ({
        user_id: row.student_id,
        title: action === 'approve' ? 'A document was verified' : 'A document was rejected',
        message: action === 'approve' ? `An admin verified your ${String(row.type).replace(/_/g, ' ')}.` : `Your ${String(row.type).replace(/_/g, ' ')} was rejected: ${reason}`,
        type: 'verification',
        action_url: '/dashboard/student/saved',
        is_read: false,
      })),
    )
    await audit(admin, `bulk_${action}`, 'verifications', ids.join(',').slice(0, 250), { count: rows.length, new_status: status, reason: reason || undefined })

    return NextResponse.json({ success: true, updated: rows.length })
  } catch (error) {
    console.error('[admin/bulk-approve] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The decisions could not be saved.' }, { status: 500 })
  }
}

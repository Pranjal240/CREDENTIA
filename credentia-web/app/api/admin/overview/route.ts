import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { countRows, fetchAll } from '@/lib/admin-data'
import { isPendingStatus, isRejectedStatus, isVerifiedStatus } from '@/lib/status'
import type { AdminOverview, ApprovalItem, QueueItem } from '@/lib/admin-types'

export const dynamic = 'force-dynamic'

/** Everything the admin home page shows: the counts, what is waiting for a decision, and what just happened. */
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const [students, companies, universities, admins, inactive, openConversations, unreadMessages, docs, pendingUniversities, pendingCompanies, recent, audit] = await Promise.all([
      countRows('profiles', (q) => q.eq('role', 'student')),
      countRows('profiles', (q) => q.eq('role', 'company')),
      countRows('profiles', (q) => q.eq('role', 'university')),
      countRows('profiles', (q) => q.eq('role', 'admin')),
      countRows('profiles', (q) => q.eq('is_active', false)),
      countRows('support_conversations', (q) => q.eq('status', 'open')),
      countRows('support_messages', (q) => q.eq('is_read', false).neq('sender_role', 'admin')),
      fetchAll<{ id: string; student_id: string; type: string; status: string; ai_confidence: number | null; updated_at: string | null }>((from, to) =>
        supabaseAdmin.from('verifications').select('id, student_id, type, status, ai_confidence, updated_at').neq('status', 'not_submitted').order('id').range(from, to),
      ),
      supabaseAdmin.from('universities').select('id, university_name, city, state').eq('is_verified', false).limit(50),
      supabaseAdmin.from('companies').select('id, company_name, industry, state').eq('is_verified', false).limit(50),
      supabaseAdmin.from('profiles').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(8),
      supabaseAdmin.from('audit_logs').select('id, actor_email, action, target_type, target_id, created_at').order('created_at', { ascending: false }).limit(8),
    ])

    const byType: AdminOverview['documents']['byType'] = {}
    let verified = 0
    let pending = 0
    let rejected = 0
    for (const doc of docs) {
      const bucket = (byType[doc.type] ??= { verified: 0, pending: 0, rejected: 0 })
      if (isVerifiedStatus(doc.status)) {
        verified += 1
        bucket.verified += 1
      } else if (isPendingStatus(doc.status)) {
        pending += 1
        bucket.pending += 1
      } else if (isRejectedStatus(doc.status)) {
        rejected += 1
        bucket.rejected += 1
      }
    }

    // The ten documents that have waited longest for a person to look at them.
    const waiting = docs.filter((doc) => isPendingStatus(doc.status)).sort((a, b) => (a.updated_at ?? '').localeCompare(b.updated_at ?? '')).slice(0, 10)
    const waitingStudents = waiting.length
      ? await supabaseAdmin.from('students').select('id, name, email').in('id', Array.from(new Set(waiting.map((doc) => doc.student_id))))
      : { data: [] as { id: string; name: string | null; email: string | null }[] }
    const nameOf = new Map((waitingStudents.data ?? []).map((s) => [s.id, s.name || s.email || 'Student']))
    const queue: QueueItem[] = waiting.map((doc) => ({
      id: doc.id,
      student_id: doc.student_id,
      student_name: nameOf.get(doc.student_id) ?? 'Student',
      type: doc.type,
      status: doc.status,
      ai_confidence: doc.ai_confidence,
      updated_at: doc.updated_at,
    }))

    // Organisations that signed up but are not approved yet. The sign up date lives on the account.
    const orgRows = [
      ...(pendingUniversities.data ?? []).map((row) => ({ id: row.id as string, kind: 'university' as const, name: (row.university_name as string) || 'Unnamed university', place: [row.city, row.state].filter(Boolean).join(', ') })),
      ...(pendingCompanies.data ?? []).map((row) => ({ id: row.id as string, kind: 'company' as const, name: (row.company_name as string) || 'Unnamed company', place: [row.industry, row.state].filter(Boolean).join(', ') })),
    ]
    const accounts = orgRows.length ? await supabaseAdmin.from('profiles').select('id, created_at').in('id', orgRows.slice(0, 60).map((row) => row.id)) : { data: [] as { id: string; created_at: string | null }[] }
    const joined = new Map((accounts.data ?? []).map((a) => [a.id, a.created_at]))
    const items: ApprovalItem[] = orgRows
      .map((row) => ({ ...row, created_at: joined.get(row.id) ?? null }))
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      .slice(0, 8)

    const payload: AdminOverview = {
      generatedAt: new Date().toISOString(),
      users: { total: students + companies + universities + admins, students, companies, universities, admins, inactive },
      documents: { total: docs.length, verified, pending, rejected, byType },
      approvals: { universities: (pendingUniversities.data ?? []).length, companies: (pendingCompanies.data ?? []).length, items },
      support: { open: openConversations, unread: unreadMessages },
      queue,
      recent: (recent.data ?? []) as AdminOverview['recent'],
      audit: (audit.data ?? []) as AdminOverview['audit'],
    }
    return NextResponse.json(payload)
  } catch (error) {
    console.error('[admin/overview] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The overview could not be loaded.' }, { status: 500 })
  }
}

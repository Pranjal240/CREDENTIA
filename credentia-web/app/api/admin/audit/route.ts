import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import type { AdminAudit } from '@/lib/admin-types'

export const dynamic = 'force-dynamic'

/** The most recent audit log entries, newest first. */
export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const asked = Number(new URL(request.url).searchParams.get('limit'))
  const limit = Number.isFinite(asked) && asked > 0 ? Math.min(Math.floor(asked), 1000) : 400

  const { data, error } = await supabaseAdmin
    .from('audit_logs')
    .select('id, actor_id, actor_email, action, target_type, target_id, details, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[admin/audit] failed:', error.message)
    return NextResponse.json({ error: 'The audit log could not be loaded.' }, { status: 500 })
  }
  return NextResponse.json({ rows: (data ?? []) as AdminAudit[], limit })
}

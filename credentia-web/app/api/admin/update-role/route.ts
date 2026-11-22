import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { audit, requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

/** Changes a user's role. An admin cannot change their own role, so the platform is never left without one. */
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const userId = typeof body?.userId === 'string' ? body.userId : ''
  const newRole = typeof body?.newRole === 'string' ? body.newRole : ''
  if (!userId || !['student', 'company', 'university', 'admin'].includes(newRole)) return NextResponse.json({ error: 'Choose a user and a role.' }, { status: 400 })
  if (userId === admin.userId) return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 400 })

  try {
    const { data: before } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).maybeSingle()
    const { error } = await supabaseAdmin.from('profiles').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', userId)
    if (error) throw error
    await audit(admin, 'change_role', 'user', userId, { from: before?.role ?? null, to: newRole })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/update-role] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The role could not be changed.' }, { status: 500 })
  }
}

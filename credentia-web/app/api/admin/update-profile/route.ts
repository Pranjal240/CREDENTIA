import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { audit, cleanText, requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

/** An admin editing a user's name or phone, or switching the account on or off. Role changes have their own route. */
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const userId = typeof body?.userId === 'string' ? body.userId : ''
  const updates = body?.updates && typeof body.updates === 'object' ? body.updates : null
  if (!userId || !updates) return NextResponse.json({ error: 'Choose a user and what to change.' }, { status: 400 })
  if (userId === admin.userId && updates.is_active === false) return NextResponse.json({ error: 'You cannot switch off your own account.' }, { status: 400 })

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ('full_name' in updates) patch.full_name = cleanText(updates.full_name, 120)
  if ('phone' in updates) patch.phone = cleanText(updates.phone, 20) || null
  if ('is_active' in updates) patch.is_active = Boolean(updates.is_active)
  if (Object.keys(patch).length === 1) return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })

  try {
    const { error } = await supabaseAdmin.from('profiles').update(patch).eq('id', userId)
    if (error) throw error
    const { updated_at: _ignored, ...changes } = patch
    await audit(admin, 'admin_updated_user', 'user_profile', userId, changes)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/update-profile] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The user could not be saved.' }, { status: 500 })
  }
}

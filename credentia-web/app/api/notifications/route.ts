import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/** The signed in user's id from the session cookie, or null. Never trusts a client supplied id. */
async function sessionUserId(): Promise<string | null> {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return error || !user ? null : user.id
}

/** Latest notifications for the signed in user. */
export async function GET() {
  const userId = await sessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('id, title, message, type, action_url, is_read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notifications: data ?? [] })
}

/** Marks notifications read. Body: { ids?: string[] }. Without ids, every unread one is marked. */
export async function POST(request: Request) {
  const userId = await sessionUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const ids: string[] | undefined = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === 'string') : undefined

  let query = supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
  if (ids && ids.length > 0) query = query.in('id', ids)

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

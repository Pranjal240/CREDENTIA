import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCaller } from '@/lib/api-auth'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : ''

/**
 * The signed in person's own support thread: their latest conversation with
 * the team and its messages. `?markRead=1` marks the team's replies as read.
 * The caller comes from the session, so nobody can read another thread.
 */
export async function GET(request: Request) {
  const caller = await getCaller()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: conversation } = await supabaseAdmin
    .from('support_conversations')
    .select('id, status, subject, last_message_at')
    .eq('user_id', caller.userId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (!conversation) return NextResponse.json({ conversation: null, messages: [], unread: 0 })

  const { data: rows } = await supabaseAdmin
    .from('support_messages')
    .select('id, sender_role, content, file_url, file_name, is_read, created_at')
    .eq('conversation_id', conversation.id)
    .order('created_at', { ascending: true })
    .limit(200)

  const messages = rows ?? []
  const unread = messages.filter((message) => !message.is_read && message.sender_role !== caller.role).length

  if (unread > 0 && new URL(request.url).searchParams.get('markRead') === '1') {
    await supabaseAdmin
      .from('support_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversation.id)
      .neq('sender_role', caller.role)
      .eq('is_read', false)
    return NextResponse.json({ conversation, messages: messages.map((m) => ({ ...m, is_read: true })), unread: 0 })
  }

  return NextResponse.json({ conversation, messages, unread })
}

/** Adds a message to the caller's open conversation, starting one when there is none. */
export async function POST(request: Request) {
  const caller = await getCaller()
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`support-send:${caller.userId}`, 30, 60 * 60_000)) {
    return NextResponse.json({ error: 'You are sending messages very quickly. Please wait a little.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const content = clean(body?.content, 2000)
  if (!content) return NextResponse.json({ error: 'Write a message first.' }, { status: 400 })

  try {
    const { data: existing } = await supabaseAdmin
      .from('support_conversations')
      .select('id')
      .eq('user_id', caller.userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let conversationId = existing?.id as string | undefined
    if (!conversationId) {
      const { data: created, error } = await supabaseAdmin
        .from('support_conversations')
        .insert({ user_id: caller.userId, user_role: caller.role, user_name: caller.name || 'User', user_email: caller.email, status: 'open', subject: content.slice(0, 100) })
        .select('id')
        .single()
      if (error) throw error
      conversationId = created.id as string
    }

    const { data: message, error: messageError } = await supabaseAdmin
      .from('support_messages')
      .insert({ conversation_id: conversationId, sender_id: caller.userId, sender_role: caller.role, content, is_read: false })
      .select('id, sender_role, content, file_url, file_name, is_read, created_at')
      .single()
    if (messageError) throw messageError

    const now = new Date().toISOString()
    await supabaseAdmin.from('support_conversations').update({ last_message_at: now, updated_at: now }).eq('id', conversationId)

    return NextResponse.json({ success: true, conversationId, message })
  } catch (error) {
    console.error('[support/mine] send failed:', (error as Error).message)
    return NextResponse.json({ error: 'The message could not be sent. Please try again.' }, { status: 500 })
  }
}

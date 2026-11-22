import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { audit, cleanText, requireAdmin } from '@/lib/admin'
import { asId, countRows, fetchAll } from '@/lib/admin-data'
import { roleHome, type DashRole } from '@/lib/dashboard-nav'
import type { SupportConversation, SupportMessage } from '@/lib/admin-types'

export const dynamic = 'force-dynamic'

/**
 * The support inbox. Without parameters it lists every conversation with its
 * unread count and the latest message. With ?conversation= it returns that
 * thread. Only admins reach it, and the admin comes from the session.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const params = new URL(request.url).searchParams
    // The dock badge only needs the number, so it does not load the whole inbox.
    if (params.get('summary') === '1') {
      return NextResponse.json({ unread: await countRows('support_messages', (q) => q.eq('is_read', false).neq('sender_role', 'admin')) })
    }

    const wanted = params.get('conversation')
    if (wanted) {
      const id = asId(wanted)
      if (!id) return NextResponse.json({ error: 'That conversation id is not valid.' }, { status: 400 })
      const [conversation, messages] = await Promise.all([
        supabaseAdmin.from('support_conversations').select('id, user_id, user_role, user_name, user_email, status, subject, last_message_at, created_at').eq('id', id).maybeSingle(),
        supabaseAdmin.from('support_messages').select('id, conversation_id, sender_id, sender_role, content, file_url, file_name, file_type, is_read, created_at').eq('conversation_id', id).order('created_at', { ascending: true }).limit(300),
      ])
      if (!conversation.data) return NextResponse.json({ error: 'That conversation was not found.' }, { status: 404 })
      return NextResponse.json({ conversation: conversation.data, messages: (messages.data ?? []) as SupportMessage[] })
    }

    const [conversations, unread, latest] = await Promise.all([
      fetchAll<Omit<SupportConversation, 'unread_count' | 'preview' | 'preview_role'>>((from, to) =>
        supabaseAdmin
          .from('support_conversations')
          .select('id, user_id, user_role, user_name, user_email, status, subject, last_message_at, created_at')
          .order('last_message_at', { ascending: false, nullsFirst: false })
          .order('id')
          .range(from, to),
        3000,
      ),
      fetchAll<{ id: string; conversation_id: string }>((from, to) =>
        supabaseAdmin.from('support_messages').select('id, conversation_id').eq('is_read', false).neq('sender_role', 'admin').order('id').range(from, to),
      ),
      supabaseAdmin.from('support_messages').select('conversation_id, content, sender_role, created_at').order('created_at', { ascending: false }).limit(800),
    ])

    const unreadBy = new Map<string, number>()
    for (const row of unread) unreadBy.set(row.conversation_id, (unreadBy.get(row.conversation_id) ?? 0) + 1)
    const lastBy = new Map<string, { content: string; sender_role: string }>()
    for (const row of latest.data ?? []) if (!lastBy.has(row.conversation_id as string)) lastBy.set(row.conversation_id as string, { content: row.content as string, sender_role: row.sender_role as string })

    const list: SupportConversation[] = conversations.map((conversation) => {
      const last = lastBy.get(conversation.id)
      return {
        ...conversation,
        unread_count: unreadBy.get(conversation.id) ?? 0,
        preview: (last?.content ?? conversation.subject ?? '').replace(/\s+/g, ' ').slice(0, 120),
        preview_role: last?.sender_role ?? conversation.user_role,
      }
    })
    return NextResponse.json({ conversations: list, unread: unread.length })
  } catch (error) {
    console.error('[admin/support] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The inbox could not be loaded.' }, { status: 500 })
  }
}

/** Replies, marks a thread read, resolves or reopens it, or deletes it. */
export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const action = typeof body?.action === 'string' ? body.action : ''
  const conversationId = asId(body?.conversationId)
  if (!conversationId) return NextResponse.json({ error: 'Choose a conversation.' }, { status: 400 })

  try {
    const { data: conversation } = await supabaseAdmin.from('support_conversations').select('id, user_id, user_role, user_name, user_email, subject, status').eq('id', conversationId).maybeSingle()
    if (!conversation) return NextResponse.json({ error: 'That conversation was not found.' }, { status: 404 })

    if (action === 'reply') {
      const content = cleanText(body?.content, 2000)
      if (!content) return NextResponse.json({ error: 'Write a reply first.' }, { status: 400 })
      const { data: message, error } = await supabaseAdmin
        .from('support_messages')
        .insert({ conversation_id: conversationId, sender_id: admin.userId, sender_role: 'admin', content, is_read: false })
        .select('id, conversation_id, sender_id, sender_role, content, file_url, file_name, file_type, is_read, created_at')
        .single()
      if (error) throw error

      const now = new Date().toISOString()
      await supabaseAdmin.from('support_conversations').update({ last_message_at: now, updated_at: now }).eq('id', conversationId)
      // Their own messages in the thread are now answered.
      await supabaseAdmin.from('support_messages').update({ is_read: true }).eq('conversation_id', conversationId).neq('sender_role', 'admin').eq('is_read', false)
      await supabaseAdmin.from('notifications').insert({
        user_id: conversation.user_id,
        title: 'Reply from the Credentia team',
        message: content.slice(0, 140),
        type: 'support',
        action_url: roleHome(conversation.user_role as DashRole),
        is_read: false,
      })
      return NextResponse.json({ success: true, message })
    }

    if (action === 'read') {
      await supabaseAdmin.from('support_messages').update({ is_read: true }).eq('conversation_id', conversationId).neq('sender_role', 'admin').eq('is_read', false)
      return NextResponse.json({ success: true })
    }

    if (action === 'status') {
      const status = body?.status === 'resolved' ? 'resolved' : body?.status === 'open' ? 'open' : ''
      if (!status) return NextResponse.json({ error: 'Choose open or resolved.' }, { status: 400 })
      const { error } = await supabaseAdmin.from('support_conversations').update({ status, updated_at: new Date().toISOString() }).eq('id', conversationId)
      if (error) throw error
      await audit(admin, status === 'resolved' ? 'support_resolved' : 'support_reopened', 'support_conversation', conversationId, { user: conversation.user_email, subject: conversation.subject })
      return NextResponse.json({ success: true, status })
    }

    if (action === 'delete') {
      // Messages first, because they point at the conversation.
      const { error: messageError } = await supabaseAdmin.from('support_messages').delete().eq('conversation_id', conversationId)
      if (messageError) throw messageError
      const { error } = await supabaseAdmin.from('support_conversations').delete().eq('id', conversationId)
      if (error) throw error
      await audit(admin, 'support_deleted', 'support_conversation', conversationId, { user: conversation.user_email, subject: conversation.subject })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'That action is not supported.' }, { status: 400 })
  } catch (error) {
    console.error('[admin/support] failed:', (error as Error).message)
    return NextResponse.json({ error: 'That could not be done. Please try again.' }, { status: 500 })
  }
}

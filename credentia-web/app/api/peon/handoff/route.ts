import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCaller } from '@/lib/api-auth'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : ''

/**
 * Sends a conversation to the human support team after the person confirmed it
 * in Peon. It joins their open conversation when they have one, so the admins
 * see a single thread, and starts a new one otherwise.
 */
export async function POST(request: Request) {
  const caller = await getCaller()
  if (!caller) return NextResponse.json({ error: 'Sign in to contact support.' }, { status: 401 })
  if (!rateLimit(`handoff:${caller.userId}`, 4, 60 * 60_000)) {
    return NextResponse.json({ error: 'You have sent several requests already. The team will reply soon.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const subject = clean(body?.subject, 100) || 'Help needed'
  const summary = clean(body?.summary, 900)
  if (!summary) return NextResponse.json({ error: 'There is nothing to send.' }, { status: 400 })

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
        .insert({ user_id: caller.userId, user_role: caller.role, user_name: caller.name || 'User', user_email: caller.email, status: 'open', subject })
        .select('id')
        .single()
      if (error) throw error
      conversationId = created.id as string
    }

    const { error: messageError } = await supabaseAdmin.from('support_messages').insert({
      conversation_id: conversationId,
      sender_id: caller.userId,
      sender_role: caller.role,
      content: `Sent from Peon.\n\n${summary}`,
      is_read: false,
    })
    if (messageError) throw messageError

    const now = new Date().toISOString()
    await supabaseAdmin.from('support_conversations').update({ last_message_at: now, updated_at: now }).eq('id', conversationId)

    return NextResponse.json({ success: true, conversationId })
  } catch (error) {
    console.error('[peon/handoff] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The message could not be sent. Please try again.' }, { status: 500 })
  }
}

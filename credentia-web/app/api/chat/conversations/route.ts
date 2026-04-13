import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('support_conversations')
      .select(`
        *,
        support_messages (
          id,
          content,
          sender_role,
          is_read,
          created_at,
          file_url
        )
      `)
      .order('last_message_at', { ascending: false })

    // Admin sees all, others see only their own
    if (role !== 'admin') {
      query = query.eq('user_id', userId)
    }

    const { data: conversations, error } = await query

    if (error) throw error

    // Add unread count and last message preview
    const enriched = (conversations || []).map((conv: any) => {
      const messages = conv.support_messages || []
      const unreadCount = messages.filter((m: any) => !m.is_read && m.sender_role !== role).length
      const lastMessage = messages.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]

      return {
        ...conv,
        unread_count: unreadCount,
        last_message_preview: lastMessage?.content?.slice(0, 80) || '',
        last_message_role: lastMessage?.sender_role || '',
        total_messages: messages.length,
        support_messages: undefined, // Don't send full messages array
      }
    })

    return NextResponse.json({ success: true, conversations: enriched })
  } catch (error: any) {
    console.error('Chat conversations error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { conversationId, status } = await req.json()
    if (!conversationId || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('support_conversations')
      .update({ status })
      .eq('id', conversationId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update status error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE a conversation and all its messages
export async function DELETE(req: Request) {
  try {
    const { conversationId } = await req.json()
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
    }

    // Delete messages first (FK constraint)
    const { error: msgErr } = await supabaseAdmin
      .from('support_messages')
      .delete()
      .eq('conversation_id', conversationId)

    if (msgErr) throw msgErr

    // Delete the conversation
    const { error: convErr } = await supabaseAdmin
      .from('support_conversations')
      .delete()
      .eq('id', conversationId)

    if (convErr) throw convErr

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete conversation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

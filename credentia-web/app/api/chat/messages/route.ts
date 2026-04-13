import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })
    }

    const { data: messages, error } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, messages: messages || [] })
  } catch (error: any) {
    console.error('Chat messages error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Mark messages as read
export async function POST(req: Request) {
  try {
    const { conversationId, readerRole } = await req.json()

    if (!conversationId || !readerRole) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Mark all messages NOT from the reader's role as read
    const { error } = await supabaseAdmin
      .from('support_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_role', readerRole)
      .eq('is_read', false)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

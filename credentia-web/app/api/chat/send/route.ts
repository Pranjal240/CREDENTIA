import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { userId, userRole, userName, userEmail, content, fileUrl, fileName, fileType, conversationId } = await req.json()

    if (!userId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing userId or content' }, { status: 400 })
    }

    let convId = conversationId

    // Create conversation if none exists
    if (!convId) {
      // Check for existing open conversation
      const { data: existing } = await supabaseAdmin
        .from('support_conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing) {
        convId = existing.id
      } else {
        const { data: newConv, error: convErr } = await supabaseAdmin
          .from('support_conversations')
          .insert({
            user_id: userId,
            user_role: userRole || 'student',
            user_name: userName || 'User',
            user_email: userEmail || '',
            status: 'open',
            subject: content.slice(0, 100),
          })
          .select('id')
          .single()

        if (convErr) throw convErr
        convId = newConv.id
      }
    }

    // Insert message
    const { data: message, error: msgErr } = await supabaseAdmin
      .from('support_messages')
      .insert({
        conversation_id: convId,
        sender_id: userId,
        sender_role: userRole || 'student',
        content: content.trim(),
        file_url: fileUrl || null,
        file_name: fileName || null,
        file_type: fileType || null,
        is_read: false,
      })
      .select()
      .single()

    if (msgErr) throw msgErr

    // Update conversation last_message_at
    await supabaseAdmin
      .from('support_conversations')
      .update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', convId)

    return NextResponse.json({ success: true, message, conversationId: convId })
  } catch (error: any) {
    console.error('Chat send error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Check caller is admin
    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { userId, newRole } = await req.json()
    if (!userId || !['student', 'company', 'university', 'admin'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from('profiles').update({ role: newRole, updated_at: new Date().toISOString() }).eq('id', userId)
    if (error) throw error

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'change_role',
      target_type: 'user',
      target_id: userId,
      details: { new_role: newRole },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

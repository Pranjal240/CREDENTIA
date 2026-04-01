import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Admin role check
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, updates } = await req.json()
    if (!userId || !updates) return NextResponse.json({ error: 'Missing userId or updates' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) throw error

    // Log the action
    await supabaseAdmin.from('audit_logs').insert({
      admin_id: user.id,
      action: 'admin_updated_user',
      target_id: userId,
      target_type: 'user_profile',
      details: { updates }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET() {
  try {
    // Auth check — only admins can call this
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all universities and companies using service role (bypasses RLS)
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .in('role', ['university', 'company'])
      .order('created_at', { ascending: false })

    if (error) throw error

    const universities = (profiles || []).filter(p => p.role === 'university')
    const companies = (profiles || []).filter(p => p.role === 'company')

    return NextResponse.json({ universities, companies })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

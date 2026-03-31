import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET() {
  try {
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

    const [
      { data: profiles },
      { data: verifications },
      { data: students },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('id, role, created_at').order('created_at', { ascending: true }),
      supabaseAdmin.from('verifications').select('id, type, status, ai_confidence, created_at').order('created_at', { ascending: true }),
      supabaseAdmin.from('students').select('id, ats_score, cgpa, degree_verified, police_verified, aadhaar_verified, created_at').order('created_at', { ascending: true }),
    ])

    return NextResponse.json({
      profiles: profiles || [],
      verifications: verifications || [],
      students: students || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

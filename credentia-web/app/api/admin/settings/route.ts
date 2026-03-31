import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

async function getAdminUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET() {
  try {
    const user = await getAdminUser()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data, error } = await supabaseAdmin
      .from('platform_settings')
      .select('*')
      .order('key')

    if (error) throw error
    return NextResponse.json({ settings: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAdminUser()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { settings } = await req.json()
    if (!Array.isArray(settings)) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

    // Upsert all settings
    const { error } = await supabaseAdmin
      .from('platform_settings')
      .upsert(
        settings.map((s: { key: string; value: string }) => ({
          key: s.key,
          value: s.value,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })),
        { onConflict: 'key' }
      )

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

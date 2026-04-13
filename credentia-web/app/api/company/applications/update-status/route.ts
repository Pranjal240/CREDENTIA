import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'company') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { applicationId, status } = await req.json()
    if (!applicationId || !status) return NextResponse.json({ error: 'Missing applicationId or status' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .eq('company_id', user.id) // Ensure company owns it

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

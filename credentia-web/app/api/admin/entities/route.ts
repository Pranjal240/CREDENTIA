import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all profiles
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, phone, created_at, is_active, avatar_url')
      .in('role', ['university', 'company'])
      .order('created_at', { ascending: false })

    if (error) throw error
    
    const uIds = profiles?.filter(p => p.role === 'university').map(p => p.id) || []
    const cIds = profiles?.filter(p => p.role === 'company').map(p => p.id) || []
    
    // Fetch actual entity data
    const [{data: unis}, {data: comps}] = await Promise.all([
      uIds.length > 0 ? supabaseAdmin.from('universities').select('*').in('id', uIds) : { data: [] },
      cIds.length > 0 ? supabaseAdmin.from('companies').select('*').in('id', cIds) : { data: [] }
    ])

    const universities = (profiles || []).filter(p => p.role === 'university').map(p => ({
      ...p,
      entityData: unis?.find(u => u.id === p.id) || null
    }))
    
    const companies = (profiles || []).filter(p => p.role === 'company').map(p => ({
      ...p,
      entityData: comps?.find(c => c.id === p.id) || null
    }))

    return NextResponse.json({ universities, companies })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

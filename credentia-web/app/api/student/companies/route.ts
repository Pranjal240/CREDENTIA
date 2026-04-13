import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: companiesProfiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, is_active, avatar_url')
      .eq('role', 'company')
      .eq('is_active', true)

    if (error) throw error

    const cIds = companiesProfiles?.map(c => c.id) || []
    
    // Fetch actual entity data
    const { data: compsData } = await supabaseAdmin
      .from('companies')
      .select('*')
      .in('id', cIds)

    const companies = (companiesProfiles || []).map(p => ({
      ...p,
      entityData: compsData?.find(c => c.id === p.id) || null
    }))

    return NextResponse.json({ companies })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

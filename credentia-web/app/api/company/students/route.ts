import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch all public students with their verifications
    const { data: students, error: stuErr } = await supabaseAdmin
      .from('students')
      .select('*, verifications(*)')
      .eq('profile_is_public', true)

    if (stuErr) throw stuErr

    // Fetch matching profiles separately to avoid join issues
    const ids = (students || []).map((s: any) => s.id)
    let profilesMap: Record<string, any> = {}

    if (ids.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', ids)

      if (profiles) {
        profiles.forEach((p: any) => { profilesMap[p.id] = p })
      }
    }

    // Merge profile data into each student
    const merged = (students || []).map((s: any) => ({
      ...s,
      profiles: profilesMap[s.id] || null,
    }))

    return NextResponse.json({ students: merged })
  } catch (err: any) {
    console.error('[/api/company/students] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

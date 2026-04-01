import { NextResponse } from 'next/server'
import { createSupabaseServerClient, createAdminSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uid = session.user.id

    // Verify it's a university
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', uid).single()
    if (profile?.role !== 'university') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client to bypass RLS for verifications
    const supabaseAdmin = createAdminSupabaseClient()

    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*, profiles(email, full_name), verifications(*)')
      .eq('university_id', uid)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ students: data })
  } catch (error: any) {
    console.error('Error fetching university students:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify role and check verification via admin to bypass RLS
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'university') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data: uniData } = await supabaseAdmin.from('universities').select('is_verified').eq('id', user.id).single()
    if (!uniData?.is_verified) {
      return NextResponse.json({ is_verified: false, students: [], verifications: [] })
    }

    // Fetch students and verifications via admin to bypass RLS
    const { data: list } = await supabaseAdmin.from('students').select('*').eq('university_id', user.id)
    const stuList = list || []
    
    let verifs: any[] = []
    if (stuList.length > 0) {
      const ids = stuList.map((s: any) => s.id)
      const { data: vData } = await supabaseAdmin.from('verifications').select('*').in('student_id', ids).order('updated_at', { ascending: false })
      verifs = vData || []
    }

    return NextResponse.json({ 
      is_verified: true, 
      students: stuList, 
      verifications: verifs 
    })
  } catch (err: any) {
    console.error('[University Analytics API]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

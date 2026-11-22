import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: apps, error } = await supabaseAdmin
      .from('applications')
      .select('company_id, job_title, status, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ applications: apps || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

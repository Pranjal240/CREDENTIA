import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify company role
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'company') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch applications
    const { data: applications, error: appErr } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('company_id', user.id)
      .order('created_at', { ascending: false })

    if (appErr) throw appErr

    const studentIds = applications?.map(a => a.student_id) || []

    let applicantsInfo: any[] = []
    if (studentIds.length > 0) {
      // Fetch student data + verification counts + profiles
      const [ { data: students }, { data: profiles }, { data: verifs } ] = await Promise.all([
        supabaseAdmin.from('students').select('*').in('id', studentIds),
        supabaseAdmin.from('profiles').select('id, full_name, email, avatar_url').in('id', studentIds),
        supabaseAdmin.from('verifications').select('student_id').in('student_id', studentIds).in('status', ['verified', 'ai_approved', 'admin_verified'])
      ])

      applicantsInfo = (profiles || []).map(p => {
        const student = students?.find(s => s.id === p.id)
        const vCount = verifs?.filter(v => v.student_id === p.id).length || 0
        return {
          ...p,
          student,
          trust_score: student?.trust_score || 0,
          verifications: vCount
        }
      })
    }

    const fullApplications = (applications || []).map(app => ({
      ...app,
      applicant: applicantsInfo.find(a => a.id === app.student_id) || null
    }))

    // Mark notifications as read
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('type', 'application')
      .eq('is_read', false)

    return NextResponse.json({ applications: fullApplications })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

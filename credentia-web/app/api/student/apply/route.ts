import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify caller is a student
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'student') {
      return NextResponse.json({ error: 'Only students can apply' }, { status: 403 })
    }

    const { company_id, job_title, notes } = await req.json()
    if (!company_id || !job_title) {
      return NextResponse.json({ error: 'Missing company_id or job_title' }, { status: 400 })
    }

    // Check if already applied
    const { data: existingApp } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('student_id', user.id)
      .eq('company_id', company_id)
      .maybeSingle()

    if (existingApp) {
      return NextResponse.json({ error: 'You have already applied to this company' }, { status: 409 })
    }

    // Insert application using admin client (bypasses RLS)
    const { error: appErr } = await supabaseAdmin.from('applications').insert({
      student_id: user.id,
      company_id,
      job_title,
      company_notes: notes || null,
      status: 'pending',
      applied_via: 'platform'
    })

    if (appErr) throw appErr

    // Insert notification for the company (also bypasses RLS)
    const { error: notifErr } = await supabaseAdmin.from('notifications').insert({
      user_id: company_id,
      title: 'New Application Received',
      message: `${profile.full_name || 'A student'} has applied for the '${job_title}' role.`,
      type: 'application',
      action_url: '/dashboard/company/applicants',
      is_read: false
    })

    if (notifErr) {
      console.warn('[apply] Notification insert failed:', notifErr.message)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[student/apply] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

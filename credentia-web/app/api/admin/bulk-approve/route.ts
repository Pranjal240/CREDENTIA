import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const { verificationIds, action } = await req.json()
    if (!Array.isArray(verificationIds) || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'admin_verified' : 'rejected'

    const { error } = await supabaseAdmin
      .from('verifications')
      .update({
        status: newStatus,
        admin_reviewed_by: user.id,
        admin_reviewed_at: new Date().toISOString(),
      })
      .in('id', verificationIds)

    if (error) throw error

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: `bulk_${action}`,
      target_type: 'verifications',
      target_id: verificationIds.join(','),
      details: { count: verificationIds.length, new_status: newStatus },
    })

    return NextResponse.json({ success: true, updated: verificationIds.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

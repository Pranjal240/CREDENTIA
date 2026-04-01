import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { id, name, course, adminId } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const { error: pErr } = await supabaseAdmin.from('profiles').update({ full_name: name }).eq('id', id)
    const { error: sErr } = await supabaseAdmin.from('students').update({ name, course }).eq('id', id)
    
    if (pErr) throw pErr
    if (sErr) throw sErr

    await supabaseAdmin.from('audit_logs').insert({
      admin_id: adminId || 'unknown',
      action: 'admin_edit_student',
      target_id: id,
      target_type: 'student',
      metadata: { name, course }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

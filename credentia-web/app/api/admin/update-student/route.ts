import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { id, name, course, cgpa, percentage_10th, percentage_12th, adminId } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const { error: pErr } = await supabaseAdmin.from('profiles').update({ full_name: name }).eq('id', id)

    const studentUpdate: any = { name, course }
    if (cgpa !== undefined) studentUpdate.cgpa = cgpa
    if (percentage_10th !== undefined) studentUpdate.percentage_10th = percentage_10th
    if (percentage_12th !== undefined) studentUpdate.percentage_12th = percentage_12th
    studentUpdate.updated_at = new Date().toISOString()

    const { error: sErr } = await supabaseAdmin.from('students').update(studentUpdate).eq('id', id)
    
    if (pErr) throw pErr
    if (sErr) throw sErr

    await supabaseAdmin.from('audit_logs').insert({
      admin_id: adminId || 'unknown',
      action: 'admin_edit_student',
      target_id: id,
      target_type: 'student',
      metadata: { name, course, cgpa, percentage_10th, percentage_12th }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


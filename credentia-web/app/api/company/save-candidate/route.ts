import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCallerWithRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/**
 * Saves or removes a candidate for the signed in company, or updates the note
 * on a saved one. The company comes from the session. Only students with a
 * public profile can be saved.
 */
export async function POST(req: Request) {
  const caller = await getCallerWithRole(['company'])
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const studentId = typeof body?.studentId === 'string' ? body.studentId : ''
  const action = body?.action === 'unsave' ? 'unsave' : body?.action === 'note' ? 'note' : 'save'
  if (!studentId) return NextResponse.json({ error: 'Missing student.' }, { status: 400 })

  try {
    if (action === 'unsave') {
      const { error } = await supabaseAdmin.from('saved_candidates').delete().eq('company_id', caller.userId).eq('student_id', studentId)
      if (error) throw error
    } else if (action === 'note') {
      const notes = typeof body?.notes === 'string' ? body.notes.trim().slice(0, 1000) : ''
      const { error } = await supabaseAdmin.from('saved_candidates').update({ notes: notes || null }).eq('company_id', caller.userId).eq('student_id', studentId)
      if (error) throw error
    } else {
      const { data: student } = await supabaseAdmin.from('students').select('id, profile_is_public').eq('id', studentId).maybeSingle()
      if (!student || student.profile_is_public !== true) return NextResponse.json({ error: 'That profile is not public.' }, { status: 404 })
      const { error } = await supabaseAdmin.from('saved_candidates').upsert({ company_id: caller.userId, student_id: studentId }, { onConflict: 'company_id,student_id' })
      if (error) throw error
    }

    if (action !== 'note') {
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: caller.userId,
        actor_email: caller.email,
        action: action === 'save' ? 'save_candidate' : 'unsave_candidate',
        target_type: 'student',
        target_id: studentId,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[company/save-candidate] failed:', (error as Error).message)
    return NextResponse.json({ error: 'That could not be saved. Please try again.' }, { status: 500 })
  }
}

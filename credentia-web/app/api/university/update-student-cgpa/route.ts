import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUniversityAccess } from '@/lib/university-access'

export const dynamic = 'force-dynamic'

/**
 * Lets an approved university correct the CGPA of one of its own students. The
 * university comes from the session, the student must be linked to it, and the
 * change is written to the audit log.
 */
export async function POST(req: Request) {
  const access = await getUniversityAccess()
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!access.approved) return NextResponse.json({ error: 'Your institution is waiting for approval.' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const studentId = typeof body?.studentId === 'string' ? body.studentId : ''
  const cgpa = Number(body?.cgpa)
  if (!studentId || !Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) return NextResponse.json({ error: 'Enter a CGPA between 0 and 10.' }, { status: 400 })

  try {
    const { data: student } = await supabaseAdmin.from('students').select('id, university_id, cgpa').eq('id', studentId).maybeSingle()
    if (!student || student.university_id !== access.caller.userId) return NextResponse.json({ error: 'That student is not linked to your university.' }, { status: 403 })

    const { error } = await supabaseAdmin.from('students').update({ cgpa, updated_at: new Date().toISOString() }).eq('id', studentId)
    if (error) throw error

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: access.caller.userId,
      actor_email: access.caller.email,
      action: 'university_edit_cgpa',
      target_type: 'student',
      target_id: studentId,
      details: { from: student.cgpa ?? null, to: cgpa },
    })

    return NextResponse.json({ success: true, cgpa })
  } catch (error) {
    console.error('[university/update-student-cgpa] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The CGPA could not be saved.' }, { status: 500 })
  }
}

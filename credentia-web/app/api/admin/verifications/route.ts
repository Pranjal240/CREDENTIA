import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { asId, fetchAll, VERIFICATION_COLUMNS } from '@/lib/admin-data'
import type { AdminVerification } from '@/lib/admin-types'

export const dynamic = 'force-dynamic'

type Row = Omit<AdminVerification, 'student_name' | 'student_email'>

/**
 * Every submitted document with the student it belongs to. The list leaves out
 * the AI result to stay light. ?id= returns one document with its full result.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const wanted = new URL(request.url).searchParams.get('id')
    if (wanted) {
      const id = asId(wanted)
      if (!id) return NextResponse.json({ error: 'That document id is not valid.' }, { status: 400 })
      const { data: row } = await supabaseAdmin.from('verifications').select(`${VERIFICATION_COLUMNS}, ai_result`).eq('id', id).maybeSingle()
      if (!row) return NextResponse.json({ error: 'That document was not found.' }, { status: 404 })
      const { data: student } = await supabaseAdmin.from('students').select('name, email').eq('id', row.student_id).maybeSingle()
      return NextResponse.json({ row: { ...row, student_name: student?.name || student?.email || 'Student', student_email: student?.email || '' } })
    }

    const [rows, students] = await Promise.all([
      fetchAll<Row>((from, to) =>
        supabaseAdmin.from('verifications').select(VERIFICATION_COLUMNS).neq('status', 'not_submitted').order('updated_at', { ascending: false }).order('id').range(from, to),
      ),
      fetchAll<{ id: string; name: string | null; email: string | null }>((from, to) => supabaseAdmin.from('students').select('id, name, email').order('id').range(from, to)),
    ])
    const people = new Map(students.map((s) => [s.id, s]))
    const list: AdminVerification[] = rows.map((row) => {
      const student = people.get(row.student_id)
      return { ...row, student_name: student?.name || student?.email || 'Student', student_email: student?.email || '' }
    })
    return NextResponse.json({ rows: list })
  } catch (error) {
    console.error('[admin/verifications] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The documents could not be loaded.' }, { status: 500 })
  }
}

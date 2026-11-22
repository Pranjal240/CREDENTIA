import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { audit, cleanText, requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

const bounded = (value: unknown, min: number, max: number) => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n >= min && n <= max ? n : null
}

/** An admin correcting a student's name, course or marks. Only the fields that are sent change. */
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!id) return NextResponse.json({ error: 'Choose a student.' }, { status: 400 })
  const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key)

  try {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (has('name')) {
      const name = cleanText(body.name, 120)
      if (!name) return NextResponse.json({ error: 'The name cannot be empty.' }, { status: 400 })
      patch.name = name
    }
    if (has('course')) patch.course = cleanText(body.course, 80) || null
    if (has('cgpa')) patch.cgpa = bounded(body.cgpa, 0, 10)
    if (has('percentage_10th')) patch.percentage_10th = bounded(body.percentage_10th, 0, 100)
    if (has('percentage_12th')) patch.percentage_12th = bounded(body.percentage_12th, 0, 100)

    const { error } = await supabaseAdmin.from('students').update(patch).eq('id', id)
    if (error) throw error
    if (typeof patch.name === 'string') await supabaseAdmin.from('profiles').update({ full_name: patch.name, updated_at: patch.updated_at }).eq('id', id)

    const { updated_at: _ignored, ...changes } = patch
    await audit(admin, 'admin_edit_student', 'student', id, changes)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/update-student] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The student could not be saved.' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCallerWithRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '')
const number = (value: unknown, min: number, max: number) => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n >= min && n <= max ? n : null
}

/**
 * Updates the signed in student's own details. The student is identified from
 * the session, never from the request. Only the fields that are sent are
 * changed, so flipping the public switch cannot reset anything else.
 */
export async function POST(req: Request) {
  const caller = await getCallerWithRole(['student'])
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 })
  const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key)

  try {
    const now = new Date().toISOString()
    const studentPatch: Record<string, unknown> = { id: caller.userId, updated_at: now }
    const profilePatch: Record<string, unknown> = { updated_at: now }

    if (has('name')) {
      const name = text(body.name, 120)
      studentPatch.name = name
      profilePatch.full_name = name
    }
    if (has('phone')) profilePatch.phone = text(body.phone, 20) || null
    if (has('course')) studentPatch.course = text(body.course, 80) || null
    if (has('branch')) studentPatch.branch = text(body.branch, 80) || null
    if (has('city')) studentPatch.city = text(body.city, 80) || null
    if (has('state')) studentPatch.state = text(body.state, 80) || null
    if (has('graduation_year')) studentPatch.graduation_year = number(body.graduation_year, 1980, 2100)
    if (has('cgpa')) studentPatch.cgpa = number(body.cgpa, 0, 10)
    if (has('profile_is_public')) studentPatch.profile_is_public = Boolean(body.profile_is_public)

    if (has('university_id')) {
      const id = typeof body.university_id === 'string' ? body.university_id : ''
      if (id) {
        const { data: university } = await supabaseAdmin.from('profiles').select('id').eq('id', id).eq('role', 'university').maybeSingle()
        if (!university) return NextResponse.json({ error: 'That university does not exist.' }, { status: 400 })
      }
      studentPatch.university_id = id || null
      profilePatch.linked_university_id = id || null
    }

    const { error: studentError } = await supabaseAdmin.from('students').upsert(studentPatch, { onConflict: 'id' })
    if (studentError) throw studentError

    if (Object.keys(profilePatch).length > 1) {
      const { error: profileError } = await supabaseAdmin.from('profiles').update(profilePatch).eq('id', caller.userId)
      if (profileError) throw profileError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[student/update-profile] failed:', (error as Error).message)
    return NextResponse.json({ error: 'Your details could not be saved. Please try again.' }, { status: 500 })
  }
}

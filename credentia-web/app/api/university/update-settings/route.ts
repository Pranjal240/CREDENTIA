import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUniversityAccess } from '@/lib/university-access'

export const dynamic = 'force-dynamic'

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '')

/**
 * Saves the signed in university's profile. Approval and the access key are not
 * editable here: an admin decides approval and the key stays private.
 */
export async function POST(req: Request) {
  const access = await getUniversityAccess()
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 })
  const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key)

  try {
    const patch: Record<string, unknown> = { id: access.caller.userId }
    if (has('university_name')) {
      const name = text(body.university_name, 160)
      if (!name) return NextResponse.json({ error: 'The institution name cannot be empty.' }, { status: 400 })
      patch.university_name = name
    }
    if (has('city')) patch.city = text(body.city, 80) || null
    if (has('state')) patch.state = text(body.state, 80) || null
    if (has('ugc_id')) patch.ugc_id = text(body.ugc_id, 40) || null
    if (has('naac_grade')) patch.naac_grade = text(body.naac_grade, 8) || null

    const { error } = await supabaseAdmin.from('universities').upsert(patch, { onConflict: 'id' })
    if (error) throw error

    if (typeof patch.university_name === 'string') {
      await supabaseAdmin.from('profiles').update({ full_name: patch.university_name, updated_at: new Date().toISOString() }).eq('id', access.caller.userId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[university/update-settings] failed:', (error as Error).message)
    return NextResponse.json({ error: 'Your settings could not be saved. Please try again.' }, { status: 500 })
  }
}

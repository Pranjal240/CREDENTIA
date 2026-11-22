import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCallerWithRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/** Universities a student can link to. Names and places only, never the access key. */
export async function GET() {
  const caller = await getCallerWithRole(['student'])
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin.from('universities').select('id, university_name, city, state, is_verified').order('university_name', { ascending: true })
  if (error) return NextResponse.json({ error: 'Universities could not be loaded.' }, { status: 500 })

  return NextResponse.json({
    universities: (data ?? []).map((u) => ({ id: u.id as string, name: (u.university_name as string) || 'University', city: u.city as string | null, state: u.state as string | null, approved: u.is_verified === true })),
  })
}

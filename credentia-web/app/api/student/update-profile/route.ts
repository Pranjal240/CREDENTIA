import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { studentId, name, course, branch, graduation_year, cgpa, city, state, profile_is_public, university_id } = await req.json()
    if (!studentId) return NextResponse.json({ error: 'Missing student ID' }, { status: 400 })

    // Update students table
    const { error: studentErr } = await supabaseAdmin.from('students').upsert({
      id: studentId,
      name,
      course,
      branch,
      graduation_year: graduation_year || null,
      cgpa: cgpa || null,
      city: city || null,
      state: state || null,
      profile_is_public: profile_is_public ?? true,
      university_id: university_id || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    if (studentErr) throw studentErr

    // Update profiles table — name + linked_university_id
    const { error: profileErr } = await supabaseAdmin.from('profiles').update({
      full_name: name,
      linked_university_id: university_id || null,
      updated_at: new Date().toISOString(),
    }).eq('id', studentId)

    if (profileErr) throw profileErr

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

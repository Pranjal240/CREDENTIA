import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { studentId, cgpa } = await req.json()
    if (!studentId) return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })

    // Verify the caller is the student
    const { data: session } = await supabaseAdmin.auth.getUser()

    const { error } = await supabaseAdmin.from('students').update({
      cgpa: cgpa?.toString() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', studentId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

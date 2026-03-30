import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { studentId, isPublic } = await req.json()
    if (!studentId) return NextResponse.json({ error: 'Missing student ID' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('students')
      .update({
        profile_is_public: isPublic,
        police_share_with_companies: isPublic
      })
      .eq('id', studentId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

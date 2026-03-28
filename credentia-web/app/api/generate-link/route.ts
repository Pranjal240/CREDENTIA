import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json()
    if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

    const token = crypto.randomUUID()

    const { error } = await supabaseAdmin
      .from('students')
      .update({ share_token: token })
      .eq('id', studentId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      token,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${token}`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomBytes } from 'crypto'

export async function POST(request: Request) {
  try {
    const { studentId } = await request.json()

    if (!studentId) {
      return NextResponse.json({ success: false, error: 'Missing studentId' }, { status: 400 })
    }

    // Check if token already exists
    const { data: existing } = await supabaseAdmin
      .from('students')
      .select('share_token')
      .eq('id', studentId)
      .single()

    if (existing?.share_token) {
      return NextResponse.json({ success: true, token: existing.share_token })
    }

    // Generate unique token
    const token = randomBytes(12).toString('hex')

    await supabaseAdmin.from('students').update({
      share_token: token,
      profile_is_public: true,
      updated_at: new Date().toISOString(),
    }).eq('id', studentId)

    return NextResponse.json({ success: true, token })
  } catch (error: any) {
    console.error('Generate link error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to generate link' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shareToken = uuidv4().split('-')[0] + '-' + Date.now().toString(36)

    // Ensure student record exists and update it
    const { data: existingStudent } = await supabase.from('students').select('id').eq('id', user.id).single()

    if (existingStudent) {
      await supabase.from('students').update({ share_token: shareToken, profile_is_public: true }).eq('id', user.id)
    } else {
      await supabase.from('students').insert({ id: user.id, share_token: shareToken, profile_is_public: true, ats_score: 0, verification_score: 0 })
    }

    return NextResponse.json({ success: true, token: shareToken })
  } catch (error: any) {
    console.error('Generate link error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

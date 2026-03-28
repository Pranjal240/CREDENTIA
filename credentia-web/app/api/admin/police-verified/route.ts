import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

// GET — list police verifications needing review
export async function GET(req: Request) {
  try {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('verifications')
      .select('*, students!inner(id, university_id, cgpa, share_token, police_share_with_companies, profiles!inner(full_name, email))')
      .eq('type', 'police')
      .in('status', ['needs_review', 'ai_approved'])
      .order('updated_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

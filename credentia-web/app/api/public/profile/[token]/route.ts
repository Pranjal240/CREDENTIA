import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const { token } = params
    const supabase = createSupabaseServerClient()

    const { data: student, error } = await supabase
      .from('students')
      .select(`
        id,
        ats_score,
        verification_score,
        cgpa,
        course,
        branch,
        graduation_year,
        aadhaar_verified,
        police_verified,
        degree_verified,
        police_share_with_companies,
        profile_views,
        share_token,
        profiles!inner(full_name, avatar_url),
        universities(university_name)
      `)
      .eq('share_token', token)
      .eq('profile_is_public', true)
      .single()

    if (error || !student) {
      return NextResponse.json({ error: 'Profile not found or private' }, { status: 404 })
    }

    // Increment profile views
    await supabase.from('students').update({ profile_views: (student.profile_views || 0) + 1 }).eq('id', student.id)

    // Get verifications (only show approved ones)
    const { data: verifications } = await supabase
      .from('verifications')
      .select('type, status, ai_confidence')
      .eq('student_id', student.id)
      .in('status', ['ai_approved', 'admin_verified'])

    return NextResponse.json({ student, verifications })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

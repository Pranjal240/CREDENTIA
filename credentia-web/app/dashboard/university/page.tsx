import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import UniversityClient from './UniversityClient'

export default async function UniversityDashboard() {
  // ── 1. Authenticate via server-side cookie session ─────────────────────────
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login/university')

  // ── 2. Verify university role via admin client (bypasses RLS) ──────────────
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'university') redirect('/dashboard/student')

  // ── 3. Fetch students linked to this university ────────────────────────────
  const { data: rawStudents, error } = await adminClient
    .from('students')
    .select('*, profiles(email, full_name), verifications(*)')
    .eq('university_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[University Dashboard] Error fetching students:', error.message)
  }

  // ── 4. Map raw data into display-ready objects ─────────────────────────────
  const students = (rawStudents || []).map((s: any) => {
    const resumeVerif = s.verifications?.find((v: any) => v.type === 'resume')
    const degreeVerif = s.verifications?.find((v: any) => v.type === 'degree')
    const aiResult = resumeVerif?.ai_result || {}
    const degreeResult = degreeVerif?.ai_result || {}

    // Count verified documents
    const verifiedStatuses = ['verified', 'ai_approved', 'admin_verified']
    const verifiedDocsCount = (s.verifications || []).filter((v: any) => verifiedStatuses.includes(v.status)).length
    const totalDocsCount = (s.verifications || []).length

    return {
      ...s,
      name: s.name || s.profiles?.full_name || 'Unknown',
      email: s.email || s.profiles?.email || '',
      ats_score: aiResult.ats_score || s.ats_score || 0,
      trust_score: s.trust_score || 0,
      course: degreeResult.course || aiResult.course || s.course || '',
      branch: degreeResult.branch || aiResult.branch || s.branch || '',
      cgpa: degreeResult.grade_cgpa || aiResult.cgpa || s.cgpa || '',
      graduation_year: degreeResult.year_of_passing || aiResult.graduation_year || s.graduation_year || '',
      city: aiResult.city || s.city || '',
      state: aiResult.state || s.state || '',
      degree_verified: s.verifications?.some((v: any) => v.type === 'degree' && verifiedStatuses.includes(v.status)) ?? false,
      police_verified: s.verifications?.some((v: any) => v.type === 'police' && verifiedStatuses.includes(v.status)) ?? false,
      aadhaar_verified: s.verifications?.some((v: any) => v.type === 'aadhaar' && verifiedStatuses.includes(v.status)) ?? false,
      verified_docs_count: verifiedDocsCount,
      total_docs_count: totalDocsCount,
      // Pass lightweight verification list for modals (type + status only)
      verification_list: (s.verifications || []).map((v: any) => ({ type: v.type, status: v.status })),
      // Remove non-serializable nested objects to keep props clean
      verifications: undefined,
      profiles: undefined,
    }
  })

  return <UniversityClient students={students} />
}

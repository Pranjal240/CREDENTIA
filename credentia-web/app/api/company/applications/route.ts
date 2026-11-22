import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCallerWithRole } from '@/lib/api-auth'
import { isVerifiedStatus } from '@/lib/status'

export const dynamic = 'force-dynamic'

type Row = Record<string, any>

/**
 * People who applied to the signed in company, with the details a company needs
 * to decide. Identity documents and numbers are left out. Opening this page
 * marks the application notifications as read.
 */
export async function GET() {
  const caller = await getCallerWithRole(['company'])
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: applications, error } = await supabaseAdmin.from('applications').select('id, student_id, job_title, status, company_notes, created_at').eq('company_id', caller.userId).order('created_at', { ascending: false })
    if (error) throw error

    const rows: Row[] = applications ?? []
    const ids = Array.from(new Set(rows.map((row) => row.student_id as string)))

    const [students, profiles, verifications] = ids.length
      ? await Promise.all([
          supabaseAdmin.from('students').select('id, name, course, branch, city, state, graduation_year, cgpa, ats_score, trust_score, skills').in('id', ids),
          supabaseAdmin.from('profiles').select('id, full_name, email, avatar_url').in('id', ids),
          supabaseAdmin.from('verifications').select('student_id, status').in('student_id', ids),
        ])
      : [{ data: [] as Row[] }, { data: [] as Row[] }, { data: [] as Row[] }]

    const studentById = new Map<string, Row>((students.data ?? []).map((s: Row) => [s.id as string, s] as [string, Row]))
    const profileById = new Map<string, Row>((profiles.data ?? []).map((p: Row) => [p.id as string, p] as [string, Row]))
    const verifiedCount = new Map<string, number>()
    for (const v of (verifications.data ?? []) as Row[]) if (isVerifiedStatus(v.status)) verifiedCount.set(v.student_id, (verifiedCount.get(v.student_id) ?? 0) + 1)

    const result = rows.map((row) => {
      const student = studentById.get(row.student_id)
      const profile = profileById.get(row.student_id)
      return {
        ...row,
        applicant: {
          id: row.student_id as string,
          full_name: (student?.name as string) || (profile?.full_name as string) || 'Applicant',
          email: (profile?.email as string) || '',
          avatar_url: (profile?.avatar_url as string) || null,
          trust_score: Number(student?.trust_score) || 0,
          ats_score: Number(student?.ats_score) || 0,
          verified_documents: verifiedCount.get(row.student_id) ?? 0,
          course: (student?.course as string) || '',
          branch: (student?.branch as string) || '',
          city: (student?.city as string) || '',
          state: (student?.state as string) || '',
          graduation_year: (student?.graduation_year as number) ?? null,
          cgpa: (student?.cgpa as number) ?? null,
          skills: Array.isArray(student?.skills) ? (student?.skills as string[]).slice(0, 12) : [],
        },
      }
    })

    await supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', caller.userId).eq('type', 'application').eq('is_read', false)

    return NextResponse.json({ applications: result })
  } catch (error) {
    console.error('[company/applications] failed:', (error as Error).message)
    return NextResponse.json({ error: 'Applications could not be loaded.' }, { status: 500 })
  }
}

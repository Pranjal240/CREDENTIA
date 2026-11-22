import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { asId, COMPANY_COLUMNS, fetchAll, STUDENT_COLUMNS, UNIVERSITY_COLUMNS, USER_COLUMNS } from '@/lib/admin-data'
import type { AdminUser, AdminUserDetail } from '@/lib/admin-types'

export const dynamic = 'force-dynamic'

/**
 * Every account on the platform. With ?id= it returns one account in full: the
 * student record and documents, or the company or university details, so the
 * list stays light and the details load only when they are opened.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const wanted = new URL(request.url).searchParams.get('id')
    if (wanted) {
      const id = asId(wanted)
      if (!id) return NextResponse.json({ error: 'That account id is not valid.' }, { status: 400 })

      const { data: user } = await supabaseAdmin.from('profiles').select(USER_COLUMNS).eq('id', id).maybeSingle()
      if (!user) return NextResponse.json({ error: 'That account was not found.' }, { status: 404 })

      const detail: AdminUserDetail = { user: user as AdminUser, student: null, docs: [], company: null, university: null, linkedUniversity: null, counts: {} }

      if (user.role === 'student') {
        const [student, docs] = await Promise.all([
          supabaseAdmin.from('students').select(STUDENT_COLUMNS).eq('id', id).maybeSingle(),
          supabaseAdmin.from('verifications').select('id, type, status, ai_confidence, updated_at').eq('student_id', id),
        ])
        detail.student = (student.data as AdminUserDetail['student']) ?? null
        detail.docs = (docs.data as AdminUserDetail['docs']) ?? []
        if (detail.student?.university_id) {
          const { data: linked } = await supabaseAdmin.from('universities').select('university_name').eq('id', detail.student.university_id).maybeSingle()
          detail.linkedUniversity = (linked?.university_name as string) ?? null
        }
      } else if (user.role === 'company') {
        const [company, applications, saved] = await Promise.all([
          supabaseAdmin.from('companies').select(COMPANY_COLUMNS).eq('id', id).maybeSingle(),
          supabaseAdmin.from('applications').select('id', { count: 'exact', head: true }).eq('company_id', id),
          supabaseAdmin.from('saved_candidates').select('id', { count: 'exact', head: true }).eq('company_id', id),
        ])
        detail.company = (company.data as AdminUserDetail['company']) ?? null
        detail.counts = { applications: applications.count ?? 0, saved: saved.count ?? 0 }
      } else if (user.role === 'university') {
        const [university, students] = await Promise.all([
          supabaseAdmin.from('universities').select(UNIVERSITY_COLUMNS).eq('id', id).maybeSingle(),
          supabaseAdmin.from('students').select('id', { count: 'exact', head: true }).eq('university_id', id),
        ])
        detail.university = (university.data as AdminUserDetail['university']) ?? null
        detail.counts = { students: students.count ?? 0 }
      }
      return NextResponse.json(detail)
    }

    const users = await fetchAll<AdminUser>((from, to) =>
      supabaseAdmin.from('profiles').select(USER_COLUMNS).order('created_at', { ascending: false }).order('id').range(from, to),
    )
    return NextResponse.json({ users })
  } catch (error) {
    console.error('[admin/users] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The accounts could not be loaded.' }, { status: 500 })
  }
}

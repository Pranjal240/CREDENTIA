import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { COMPANY_COLUMNS, fetchAll, UNIVERSITY_COLUMNS, USER_COLUMNS } from '@/lib/admin-data'
import type { AdminCompanyRecord, AdminEntity, AdminUniversityRecord, AdminUser } from '@/lib/admin-types'

export const dynamic = 'force-dynamic'

/**
 * Every company and every university, each account joined with its organisation
 * record and a count: students linked to a university, applications received by
 * a company. A university's access key is never part of the answer.
 */
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const [accounts, universityRows, companyRows, linked, applications] = await Promise.all([
      fetchAll<AdminUser>((from, to) =>
        supabaseAdmin.from('profiles').select(USER_COLUMNS).in('role', ['university', 'company']).order('created_at', { ascending: false }).order('id').range(from, to),
      ),
      fetchAll<AdminUniversityRecord>((from, to) => supabaseAdmin.from('universities').select(UNIVERSITY_COLUMNS).order('id').range(from, to)),
      fetchAll<AdminCompanyRecord>((from, to) => supabaseAdmin.from('companies').select(COMPANY_COLUMNS).order('id').range(from, to)),
      fetchAll<{ id: string; university_id: string }>((from, to) => supabaseAdmin.from('students').select('id, university_id').not('university_id', 'is', null).order('id').range(from, to)),
      fetchAll<{ id: string; company_id: string }>((from, to) => supabaseAdmin.from('applications').select('id, company_id').order('id').range(from, to)),
    ])

    const universityById = new Map(universityRows.map((row) => [row.id, row]))
    const companyById = new Map(companyRows.map((row) => [row.id, row]))
    const tally = (rows: { [key: string]: string }[], key: string) => {
      const map = new Map<string, number>()
      for (const row of rows) map.set(row[key], (map.get(row[key]) ?? 0) + 1)
      return map
    }
    const studentsAt = tally(linked, 'university_id')
    const appsAt = tally(applications, 'company_id')

    const base = (account: AdminUser) => ({
      id: account.id,
      email: account.email,
      contact: account.full_name,
      phone: account.phone,
      is_active: account.is_active !== false,
      created_at: account.created_at,
      last_login_at: account.last_login_at,
    })

    const universities: AdminEntity[] = accounts
      .filter((account) => account.role === 'university')
      .map((account) => {
        const record = universityById.get(account.id)
        return {
          ...base(account),
          name: record?.university_name || account.full_name || 'Unnamed university',
          is_verified: record?.is_verified === true,
          has_record: Boolean(record),
          city: record?.city ?? null,
          state: record?.state ?? null,
          industry: null,
          website: null,
          company_size: null,
          description: null,
          ugc_id: record?.ugc_id ?? null,
          naac_grade: record?.naac_grade ?? null,
          count: studentsAt.get(account.id) ?? 0,
        }
      })

    const companies: AdminEntity[] = accounts
      .filter((account) => account.role === 'company')
      .map((account) => {
        const record = companyById.get(account.id)
        return {
          ...base(account),
          name: record?.company_name || account.full_name || 'Unnamed company',
          is_verified: record?.is_verified === true,
          has_record: Boolean(record),
          city: null,
          state: record?.state ?? null,
          industry: record?.industry ?? null,
          website: record?.website ?? null,
          company_size: record?.company_size ?? null,
          description: record?.description ?? null,
          ugc_id: null,
          naac_grade: null,
          count: appsAt.get(account.id) ?? 0,
        }
      })

    return NextResponse.json({ universities, companies })
  } catch (error) {
    console.error('[admin/entities] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The organisations could not be loaded.' }, { status: 500 })
  }
}

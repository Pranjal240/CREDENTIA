import { supabaseAdmin } from '@/lib/supabase'

type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>

/**
 * Reads every row a query matches, one page at a time. A single request to the
 * database returns at most 1000 rows, so a plain select quietly drops the rest.
 * Order the query on a unique column so pages never overlap.
 */
export async function fetchAll<T = Record<string, any>>(page: (from: number, to: number) => Page<T>, max = 20000): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; from < max; from += 1000) {
    const { data, error } = await page(from, from + 999)
    if (error) throw new Error(error.message)
    rows.push(...(data ?? []))
    if (!data || data.length < 1000) break
  }
  return rows
}

/** Counts matching rows without reading them. */
export async function countRows(table: string, filter?: (query: any) => any): Promise<number> {
  let query: any = supabaseAdmin.from(table).select('id', { count: 'exact', head: true })
  if (filter) query = filter(query)
  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}

/** A safe identifier from a query string or body, or null. */
export const asId = (value: unknown): string | null => (typeof value === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(value) ? value : null)

export const USER_COLUMNS = 'id, full_name, email, role, phone, is_active, avatar_url, created_at, last_login_at'

export const STUDENT_COLUMNS =
  'id, name, email, course, branch, graduation_year, cgpa, percentage_10th, percentage_12th, trust_score, ats_score, verified_docs_count, profile_is_public, police_share_with_companies, city, state, roll_number, university_id, degree_verified, police_verified, aadhaar_verified'

export const COMPANY_COLUMNS = 'id, company_name, industry, company_size, website, state, description, gst_number, is_verified'

/** The access key a university uses for its ERP is a secret, so it is never selected. */
export const UNIVERSITY_COLUMNS = 'id, university_name, ugc_id, naac_grade, state, city, data_sharing_on, is_verified'

export const VERIFICATION_COLUMNS =
  'id, student_id, type, status, ai_confidence, document_url, document_filename, external_link, rejection_reason, admin_reviewed_at, created_at, updated_at'

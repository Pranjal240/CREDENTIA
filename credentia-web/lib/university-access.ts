import { supabaseAdmin } from '@/lib/supabase'
import { getCallerWithRole, type Caller } from '@/lib/api-auth'

export interface UniversityAccess {
  caller: Caller
  /** True once an admin has approved the institution. Until then there is no registry. */
  approved: boolean
  university: { name: string; city: string | null; state: string | null; ugc_id: string | null; naac_grade: string | null } | null
}

/**
 * The signed in university and whether it has been approved. A university row
 * is created on first use, so a new account shows up in the admin approvals.
 * Returns null when the caller is not a university.
 */
export async function getUniversityAccess(): Promise<UniversityAccess | null> {
  const caller = await getCallerWithRole(['university'])
  if (!caller) return null

  let { data: row } = await supabaseAdmin.from('universities').select('university_name, city, state, ugc_id, naac_grade, is_verified').eq('id', caller.userId).maybeSingle()
  if (!row) {
    await supabaseAdmin.from('universities').upsert({ id: caller.userId, is_verified: false, university_name: caller.name || 'Unnamed university' }, { onConflict: 'id' })
    row = { university_name: caller.name || 'Unnamed university', city: null, state: null, ugc_id: null, naac_grade: null, is_verified: false }
  }

  return {
    caller,
    approved: row.is_verified === true,
    university: { name: (row.university_name as string) || caller.name || 'University', city: row.city as string | null, state: row.state as string | null, ugc_id: row.ugc_id as string | null, naac_grade: row.naac_grade as string | null },
  }
}

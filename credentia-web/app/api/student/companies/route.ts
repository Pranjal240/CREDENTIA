import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCallerWithRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

/** What a student may see about a company. Tax numbers and anything private stay out. */
const COMPANY_FIELDS =
  'id, company_name, industry, company_size, website, logo_url, state, description, is_verified, minimum_ats_score, minimum_cgpa, require_police_verification, require_aadhaar, require_degree'

/** The active companies on the platform, for a signed in student to browse and apply to. */
export async function GET() {
  const caller = await getCallerWithRole(['student'])
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, is_active, avatar_url')
      .eq('role', 'company')
      .eq('is_active', true)
    if (error) throw error

    // Read the whole table rather than filtering by a long list of ids, which can overflow the request address.
    const { data: records } = await supabaseAdmin.from('companies').select(COMPANY_FIELDS).limit(5000)
    const byId = new Map((records ?? []).map((record) => [record.id as string, record]))

    const companies = (profiles ?? []).map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      entityData: byId.get(profile.id as string) ?? null,
    }))
    return NextResponse.json({ companies })
  } catch (error) {
    console.error('[student/companies] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The companies could not be loaded.' }, { status: 500 })
  }
}

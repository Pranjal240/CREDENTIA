import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCallerWithRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '')
const bounded = (value: unknown, min: number, max: number) => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n >= min && n <= max ? n : null
}

/** Saves the signed in company's profile and what it looks for in candidates. Only the fields that are sent change. */
export async function POST(req: Request) {
  const caller = await getCallerWithRole(['company'])
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 })
  const has = (key: string) => Object.prototype.hasOwnProperty.call(body, key)

  try {
    const now = new Date().toISOString()
    const profilePatch: Record<string, unknown> = { updated_at: now }
    const companyPatch: Record<string, unknown> = { id: caller.userId }

    if (has('company_name')) {
      const name = text(body.company_name, 120)
      if (!name) return NextResponse.json({ error: 'The company name cannot be empty.' }, { status: 400 })
      profilePatch.full_name = name
      companyPatch.company_name = name
    }
    if (has('phone')) profilePatch.phone = text(body.phone, 20) || null
    if (has('description')) companyPatch.description = text(body.description, 1200) || null
    if (has('industry')) companyPatch.industry = text(body.industry, 80) || null
    if (has('company_size')) companyPatch.company_size = text(body.company_size, 40) || null
    if (has('state')) companyPatch.state = text(body.state, 80) || null
    if (has('website')) {
      const raw = text(body.website, 200)
      companyPatch.website = raw ? (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`) : null
    }
    if (has('minimum_ats_score')) companyPatch.minimum_ats_score = bounded(body.minimum_ats_score, 0, 100)
    if (has('minimum_cgpa')) companyPatch.minimum_cgpa = bounded(body.minimum_cgpa, 0, 10)
    for (const flag of ['require_police_verification', 'require_aadhaar', 'require_degree'] as const) {
      if (has(flag)) companyPatch[flag] = Boolean(body[flag])
    }

    if (Object.keys(profilePatch).length > 1) {
      const { error } = await supabaseAdmin.from('profiles').update(profilePatch).eq('id', caller.userId)
      if (error) throw error
    }
    if (Object.keys(companyPatch).length > 1) {
      const { error } = await supabaseAdmin.from('companies').upsert(companyPatch, { onConflict: 'id' })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[company/update-settings] failed:', (error as Error).message)
    return NextResponse.json({ error: 'Your settings could not be saved. Please try again.' }, { status: 500 })
  }
}

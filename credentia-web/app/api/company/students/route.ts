import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCallerWithRole } from '@/lib/api-auth'
import { loadTalent } from '@/lib/company-talent'

export const dynamic = 'force-dynamic'

/**
 * The talent pool for the signed in company: students with a public profile,
 * and the candidates this company has saved. Document files and raw AI output
 * are never included.
 */
export async function GET() {
  const caller = await getCallerWithRole(['company'])
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [talent, saved] = await Promise.all([
      loadTalent(),
      supabaseAdmin.from('saved_candidates').select('student_id, notes, created_at').eq('company_id', caller.userId).order('created_at', { ascending: false }),
    ])
    return NextResponse.json({ talent, saved: saved.data ?? [] })
  } catch (error) {
    console.error('[company/students] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The talent pool could not be loaded.' }, { status: 500 })
  }
}

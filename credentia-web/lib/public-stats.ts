import { supabaseAdmin } from '@/lib/supabase'

/** Aggregate counts shown on the public site. Counts only, never a name or a record. */
export interface PublicStats {
  students: number
  companies: number
  universities: number
  documentsAnalyzed: number
  documentsVerified: number
}

const VERIFIED = ['verified', 'ai_approved', 'admin_verified']

async function count(query: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  const { count: total, error } = await query
  if (error) throw error
  return total ?? 0
}

async function load(): Promise<PublicStats | null> {
  try {
    const head = { count: 'exact' as const, head: true }
    const [students, companies, universities, documentsAnalyzed, documentsVerified] = await Promise.all([
      count(supabaseAdmin.from('profiles').select('id', head).eq('role', 'student')),
      count(supabaseAdmin.from('companies').select('id', head)),
      count(supabaseAdmin.from('universities').select('id', head).eq('is_verified', true)),
      count(supabaseAdmin.from('verifications').select('id', head).neq('status', 'not_submitted')),
      count(supabaseAdmin.from('verifications').select('id', head).in('status', VERIFIED)),
    ])
    return { students, companies, universities, documentsAnalyzed, documentsVerified }
  } catch (err) {
    console.error('[public-stats] failed', err)
    return null
  }
}

/*
 * The numbers are kept in memory for a minute, so a busy landing page never turns into a
 * busy database. Next's own data cache is not used on purpose: it refuses the database
 * request and, in a production build, quietly froze the page with no numbers at all.
 * A failed read is remembered for only ten seconds, so the numbers come back quickly.
 */
const KEEP_MS = 60_000
const RETRY_MS = 10_000
let remembered: { until: number; value: PublicStats | null } | null = null
let pending: Promise<PublicStats | null> | null = null

export async function getPublicStats(): Promise<PublicStats | null> {
  if (remembered && Date.now() < remembered.until) return remembered.value
  if (!pending) {
    pending = load()
      .then((value) => {
        remembered = { until: Date.now() + (value ? KEEP_MS : RETRY_MS), value }
        return value
      })
      .finally(() => {
        pending = null
      })
  }
  return pending
}

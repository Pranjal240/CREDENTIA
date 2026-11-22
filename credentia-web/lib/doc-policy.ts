import { supabaseAdmin } from '@/lib/supabase'
import { PLATFORM_SETTINGS, validateSetting } from '@/lib/platform-settings'

/**
 * How a document is decided. The AI reads a document and the server decides what
 * that means, by these rules. The browser is never asked.
 *
 *   resume          approved when the ATS score is above the resume line
 *   police          rejected when it is not a police certificate, otherwise approved
 *                   when the AI is confident enough
 *   aadhaar, degree, marksheets
 *                   approved when the AI confirms the document and is confident enough
 *
 * Anything else goes to an admin as `needs_review`. A document type the admin
 * has put on the manual list is never approved by the AI, however confident it is.
 * The lines come from the settings an admin edits, read with a short cache.
 */

export const AI_DOC_TYPES = ['resume', 'police', 'aadhaar', 'degree', 'marksheet_10th', 'marksheet_12th'] as const
export type AiDocType = (typeof AI_DOC_TYPES)[number]

/** The only outcomes a server decision can have. An admin alone can verify. */
export type DecidedStatus = 'ai_approved' | 'needs_review' | 'rejected'

export interface Policy {
  /** The least confidence, in percent, that lets the AI approve a document. */
  confidence: number
  /** A resume must score above this to be approved. */
  resumeScore: number
  /** Document types an admin always checks. */
  manualReview: string[]
}

const POLICY_KEYS = ['ai_confidence_threshold', 'auto_resume_threshold', 'manual_review_types']
const fallbackFor = (key: string) => PLATFORM_SETTINGS.find((setting) => setting.key === key)?.fallback ?? ''

/** The policy for a list of stored settings. A missing or invalid value keeps the default the settings page shows. */
export function policyFromSettings(rows: { key: string; value: unknown }[]): Policy {
  const stored = new Map(rows.map((row) => [row.key, row.value]))
  const read = (key: string) => {
    const checked = validateSetting(key, stored.get(key))
    return checked.ok ? checked.value : fallbackFor(key)
  }
  const manual = read('manual_review_types')
  return {
    confidence: Number(read('ai_confidence_threshold')),
    resumeScore: Number(read('auto_resume_threshold')),
    manualReview: manual === 'none' ? [] : manual.split(','),
  }
}

const asNumber = (value: unknown): number => {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
  return Number.isFinite(n) ? n : 0
}
const asTrue = (value: unknown) => value === true || (typeof value === 'string' && value.trim().toLowerCase() === 'true')

/** What the server makes of the AI's answer. Never `admin_verified` or `verified`. */
export function decideStatus(type: string, analysis: unknown, policy: Policy): DecidedStatus {
  if (!(AI_DOC_TYPES as readonly string[]).includes(type) || !analysis || typeof analysis !== 'object' || Array.isArray(analysis)) return 'needs_review'
  const a = analysis as Record<string, unknown>

  let approved: boolean
  if (type === 'resume') {
    approved = asNumber(a.ats_score) > policy.resumeScore
  } else if (type === 'police') {
    if (!asTrue(a.is_police_certificate)) return 'rejected'
    approved = asNumber(a.confidence) >= policy.confidence
  } else {
    approved = asTrue(a.verified) && asNumber(a.confidence) >= policy.confidence
  }

  if (!approved) return 'needs_review'
  return policy.manualReview.includes(type) ? 'needs_review' : 'ai_approved'
}

const CACHE_MS = 30_000
let cached: { at: number; policy: Policy } | null = null

/**
 * The current policy. Kept in memory for a short while so a busy day does not
 * read the settings table for every document. When the table cannot be read it
 * serves the last good policy, or the defaults, and tries again on the next call.
 * `now` is only a seam for a clock.
 */
export async function loadPolicy(now: number = Date.now()): Promise<Policy> {
  if (cached && now - cached.at < CACHE_MS) return cached.policy
  try {
    const { data, error } = await supabaseAdmin.from('platform_settings').select('key, value').in('key', POLICY_KEYS)
    if (error) throw error
    cached = { at: now, policy: policyFromSettings(data ?? []) }
    return cached.policy
  } catch (error) {
    console.error('[doc-policy] the settings could not be read:', (error as Error).message)
    return cached?.policy ?? policyFromSettings([])
  }
}

/** Makes the next call read the settings again, for example right after an admin saves them. */
export function clearPolicyCache() {
  cached = null
}

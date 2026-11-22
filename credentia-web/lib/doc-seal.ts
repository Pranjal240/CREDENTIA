import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * A server signed envelope around what the AI found in a document.
 *
 * Reading a document and saving it are two steps, with the student looking at
 * the result in between. The browser carries the result from one step to the
 * other, so it must not be able to change it. The read route seals the result
 * (who it belongs to, which document type, which file, what the AI found and
 * the decision made from it) and the save route believes nothing else. A
 * student can read the contents but cannot alter a single character of them.
 *
 * The signing key is derived from `DOC_SEAL_SECRET` when it is set, otherwise
 * from the service role key. It never leaves the server.
 */

export interface SealPayload {
  /** The account the result belongs to. */
  sub: string
  /** The document type, for example `aadhaar`. */
  type: string
  /** The storage key of the file that was read. */
  key: string
  /** What the AI found, already cleaned. */
  analysis: Record<string, unknown>
  /** The decision the server made from it. */
  status: string
}

export type OpenedSeal = SealPayload & { exp: number }

/** How long a student has to look at a result and save it. */
export const SEAL_LIFETIME_MS = 60 * 60_000
const MAX_TOKEN_LENGTH = 200_000

function signingKey(): Buffer | null {
  const base = process.env.DOC_SEAL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base) return null
  return createHmac('sha256', base).update('credentia:doc-seal:v1').digest()
}

const sign = (key: Buffer, body: string) => createHmac('sha256', key).update(body).digest()

/** Seals a result. Throws when the server has no secret to sign with. */
export function sealResult(payload: SealPayload, now: number = Date.now()): string {
  const key = signingKey()
  if (!key) throw new Error('No signing secret is configured')
  const body = Buffer.from(JSON.stringify({ ...payload, exp: now + SEAL_LIFETIME_MS })).toString('base64url')
  return `${body}.${sign(key, body).toString('base64url')}`
}

/** The sealed result, or null for anything that was altered, expired, forged or is not a seal at all. */
export function openSeal(token: unknown, now: number = Date.now()): OpenedSeal | null {
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) return null
  const parts = token.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null

  const key = signingKey()
  if (!key) return null
  const expected = sign(key, parts[0])
  const given = Buffer.from(parts[1], 'base64url')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null

  try {
    const parsed = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
    if (typeof parsed?.exp !== 'number' || parsed.exp < now) return null
    if (typeof parsed.sub !== 'string' || typeof parsed.type !== 'string' || typeof parsed.key !== 'string' || typeof parsed.status !== 'string') return null
    if (!parsed.analysis || typeof parsed.analysis !== 'object' || Array.isArray(parsed.analysis)) return null
    return parsed as OpenedSeal
  } catch {
    return null
  }
}

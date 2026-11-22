import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'
import type { DashRole } from '@/lib/dashboard-nav'

export interface Caller {
  userId: string
  role: DashRole
  email: string
  name: string
}

const ROLES: DashRole[] = ['student', 'company', 'university', 'admin']

/**
 * The signed in person, read from the session cookie and the profiles table.
 * Never trusts an id sent by the client. Returns null when nobody is signed in
 * or the account has been disabled.
 */
const CALLER_TTL_MS = 30_000
const callers = new Map<string, { caller: Caller; expires: number }>()

export async function getCaller(): Promise<Caller | null> {
  const supabase = createSupabaseServerClient()

  // The token is only a key for remembering a person who was just confirmed. It is never trusted on its
  // own: a token that has not been confirmed in the last half minute is checked with the auth server below.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (token) {
    const hit = callers.get(token)
    if (hit && hit.expires > Date.now()) return hit.caller
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabaseAdmin.from('profiles').select('role, full_name, email, is_active').eq('id', user.id).single()
  const role = profile?.role as DashRole | undefined
  if (!role || !ROLES.includes(role) || profile?.is_active === false) return null

  const caller: Caller = { userId: user.id, role, email: (profile?.email as string) || user.email || '', name: (profile?.full_name as string) || '' }
  if (token) {
    callers.set(token, { caller, expires: Date.now() + CALLER_TTL_MS })
    if (callers.size > 500) {
      const now = Date.now()
      callers.forEach((value, key) => {
        if (value.expires <= now) callers.delete(key)
      })
    }
  }
  return caller
}

/** Like getCaller, but only for the listed roles. */
export async function getCallerWithRole(roles: DashRole[]): Promise<Caller | null> {
  const caller = await getCaller()
  return caller && roles.includes(caller.role) ? caller : null
}

/** The client address as far as the proxy chain tells us, for limiting anonymous callers. */
export function clientAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return (forwarded?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim()
}

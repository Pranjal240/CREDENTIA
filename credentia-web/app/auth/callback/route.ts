import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Valid portal types — used to validate the OAuth state param
const VALID_PORTALS = ['student', 'university', 'company', 'admin'] as const
type Portal = (typeof VALID_PORTALS)[number]

function isValidPortal(p: string | null | undefined): p is Portal {
  return !!p && (VALID_PORTALS as readonly string[]).includes(p)
}

// Build a redirect URL that works in both local dev and on Vercel
function buildRedirect(request: NextRequest, path: string): NextResponse {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.redirect(new URL(path, request.url))
  }
  if (forwardedHost) {
    return NextResponse.redirect(new URL(`${proto}://${forwardedHost}${path}`))
  }
  return NextResponse.redirect(new URL(path, request.url))
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code             = url.searchParams.get('code')
  const oauthError       = url.searchParams.get('error')
  const oauthErrorDesc   = url.searchParams.get('error_description')
  const rawState         = url.searchParams.get('state') ?? ''

  // ── Parse portal from state param ─────────────────────────────────────────
  // Format: "portal:student" | "portal:university" | "portal:company" | "portal:admin"
  const portalCandidate  = rawState.startsWith('portal:')
    ? rawState.replace('portal:', '')
    : null
  const portalType: Portal | null = isValidPortal(portalCandidate) ? portalCandidate : null

  // ── OAuth provider returned an error ──────────────────────────────────────
  if (oauthError) {
    const target = portalType ? `/login/${portalType}` : '/login/student'
    return buildRedirect(request, `${target}?error=oauth_cancelled`)
  }

  if (!code) {
    const target = portalType ? `/login/${portalType}` : '/login/student'
    return buildRedirect(request, `${target}?error=auth_failed`)
  }

  // ── Set up Supabase SSR client (writes session cookies) ───────────────────
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )

  // ── Exchange the PKCE code for a session ──────────────────────────────────
  const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
  if (exchangeError || !sessionData.user) {
    console.error('[auth/callback] Code exchange failed:', exchangeError?.message)
    const target = portalType ? `/login/${portalType}` : '/login/student'
    return buildRedirect(request, `${target}?error=auth_failed`)
  }

  const user = sessionData.user

  // ── Service-role client for profile writes (bypasses RLS) ─────────────────
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // ── Fetch existing profile ─────────────────────────────────────────────────
  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, role, is_active, login_portal')
    .eq('id', user.id)
    .single()

  // ── BANNED CHECK ──────────────────────────────────────────────────────────
  // If an admin has deactivated this account, sign them out immediately
  if (profile?.is_active === false) {
    await supabase.auth.signOut()
    return buildRedirect(request, '/?error=account_banned')
  }

  // ── RETURNING USER ────────────────────────────────────────────────────────
  if (profile) {
    const existingRole = profile.role as Portal

    // Wrong portal detection — user is trying to log in via a portal that
    // does not match their registered role. Sign them out to clear the session
    // and redirect them to their correct portal with a descriptive error.
    if (portalType && existingRole !== portalType) {
      await supabase.auth.signOut()
      return buildRedirect(
        request,
        `/login/${portalType}?error=wrong_portal&correct=${existingRole}`
      )
    }

    // Correct portal (or no portal context) — update last login timestamp only.
    // Role is NEVER touched here — it is immutably set on first login.
    await adminClient
      .from('profiles')
      .update({
        last_login_at:     new Date().toISOString(),
        last_login_portal: portalType ?? existingRole,
        updated_at:        new Date().toISOString(),
      })
      .eq('id', user.id)

    return buildRedirect(request, `/dashboard/${existingRole}`)
  }

  // ── NEW USER (first login ever) ───────────────────────────────────────────
  // We must have a portal context to create a profile. Without it, we cannot
  // assign a role, so we fall back to the student portal landing.
  if (!portalType) {
    await supabase.auth.signOut()
    return buildRedirect(request, '/login/student?error=no_portal_context')
  }

  // ── ADMIN WHITELIST GATE ──────────────────────────────────────────────────
  // Only emails present in admin_whitelist can create an admin account.
  if (portalType === 'admin') {
    const { data: whitelistEntry } = await adminClient
      .from('admin_whitelist')
      .select('email')
      .eq('email', user.email)
      .single()

    if (!whitelistEntry) {
      // Email is not in the whitelist — deny and sign out
      await supabase.auth.signOut()
      return buildRedirect(request, '/login/admin?error=not_authorized')
    }
  }

  // ── CREATE LOCKED PROFILE ─────────────────────────────────────────────────
  // Role is set ONCE here and is protected by a DB trigger (lock_role_after_insert)
  // that will throw if anything tries to UPDATE the role column afterwards.
  await adminClient.from('profiles').insert({
    id:               user.id,
    email:            user.email,
    full_name:        user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
    avatar_url:       user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    role:             portalType,       // ← SET ONCE — never overwritten
    login_portal:     portalType,       // ← original portal used for first login
    last_login_at:    new Date().toISOString(),
    last_login_portal: portalType,
    is_active:        true,
    created_at:       new Date().toISOString(),
    updated_at:       new Date().toISOString(),
  })

  // If this is a student, also create their students row
  if (portalType === 'student') {
    await adminClient.from('students').upsert({
      id:                user.id,
      profile_is_public: false,
      profile_views:     0,
      created_at:        new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  // ── Redirect new user to their portal's onboarding ────────────────────────
  return buildRedirect(request, `/dashboard/${portalType}`)
}

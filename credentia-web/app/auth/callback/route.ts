import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ────────────────────────────────────────────────────────────────────────────
// HARDCODED ROLE OVERRIDES — these emails ALWAYS get their assigned role,
// regardless of what portal they logged in from. This is the source of truth.
// ────────────────────────────────────────────────────────────────────────────
const EMAIL_ROLE_OVERRIDES: Record<string, string> = {
  'pranjalmishra2409@gmail.com': 'admin',
  'pranjalwork2602@gmail.com':   'student',
  'pranjalproject0705@gmail.com': 'company',
  '23001008048@jcboseust.ac.in': 'university',
}

const VALID_ROLES = ['student', 'university', 'company', 'admin']

export async function GET(request: NextRequest) {
  const url       = new URL(request.url)
  const code      = url.searchParams.get('code')
  const error_    = url.searchParams.get('error')
  const portal    = url.searchParams.get('portal')

  // ── OAuth error ──────────────────────────────────────────────────────────
  if (error_ || !code) {
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  // ── Collect cookies for the redirect response ────────────────────────────
  // In Next.js App Router, cookies set during exchangeCodeForSession() are
  // NOT automatically attached to a NextResponse.redirect(). We must collect
  // them and explicitly attach them.
  const cookieJar: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          cookieJar.push({ name, value, options })
        },
        remove(name: string, options: Record<string, unknown>) {
          cookieJar.push({ name, value: '', options: { ...options, maxAge: 0 } })
        },
      },
    }
  )

  // Helper: redirect with all accumulated cookies
  const safeRedirect = (path: string): NextResponse => {
    const res = NextResponse.redirect(new URL(path, url.origin))
    for (const c of cookieJar) {
      res.cookies.set({ name: c.name, value: c.value, ...c.options } as any)
    }
    return res
  }

  // ── Exchange PKCE code for session ───────────────────────────────────────
  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      console.error('[callback] exchange error:', exchangeError.message)
      return safeRedirect('/login?error=exchange_failed')
    }
  } catch (e: any) {
    console.error('[callback] exchange exception:', e.message)
    return safeRedirect('/login?error=exchange_failed')
  }

  // ── Get authenticated user ──────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return safeRedirect('/login?error=no_user')
  }

  // ── Determine final role ────────────────────────────────────────────────
  // Priority: hardcoded override > portal param > existing profile > default
  const email = user.email.toLowerCase()
  let finalRole: string

  if (EMAIL_ROLE_OVERRIDES[email]) {
    // Hardcoded emails always get their assigned role
    finalRole = EMAIL_ROLE_OVERRIDES[email]
  } else if (portal && VALID_ROLES.includes(portal)) {
    // Use the portal the user logged in from
    finalRole = portal
  } else {
    // Fallback: check existing profile, or default to student
    finalRole = 'student'
  }

  // ── Service-role client (bypasses RLS) ──────────────────────────────────
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // ── Check existing profile to preserve data ─────────────────────────────
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (existingProfile) {
    // For hardcoded emails: force-update role if different
    if (EMAIL_ROLE_OVERRIDES[email] && existingProfile.role !== finalRole) {
      await adminClient
        .from('profiles')
        .update({
          role:              finalRole,
          login_portal:      finalRole,
          last_login_at:     new Date().toISOString(),
          last_login_portal: finalRole,
          updated_at:        new Date().toISOString(),
        })
        .eq('id', user.id)
    } else if (!EMAIL_ROLE_OVERRIDES[email]) {
      // For non-hardcoded returning users: keep their existing role
      finalRole = existingProfile.role
      await adminClient
        .from('profiles')
        .update({
          last_login_at:     new Date().toISOString(),
          last_login_portal: portal ?? existingProfile.role,
          updated_at:        new Date().toISOString(),
        })
        .eq('id', user.id)
    } else {
      // Hardcoded email, role already correct — just update timestamp
      await adminClient
        .from('profiles')
        .update({
          last_login_at:     new Date().toISOString(),
          last_login_portal: finalRole,
          updated_at:        new Date().toISOString(),
        })
        .eq('id', user.id)
    }
  } else {
    // ── NEW USER — create profile ───────────────────────────────────────
    // Admin whitelist check for non-hardcoded emails trying admin
    if (finalRole === 'admin' && !EMAIL_ROLE_OVERRIDES[email]) {
      const { data: wl } = await adminClient
        .from('admin_whitelist')
        .select('email')
        .eq('email', email)
        .single()

      if (!wl) {
        await supabase.auth.signOut()
        return safeRedirect('/login/admin?error=not_authorized')
      }
    }

    await adminClient.from('profiles').insert({
      id:                user.id,
      email:             email,
      full_name:         user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
      avatar_url:        user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      role:              finalRole,
      login_portal:      finalRole,
      last_login_at:     new Date().toISOString(),
      last_login_portal: finalRole,
      is_active:         true,
      created_at:        new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    })

    // Create student record if needed
    if (finalRole === 'student') {
      await adminClient.from('students').upsert({
        id:                user.id,
        profile_is_public: false,
        profile_views:     0,
        created_at:        new Date().toISOString(),
        updated_at:        new Date().toISOString(),
      }, { onConflict: 'id' })
    }
  }

  console.log(`[callback] ${email} → /dashboard/${finalRole}`)
  return safeRedirect(`/dashboard/${finalRole}`)
}

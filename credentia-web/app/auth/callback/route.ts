import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_ROLES = ['student', 'university', 'company', 'admin']

export async function GET(request: NextRequest) {
  const url    = new URL(request.url)
  const code   = url.searchParams.get('code')
  const error_ = url.searchParams.get('error')

  // ── Read portal from COOKIE first (bulletproof), then query param fallback
  const portalFromCookie = request.cookies.get('login_portal')?.value
  const portalFromQuery  = url.searchParams.get('portal')
  const portal = portalFromCookie || portalFromQuery || null

  console.log('[callback] code:', !!code, 'portal:', portal, 'cookie:', portalFromCookie, 'query:', portalFromQuery)

  // ── OAuth error or no code ─────────────────────────────────────────────
  if (error_ || !code) {
    console.error('[callback] no code or oauth error:', error_)
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  // ── Cookie jar: collect cookies for the redirect response ──────────────
  const cookieJar: { name: string; value: string; options: any }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieJar.push({ name, value, options })
        },
        remove(name: string, options: any) {
          cookieJar.push({ name, value: '', options: { ...options, maxAge: 0 } })
        },
      },
    }
  )

  // ── safeRedirect: attach cookies + clear login_portal cookie ───────────
  const safeRedirect = (path: string): NextResponse => {
    const res = NextResponse.redirect(new URL(path, url.origin))
    // Attach all session cookies from exchangeCodeForSession
    for (const c of cookieJar) {
      res.cookies.set({ name: c.name, value: c.value, ...c.options })
    }
    // Clear the login_portal cookie (no longer needed)
    res.cookies.set({ name: 'login_portal', value: '', path: '/', maxAge: 0 })
    return res
  }

  // ── Exchange PKCE code for session ─────────────────────────────────────
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

  // ── Get authenticated user ─────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    console.error('[callback] no user after exchange')
    return safeRedirect('/login?error=no_user')
  }

  const email = user.email.toLowerCase()
  console.log('[callback] authenticated:', email)

  // ── Service-role client (bypasses RLS) ─────────────────────────────────
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // ── Fetch existing profile ─────────────────────────────────────────────
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  // ── RETURNING USER ─────────────────────────────────────────────────────
  if (existingProfile) {
    if (existingProfile.is_active === false) {
      await supabase.auth.signOut()
      return safeRedirect('/?error=account_banned')
    }

    const dbRole = existingProfile.role

    if (dbRole && VALID_ROLES.includes(dbRole)) {
      await adminClient
        .from('profiles')
        .update({
          last_login_at:     new Date().toISOString(),
          last_login_portal: portal ?? dbRole,
          updated_at:        new Date().toISOString(),
        })
        .eq('id', user.id)

      console.log('[callback] returning →', `/dashboard/${dbRole}`)
      return safeRedirect(`/dashboard/${dbRole}`)
    }

    // Invalid role — fix using portal
    const fixedRole = (portal && VALID_ROLES.includes(portal)) ? portal : 'student'
    await adminClient
      .from('profiles')
      .update({
        role: fixedRole,
        login_portal: fixedRole,
        last_login_at: new Date().toISOString(),
        last_login_portal: fixedRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    console.log('[callback] fixed role →', `/dashboard/${fixedRole}`)
    return safeRedirect(`/dashboard/${fixedRole}`)
  }

  // ── NEW USER ───────────────────────────────────────────────────────────
  const newRole = (portal && VALID_ROLES.includes(portal)) ? portal : 'student'

  // Admin whitelist check
  if (newRole === 'admin') {
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
    email,
    full_name:         user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
    avatar_url:        user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    role:              newRole,
    login_portal:      newRole,
    last_login_at:     new Date().toISOString(),
    last_login_portal: newRole,
    is_active:         true,
    created_at:        new Date().toISOString(),
    updated_at:        new Date().toISOString(),
  })

  if (newRole === 'student') {
    await adminClient.from('students').upsert({
      id: user.id,
      profile_is_public: false,
      profile_views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  console.log('[callback] new user →', `/dashboard/${newRole}`)
  return safeRedirect(`/dashboard/${newRole}`)
}

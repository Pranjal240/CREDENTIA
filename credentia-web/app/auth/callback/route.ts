import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_ROLES = ['student', 'university', 'company', 'admin']

export async function GET(request: NextRequest) {
  const url    = new URL(request.url)
  const code   = url.searchParams.get('code')
  const error_ = url.searchParams.get('error')
  const portal = url.searchParams.get('portal')  // e.g. "student", "company"

  // ── OAuth error or no code ──────────────────────────────────────────────
  if (error_ || !code) {
    return NextResponse.redirect(new URL('/login', url.origin))
  }

  // ── Cookie jar: collect cookies set during exchangeCodeForSession ───────
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

  // ── safeRedirect: attach all cookies to the redirect response ──────────
  const safeRedirect = (path: string): NextResponse => {
    const res = NextResponse.redirect(new URL(path, url.origin))
    for (const c of cookieJar) {
      res.cookies.set({ name: c.name, value: c.value, ...c.options })
    }
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
    return safeRedirect('/login?error=no_user')
  }

  const email = user.email.toLowerCase()
  console.log('[callback] user:', email, 'portal:', portal)

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
    // Banned check
    if (existingProfile.is_active === false) {
      await supabase.auth.signOut()
      return safeRedirect('/?error=account_banned')
    }

    const dbRole = existingProfile.role

    // If their DB role is valid, ALWAYS send them to THEIR dashboard.
    // DO NOT override based on portal. The DB role is the source of truth.
    if (dbRole && VALID_ROLES.includes(dbRole)) {
      // Update last login timestamp
      await adminClient
        .from('profiles')
        .update({
          last_login_at:     new Date().toISOString(),
          last_login_portal: portal ?? dbRole,
          updated_at:        new Date().toISOString(),
        })
        .eq('id', user.id)

      console.log('[callback] returning user:', email, '→ /dashboard/' + dbRole)
      return safeRedirect(`/dashboard/${dbRole}`)
    }

    // DB role is invalid (e.g. "new") — fix it using the portal param
    const fixedRole = (portal && VALID_ROLES.includes(portal)) ? portal : 'student'
    await adminClient
      .from('profiles')
      .update({
        role:              fixedRole,
        login_portal:      fixedRole,
        last_login_at:     new Date().toISOString(),
        last_login_portal: fixedRole,
        updated_at:        new Date().toISOString(),
      })
      .eq('id', user.id)

    console.log('[callback] fixed invalid role:', email, '→ /dashboard/' + fixedRole)
    return safeRedirect(`/dashboard/${fixedRole}`)
  }

  // ── NEW USER ───────────────────────────────────────────────────────────
  // Use the portal they signed up from. Default to student if missing.
  const newRole = (portal && VALID_ROLES.includes(portal)) ? portal : 'student'

  // Admin whitelist check — only whitelisted emails can get admin role
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

  // Create profile
  await adminClient.from('profiles').insert({
    id:                user.id,
    email:             email,
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

  // Create student record if needed
  if (newRole === 'student') {
    await adminClient.from('students').upsert({
      id:                user.id,
      profile_is_public: false,
      profile_views:     0,
      created_at:        new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  console.log('[callback] new user:', email, '→ /dashboard/' + newRole)
  return safeRedirect(`/dashboard/${newRole}`)
}

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth Callback Route Handler — SERVER-SIDE PKCE code exchange.
 *
 * CRITICAL ARCHITECTURE:
 * 1. We read cookies from the REQUEST (where PKCE code_verifier lives)
 * 2. We collect any cookies Supabase wants to SET into an array
 * 3. We stamp those cookies onto every NextResponse.redirect() we return
 *
 * Without step 3, session cookies are lost during redirect and the user
 * appears unauthenticated to the middleware → redirect loop to login.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code  = url.searchParams.get('code')
  const portal = url.searchParams.get('portal') || 'student'
  const error = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')

  // Validate portal
  const validPortals = ['student', 'university', 'company', 'admin']
  const safePortal = validPortals.includes(portal) ? portal : 'student'

  // Determine origin
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const origin = forwardedHost
    ? `${protocol}://${forwardedHost}`
    : `${protocol}://${host}`

  // ── Collect cookies that Supabase sets during code exchange ────────────
  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []

  /** Create a redirect that carries all session cookies */
  function redirectWithCookies(destination: string): NextResponse {
    const res = NextResponse.redirect(destination)
    pendingCookies.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, {
        ...options,
        sameSite: 'lax',
        secure: true,
      })
    })
    return res
  }

  // Handle OAuth errors
  if (error) {
    const msg = encodeURIComponent(errorDescription || error)
    return NextResponse.redirect(`${origin}/login/${safePortal}?error=${msg}`)
  }

  // No code = nothing to exchange
  if (!code) {
    return NextResponse.redirect(`${origin}/login/${safePortal}?error=no_code`)
  }

  // Create Supabase client — reads cookies from REQUEST, collects SET cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            pendingCookies.push({ name, value, options: options ?? {} })
          })
        },
      },
    }
  )

  // ── Exchange the auth code for a session ──────────────────────────────
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[Auth Callback] Exchange failed:', exchangeError.message)
    return NextResponse.redirect(
      `${origin}/login/${safePortal}?error=${encodeURIComponent(exchangeError.message)}`
    )
  }

  // ── Get the authenticated user ────────────────────────────────────────
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[Auth Callback] getUser failed:', userError?.message)
    return NextResponse.redirect(`${origin}/login/${safePortal}?error=auth_failed`)
  }

  // ── Admin portal lock ─────────────────────────────────────────────────
  if (safePortal === 'admin' && user.email !== 'pranjalmishra2409@gmail.com') {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login/admin?error=not_authorized`)
  }

  // ── Check for existing profile ────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .maybeSingle()

  // Account deactivated
  if (profile?.is_active === false) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login/${safePortal}?error=account_banned`)
  }

  // ── RETURNING USER — profile exists ───────────────────────────────────
  if (profile) {
    // Update login tracking
    await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString(), login_portal: safePortal })
      .eq('id', user.id)

    // Redirect to their dashboard (based on their ACTUAL role, not the portal)
    return redirectWithCookies(`${origin}/dashboard/${profile.role}`)
  }

  // ── NEW USER — create profile with correct role from portal ───────────
  const { error: insertError } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
    avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? '',
    role: safePortal,
    login_portal: safePortal,
    last_login_at: new Date().toISOString(),
    is_active: true,
  }, { onConflict: 'id' })

  if (insertError) {
    console.error('[Auth Callback] Profile upsert failed:', insertError.message)
  }

  // For students, also create the students row
  if (safePortal === 'student') {
    await supabase.from('students').upsert(
      { id: user.id, profile_is_public: false, profile_views: 0 },
      { onConflict: 'id' }
    )
  }

  // ── Redirect to dashboard with cookies ────────────────────────────────
  return redirectWithCookies(`${origin}/dashboard/${safePortal}`)
}

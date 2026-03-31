import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth Callback Route Handler
 *
 * Uses the EXACT same cookie pattern as the official Supabase middleware docs:
 * - getAll reads from request.cookies
 * - setAll writes to BOTH request.cookies AND the response
 *
 * This is the ONLY pattern that reliably persists session cookies across
 * redirects on Vercel serverless functions.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const portal = searchParams.get('portal') || 'student'

  // Validate portal
  const validPortals = ['student', 'university', 'company', 'admin']
  const safePortal = validPortals.includes(portal) ? portal : 'student'

  // Use x-forwarded-host for production, fall back to host header
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = request.headers.get('host')
  const isLocalEnv = process.env.NODE_ENV === 'development'
  const origin = isLocalEnv
    ? `http://${host}`
    : forwardedHost
      ? `https://${forwardedHost}`
      : `https://${host}`

  if (!code) {
    return NextResponse.redirect(`${origin}/login/${safePortal}?error=no_code`)
  }

  // ── Create Supabase client using the official middleware cookie pattern ──
  // This is the CRITICAL piece. We create a "response" object first, then
  // use the setAll to stamp cookies onto it. This ensures the session
  // cookies survive the redirect.
  let response = NextResponse.redirect(`${origin}/dashboard/${safePortal}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Step 1: Set on request (for downstream reads within this handler)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Step 2: Recreate response with updated request cookies
          // (response destination will be reset below when we do the final redirect)
          response = NextResponse.redirect(`${origin}/dashboard/${safePortal}`)
          // Step 3: Set on response (for the browser to persist)
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ── Exchange the PKCE code for a session ────────────────────────────────
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[Auth Callback] Code exchange failed:', exchangeError.message)
    return NextResponse.redirect(
      `${origin}/login/${safePortal}?error=${encodeURIComponent(exchangeError.message)}`
    )
  }

  // ── Get the authenticated user ──────────────────────────────────────────
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[Auth Callback] getUser failed:', userError?.message)
    return NextResponse.redirect(`${origin}/login/${safePortal}?error=auth_failed`)
  }

  // ── Admin gate ──────────────────────────────────────────────────────────
  if (safePortal === 'admin') {
    const { data: wl } = await supabase
      .from('admin_whitelist')
      .select('email')
      .eq('email', user.email)
      .maybeSingle()

    if (!wl) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login/admin?error=not_authorized`)
    }
  }

  // ── Upsert profile ─────────────────────────────────────────────────────
  // Using upsert so it works for both new users AND returning users whose
  // profile was already created by a previous session/trigger.
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (existingProfile) {
    // RETURNING USER: update last login metadata
    await supabase
      .from('profiles')
      .update({
        last_login_at: new Date().toISOString(),
        last_login_portal: safePortal,
      })
      .eq('id', user.id)

    // Redirect to their ACTUAL role dashboard (not portal they came from)
    const dashboardRole = existingProfile.role
    // Recreate redirect with correct destination + preserved cookies
    const finalUrl = `${origin}/dashboard/${dashboardRole}`
    const finalResponse = NextResponse.redirect(finalUrl)
    // Copy all cookies from the current response to the final response
    response.cookies.getAll().forEach(cookie => {
      finalResponse.cookies.set(cookie.name, cookie.value)
    })
    return finalResponse
  }

  // NEW USER: create profile with portal role
  await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
    avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? '',
    role: safePortal,
    login_portal: safePortal,
    last_login_at: new Date().toISOString(),
    last_login_portal: safePortal,
    is_active: true,
  })

  // Create student record if needed
  if (safePortal === 'student') {
    await supabase.from('students').upsert(
      { id: user.id, profile_is_public: false, profile_views: 0 },
      { onConflict: 'id' }
    )
  }

  // The default `response` already points to /dashboard/{safePortal}
  // and has all the session cookies from the setAll callback
  return response
}

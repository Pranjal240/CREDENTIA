import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth Callback Route Handler — SERVER-SIDE PKCE code exchange.
 *
 * CRITICAL FIX: We must collect cookies set by `exchangeCodeForSession` and
 * explicitly forward them onto every `NextResponse.redirect()` we return.
 * If we don't, the session cookies are lost during the redirect and the
 * middleware / dashboard thinks the user is unauthenticated → redirect loop.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const portal = searchParams.get('portal') || 'student'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Determine origin (Vercel might use x-forwarded-host)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const origin = forwardedHost
    ? `${protocol}://${forwardedHost}`
    : `${protocol}://${host}`

  // ── Collect cookies that Supabase sets during code exchange ────────────
  // We store them in an array and stamp them onto every redirect response.
  const cookiesToForward: { name: string; value: string; options: CookieOptions }[] = []

  /**
   * Helper: create a redirect response that carries all session cookies.
   */
  function redirectWithCookies(url: string): NextResponse {
    const response = NextResponse.redirect(url)
    cookiesToForward.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, {
        ...options,
        // Ensure cookies work on the production domain
        sameSite: 'lax',
        secure: true,
      })
    })
    return response
  }

  // Handle OAuth errors from Supabase/Google
  if (error) {
    const msg = encodeURIComponent(errorDescription || error)
    return NextResponse.redirect(`${origin}/login/${portal}?error=${msg}`)
  }

  // No code = nothing to exchange
  if (!code) {
    return NextResponse.redirect(`${origin}/login/${portal}?error=no_code`)
  }

  // Create Supabase server client. The key difference from the previous
  // implementation: we read cookies from the REQUEST, and collect any
  // cookies that Supabase wants to SET into `cookiesToForward`.
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
            cookiesToForward.push({ name, value, options: options ?? {} })
          })
        },
      },
    }
  )

  // ── Exchange the auth code for a session ──────────────────────────────
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[Auth Callback] Code exchange failed:', exchangeError.message)
    return NextResponse.redirect(
      `${origin}/login/${portal}?error=${encodeURIComponent(exchangeError.message)}`
    )
  }

  // ── Get the authenticated user ────────────────────────────────────────
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[Auth Callback] getUser failed:', userError?.message)
    return NextResponse.redirect(`${origin}/login/${portal}?error=auth_failed`)
  }

  // ── Admin portal lock ─────────────────────────────────────────────────
  if (portal === 'admin' && user.email !== 'pranjalmishra2409@gmail.com') {
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
    return NextResponse.redirect(`${origin}/login/${portal}?error=account_banned`)
  }

  // Existing profile with wrong portal — redirect to correct dashboard
  if (profile && profile.role !== portal) {
    // Don't sign out — just send them to their actual dashboard
    return redirectWithCookies(`${origin}/dashboard/${profile.role}`)
  }

  // ── Create profile if new user ────────────────────────────────────────
  if (!profile) {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
      avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? '',
      role: portal,
      login_portal: portal,
      last_login_at: new Date().toISOString(),
      is_active: true,
    })

    if (insertError) {
      console.error('[Auth Callback] Profile insert failed:', insertError.message)
    }

    // For students, also create the students row
    if (portal === 'student') {
      await supabase.from('students').upsert(
        { id: user.id, profile_is_public: false, profile_views: 0 },
        { onConflict: 'id' }
      )
    }
  } else {
    // Update last login timestamp
    await supabase
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)
  }

  // ── Redirect to the correct dashboard WITH cookies ────────────────────
  const role = profile?.role ?? portal
  return redirectWithCookies(`${origin}/dashboard/${role}`)
}

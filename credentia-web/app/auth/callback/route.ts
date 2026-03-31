import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth Callback Route Handler — SERVER-SIDE PKCE code exchange.
 *
 * Flow:
 *   1. User clicks "Sign in with Google" → Supabase redirects to Google
 *   2. Google redirects back to Supabase → Supabase redirects here with ?code=xxx&portal=yyy
 *   3. This route handler exchanges the code for a session (server-side)
 *   4. Session cookies are set automatically via cookies() from next/headers
 *   5. User is redirected to /dashboard/[role]
 *
 * Why server-side? Because PKCE stores a code_verifier in a cookie.
 * The server can read this cookie and send it along with the code to Supabase.
 * Client-side pages using createBrowserClient often fail to read this cookie in production.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const portal = searchParams.get('portal') || 'student'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Determine the correct origin, respecting Vercel's x-forwarded-host
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = request.headers.get('host')
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const origin = forwardedHost
    ? `${protocol}://${forwardedHost}`
    : `${protocol}://${host}`

  // Handle OAuth errors from Supabase/Google
  if (error) {
    const msg = encodeURIComponent(errorDescription || error)
    return NextResponse.redirect(`${origin}/login/${portal}?error=${msg}`)
  }

  // No code = nothing to exchange
  if (!code) {
    return NextResponse.redirect(`${origin}/login/${portal}?error=no_code`)
  }

  // Create a Supabase server client using cookies() from next/headers.
  // This is the official Supabase pattern for Next.js App Router.
  // cookies().set() in Route Handlers writes directly to the response,
  // so session cookies survive the redirect.
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll can throw when called from a Server Component (read-only).
            // In Route Handlers this won't happen, but we catch just in case.
          }
        },
      },
    }
  )

  // ── Exchange the auth code for a session ──────────────────────────────────
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[Auth Callback] Code exchange failed:', exchangeError.message)
    return NextResponse.redirect(
      `${origin}/login/${portal}?error=${encodeURIComponent(exchangeError.message)}`
    )
  }

  // ── Get the authenticated user ────────────────────────────────────────────
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[Auth Callback] getUser failed:', userError?.message)
    return NextResponse.redirect(`${origin}/login/${portal}?error=auth_failed`)
  }

  // ── Admin portal lock ─────────────────────────────────────────────────────
  if (portal === 'admin' && user.email !== 'pranjalmishra2409@gmail.com') {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/login/admin?error=not_authorized`)
  }

  // ── Check for existing profile ────────────────────────────────────────────
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

  // Existing profile with wrong portal
  if (profile && profile.role !== portal) {
    await supabase.auth.signOut()
    return NextResponse.redirect(
      `${origin}/login/${portal}?error=wrong_portal&correct=${profile.role}`
    )
  }

  // ── Create profile if new user ────────────────────────────────────────────
  if (!profile) {
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
      avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? '',
      role: portal,
      login_portal: portal,
      last_login_at: new Date().toISOString(),
      is_active: true,
    })

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

  // ── Redirect to the correct dashboard ─────────────────────────────────────
  const role = profile?.role ?? portal
  return NextResponse.redirect(`${origin}/dashboard/${role}`)
}

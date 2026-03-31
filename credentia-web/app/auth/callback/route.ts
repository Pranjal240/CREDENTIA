import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Valid portal types — used to validate the OAuth state param
const VALID_PORTALS = ['student', 'university', 'company', 'admin'] as const
type Portal = (typeof VALID_PORTALS)[number]

function isValidPortal(p: string | null | undefined): p is Portal {
  return !!p && (VALID_PORTALS as readonly string[]).includes(p)
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code       = url.searchParams.get('code')
    const oauthError = url.searchParams.get('error')

    // ── Parse portal from the ?portal= query param ─────────────────────────
    const portalCandidate = url.searchParams.get('portal')
    const portalType: Portal | null = isValidPortal(portalCandidate) ? portalCandidate : null

    console.log('[auth/callback] portal:', portalType, 'hasCode:', !!code, 'error:', oauthError)

    // ── OAuth provider returned an error ────────────────────────────────────
    if (oauthError) {
      const target = portalType ? `/login/${portalType}` : '/login/student'
      return NextResponse.redirect(new URL(`${target}?error=oauth_cancelled`, url.origin))
    }

    if (!code) {
      const target = portalType ? `/login/${portalType}` : '/login/student'
      return NextResponse.redirect(new URL(`${target}?error=auth_failed`, url.origin))
    }

    // ────────────────────────────────────────────────────────────────────────
    // CRITICAL: Cookie handling for Next.js App Router + Supabase SSR.
    //
    // The `exchangeCodeForSession` call sets session cookies. But we need to
    // return a REDIRECT response that ALSO carries those Set-Cookie headers.
    // We use a response object that collects all cookies, then transfer them
    // to the final redirect response.
    // ────────────────────────────────────────────────────────────────────────
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

    // Helper: build redirect with all accumulated cookies attached
    const redirectWithCookies = (path: string): NextResponse => {
      const res = NextResponse.redirect(new URL(path, url.origin))
      for (const cookie of cookieJar) {
        res.cookies.set({
          name: cookie.name,
          value: cookie.value,
          ...cookie.options,
        })
      }
      return res
    }

    // ── Exchange the PKCE code for a session ────────────────────────────────
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError || !sessionData.user) {
      console.error('[auth/callback] Code exchange failed:', exchangeError?.message)
      const target = portalType ? `/login/${portalType}` : '/login/student'
      return redirectWithCookies(`${target}?error=auth_failed`)
    }

    const user = sessionData.user
    console.log('[auth/callback] User:', user.email, 'portal:', portalType)

    // ── Service-role client for profile writes (bypasses RLS) ───────────────
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── Fetch existing profile ──────────────────────────────────────────────
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role, is_active')
      .eq('id', user.id)
      .single()

    console.log('[auth/callback] Profile role:', profile?.role, 'err:', profileError?.message)

    // ── BANNED CHECK ────────────────────────────────────────────────────────
    if (profile?.is_active === false) {
      await supabase.auth.signOut()
      return redirectWithCookies('/?error=account_banned')
    }

    // ── RETURNING USER ──────────────────────────────────────────────────────
    if (profile) {
      const existingRole = profile.role as Portal

      // ── ADMIN OVERRIDE ──────────────────────────────────────────────────
      if (portalType === 'admin' && existingRole !== 'admin') {
        const { data: wl } = await adminClient
          .from('admin_whitelist')
          .select('email')
          .eq('email', user.email)
          .single()

        if (wl) {
          await adminClient
            .from('profiles')
            .update({
              role: 'admin',
              last_login_at: new Date().toISOString(),
              last_login_portal: 'admin',
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

          console.log('[auth/callback] Admin upgrade → /dashboard/admin')
          return redirectWithCookies('/dashboard/admin')
        } else {
          await supabase.auth.signOut()
          return redirectWithCookies('/login/admin?error=not_authorized')
        }
      }

      // ── WRONG PORTAL DETECTION ──────────────────────────────────────────
      if (portalType && existingRole !== portalType) {
        await supabase.auth.signOut()
        return redirectWithCookies(
          `/login/${portalType}?error=wrong_portal&correct=${existingRole}`
        )
      }

      // Correct portal — update last login timestamp
      await adminClient
        .from('profiles')
        .update({
          last_login_at: new Date().toISOString(),
          last_login_portal: portalType ?? existingRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      console.log('[auth/callback] Returning user → /dashboard/' + existingRole)
      return redirectWithCookies(`/dashboard/${existingRole}`)
    }

    // ── NEW USER (first login ever) ─────────────────────────────────────────
    if (!portalType) {
      await supabase.auth.signOut()
      return redirectWithCookies('/login/student?error=no_portal_context')
    }

    // ── ADMIN WHITELIST GATE ────────────────────────────────────────────────
    if (portalType === 'admin') {
      const { data: wl } = await adminClient
        .from('admin_whitelist')
        .select('email')
        .eq('email', user.email)
        .single()

      if (!wl) {
        await supabase.auth.signOut()
        return redirectWithCookies('/login/admin?error=not_authorized')
      }
    }

    // ── CREATE PROFILE ──────────────────────────────────────────────────────
    const { error: insertError } = await adminClient.from('profiles').insert({
      id:                user.id,
      email:             user.email,
      full_name:         user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
      avatar_url:        user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      role:              portalType,
      login_portal:      portalType,
      last_login_at:     new Date().toISOString(),
      last_login_portal: portalType,
      is_active:         true,
      created_at:        new Date().toISOString(),
      updated_at:        new Date().toISOString(),
    })

    if (insertError) {
      console.error('[auth/callback] Profile insert failed:', insertError.message)
    }

    // If student, create students row
    if (portalType === 'student') {
      await adminClient.from('students').upsert({
        id:                user.id,
        profile_is_public: false,
        profile_views:     0,
        created_at:        new Date().toISOString(),
        updated_at:        new Date().toISOString(),
      }, { onConflict: 'id' })
    }

    console.log('[auth/callback] New user → /dashboard/' + portalType)
    return redirectWithCookies(`/dashboard/${portalType}`)

  } catch (error: any) {
    console.error('[auth/callback] UNHANDLED ERROR:', error?.message, error?.stack)
    return NextResponse.redirect(new URL('/login?error=auth_failed', new URL(request.url).origin))
  }
}

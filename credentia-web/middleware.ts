import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const VALID_ROLES = ['student', 'university', 'company', 'admin']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const pathname = request.nextUrl.pathname

  // ── Skip static assets, API routes, auth routes ─────────────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/verify/') ||
    pathname.includes('.')
  ) {
    return response
  }

  // ── Build SSR Supabase client ───────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // ── Get authenticated user (validated against Supabase server) ──────────
  const { data: { user } } = await supabase.auth.getUser()

  // ────────────────────────────────────────────────────────────────────────
  // DASHBOARD PROTECTION
  // ────────────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    // No user → kick to landing
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Fetch role from DB (never trust JWT)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // Banned check
    if (profile?.is_active === false) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/', request.url))
    }

    const role = profile?.role
    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    const correctPath = `/dashboard/${role}`

    // Bare /dashboard → redirect to correct panel
    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL(correctPath, request.url))
    }

    // Wrong panel → redirect to correct panel
    if (!pathname.startsWith(correctPath)) {
      return NextResponse.redirect(new URL(correctPath, request.url))
    }

    // Correct panel → allow through
    return response
  }

  // ────────────────────────────────────────────────────────────────────────
  // LANDING PAGE REDIRECT FOR LOGGED-IN USERS
  // ────────────────────────────────────────────────────────────────────────
  if (pathname === '/' && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role && VALID_ROLES.includes(profile.role)) {
      return NextResponse.redirect(
        new URL(`/dashboard/${profile.role}`, request.url)
      )
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // LOGIN PAGES — allow access even when logged in
  // Users need to be able to switch portals and sign out
  // ────────────────────────────────────────────────────────────────────────

  // Everything else — pass through
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

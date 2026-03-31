import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  // ── 1. Canonical domain redirect (non-www → www) ──────────────────────────
  const host = request.headers.get('host') || ''
  if (host === 'credentiaonline.in') {
    const url = request.nextUrl.clone()
    url.host = 'www.credentiaonline.in'
    url.protocol = 'https:'
    return NextResponse.redirect(url, { status: 301 })
  }

  // ── 2. Allow auth routes and public paths to pass through ─────────────────
  // CRITICAL: /auth/callback MUST be allowed through. The browser client
  // needs to load this page to run exchangeCodeForSession(). If middleware
  // intercepts it, the PKCE exchange never happens.
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/register') ||
    pathname === '/' ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next()
  }

  // ── 3. For /dashboard/* — verify session via Supabase ────────────────────
  if (pathname.startsWith('/dashboard')) {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      // Detect which portal from the URL so we can redirect to the right login
      const portalMatch = pathname.match(/^\/dashboard\/(\w+)/)
      const portal = portalMatch ? portalMatch[1] : 'student'
      return NextResponse.redirect(new URL(`/login/${portal}`, request.url))
    }

    // Check profile exists and is active
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || profile.is_active === false) {
      return NextResponse.redirect(new URL('/login/student', request.url))
    }

    // Enforce role-based dashboard routing
    const DASHBOARD_ROUTES: Record<string, string> = {
      student: '/dashboard/student',
      university: '/dashboard/university',
      company: '/dashboard/company',
      admin: '/dashboard/admin',
    }

    const correctPath = DASHBOARD_ROUTES[profile.role]
    if (correctPath && !pathname.startsWith(correctPath)) {
      return NextResponse.redirect(new URL(correctPath, request.url))
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT static files and Next.js internals
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff|woff2)$).*)',
  ],
}

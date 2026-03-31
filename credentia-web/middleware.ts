import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Maps every valid role to its allowed dashboard base path
const PORTAL_PATHS: Record<string, string> = {
  student:    '/dashboard/student',
  university: '/dashboard/university',
  company:    '/dashboard/company',
  admin:      '/dashboard/admin',
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const pathname = request.nextUrl.pathname

  // ── Skip static assets, API routes, and auth routes ─────────────────────
  // Auth routes MUST be skipped so the PKCE callback can complete.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/verify/') ||
    pathname.includes('.')
  ) {
    return response
  }

  // ── Build an SSR Supabase client that can read/write session cookies ─────
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

  // ── Authenticate the user (getUser is the ONLY reliable method here) ─────
  // getSession() can return stale/tampered JWTs without contacting Supabase.
  // getUser() validates against the Supabase Auth server on every call.
  const { data: { user } } = await supabase.auth.getUser()

  // ────────────────────────────────────────────────────────────────────────
  // PROTECT DASHBOARD ROUTES
  // ────────────────────────────────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    // No authenticated user → boot to landing
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Fetch the user's role and active status from the DB.
    // We NEVER trust the JWT for role — always go to DB. This prevents
    // role spoofing if someone manually crafts a session token.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // ── Banned account ────────────────────────────────────────────────────
    if (profile?.is_active === false) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/?error=account_banned', request.url))
    }

    const correctBase = PORTAL_PATHS[profile?.role ?? '']

    // ── Bare /dashboard → redirect to their panel ─────────────────────────
    if (pathname === '/dashboard') {
      return NextResponse.redirect(
        new URL(correctBase ?? '/dashboard/student', request.url)
      )
    }

    // ── User accessing a different role's panel → kick to their own ───────
    if (correctBase && !pathname.startsWith(correctBase)) {
      return NextResponse.redirect(new URL(correctBase, request.url))
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // REDIRECT LOGGED-IN USERS AWAY FROM LOGIN PAGES & LANDING
  // ────────────────────────────────────────────────────────────────────────
  const isLoginPath  = pathname.startsWith('/login')
  const isRootPath   = pathname === '/'

  if ((isLoginPath || isRootPath) && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role && PORTAL_PATHS[profile.role]) {
      return NextResponse.redirect(
        new URL(PORTAL_PATHS[profile.role], request.url)
      )
    }
  }

  return response
}

export const config = {
  // Run on every request except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

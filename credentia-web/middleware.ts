import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const pathname = request.nextUrl.pathname

  // Skip static assets, API routes, auth routes, and verify routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/verify/') ||
    pathname.includes('.')
  ) {
    return response
  }

  // Public pages — allow without auth
  const publicPages = ['/', '/login', '/register']
  if (publicPages.includes(pathname)) {
    return response
  }

  // Create Supabase client wired to request/response cookies
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

  // Use getUser() — this is the ONLY reliable method in middleware.
  // getSession() can return stale/tampered JWTs without contacting Supabase.
  const { data: { user }, error } = await supabase.auth.getUser()

  // If no authenticated user and they're trying to access /dashboard, redirect to login
  if ((!user || error) && pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated and hits any /dashboard route, check role authorization
  if (user && pathname.startsWith('/dashboard')) {
    // Fetch role from profiles table securely
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'student'
    const allowedPrefix = `/dashboard/${role}`

    // Redirect if they hit bare /dashboard or try to access another role's dashboard
    if (pathname === '/dashboard' || !pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(allowedPrefix, request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

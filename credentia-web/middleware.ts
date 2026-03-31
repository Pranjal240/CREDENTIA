import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROLE_REDIRECT: Record<string, string> = {
  student    : '/dashboard/student',
  university : '/dashboard/university',
  company    : '/dashboard/company',
  admin      : '/dashboard/admin',
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const path = request.nextUrl.pathname

  // Only protect /dashboard routes
  // Let /login/* and / pass through freely
  if (!path.startsWith('/dashboard')) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // No session → kick to login/home
  if (!session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Fetch role from DB
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', session.user.id)
    .single()

  if (!profile) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (profile.is_active === false) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/?error=account_banned', request.url))
  }

  // If trying to access bare /dashboard, redirect to the correct role dashboard
  if (path === '/dashboard') {
     const base = ROLE_REDIRECT[profile.role]
     if (base) return NextResponse.redirect(new URL(base, request.url))
  }

  const correctBase = ROLE_REDIRECT[profile.role]
  if (correctBase && !path.startsWith(correctBase)) {
    return NextResponse.redirect(new URL(correctBase, request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*']
  // Only match dashboard — NOT / or /login/*
}

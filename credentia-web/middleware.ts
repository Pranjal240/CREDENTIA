import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROLE_REDIRECTS: Record<string, string> = {
  student: '/dashboard/student',
  company: '/dashboard/company',
  university: '/dashboard/university',
  admin: '/dashboard/admin',
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const path = req.nextUrl.pathname
  const isDashboard = path.startsWith('/dashboard')
  const isAuth = path.startsWith('/login') || path.startsWith('/register')

  // Unauthenticated user trying to access dashboard
  if (isDashboard && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Already logged in user on login/register page
  if (isAuth && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    const redirect = ROLE_REDIRECTS[profile?.role || 'student']
    return NextResponse.redirect(new URL(redirect, req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}

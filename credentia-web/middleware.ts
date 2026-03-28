import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // Public routes — always accessible
  const publicRoutes = ['/', '/about', '/features', '/login', '/register', '/verify']
  const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith('/verify/'))
  if (isPublic) return response

  // API routes — skip middleware
  if (pathname.startsWith('/api/')) return response

  // Not logged in — redirect to login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based protection
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const role = profile?.role || 'student'

  if (pathname.startsWith('/dashboard/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
  }
  if (pathname.startsWith('/dashboard/company') && role !== 'company') {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
  }
  if (pathname.startsWith('/dashboard/university') && role !== 'university') {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}

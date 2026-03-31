import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname

  // Only protect /dashboard — let everything else pass
  if (!path.startsWith('/dashboard')) {
    return supabaseResponse
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || profile.is_active === false) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const ROUTES: Record<string, string> = {
    student    : '/dashboard/student',
    university : '/dashboard/university',
    company    : '/dashboard/company',
    admin      : '/dashboard/admin',
  }

  const correct = ROUTES[profile.role]
  if (correct && !path.startsWith(correct)) {
    return NextResponse.redirect(new URL(correct, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*']
}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const portal = requestUrl.searchParams.get('portal') ?? 'student'

  // ALWAYS redirect to www to fix cookie mismatch
  const isWWW = requestUrl.hostname.startsWith('www.')
  if (!isWWW && requestUrl.hostname !== 'localhost') {
    const wwwUrl = new URL(request.url)
    wwwUrl.hostname = 'www.' + requestUrl.hostname
    return NextResponse.redirect(wwwUrl.toString())
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', request.url))
  }

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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Exchange code for session — PKCE handled here
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('Exchange error:', exchangeError)
    return NextResponse.redirect(
      new URL(
        `/?error=exchange_failed&detail=` + encodeURIComponent(exchangeError.message),
        request.url
      )
    )
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/?error=no_user', request.url))
  }

  // Check existing profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  // Banned
  if (profile?.is_active === false) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/?error=account_banned', request.url))
  }

  // Returning user
  if (profile) {
    if (profile.role !== portal) {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL(
          `/login/${portal}?error=wrong_portal&correct=${profile.role}`,
          request.url
        )
      )
    }
    await supabase.from('profiles').update({
      last_login_at: new Date().toISOString()
    }).eq('id', user.id)

    return NextResponse.redirect(new URL(`/dashboard/${profile.role}`, request.url))
  }

  // New user — admin whitelist check
  if (portal === 'admin') {
    const { data: wl } = await supabase
      .from('admin_whitelist')
      .select('email')
      .eq('email', user.email)
      .single()

    if (!wl) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login/admin?error=not_authorized', request.url))
    }
  }

  // Create new profile
  await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name ?? '',
    avatar_url: user.user_metadata?.avatar_url ?? '',
    role: portal,
    login_portal: portal,
    last_login_at: new Date().toISOString(),
    is_active: true,
    created_at: new Date().toISOString()
  })

  // Create student record if needed
  if (portal === 'student') {
    await supabase.from('students').upsert({
      id: user.id,
      profile_is_public: false,
      profile_views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  return NextResponse.redirect(new URL(`/dashboard/${portal}/onboarding`, request.url))
}

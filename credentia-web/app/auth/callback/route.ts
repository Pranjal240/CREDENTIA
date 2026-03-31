import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const portal = url.searchParams.get('portal')
    ?? 'student'

  // NO www-redirect here — it was consuming the code
  // The redirectTo is already hardcoded to www in login page

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=no_code', request.url)
    )
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
          try {
            cookiesToSet.forEach(
              ({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignore in route handler
          }
        },
      },
    }
  )

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('EXCHANGE ERROR:', exchangeError.message)
    return NextResponse.redirect(
      new URL(
        `/login/${portal}?error=exchange_failed`,
        request.url
      )
    )
  }

  const { data: { user } } =
    await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(
      new URL('/login?error=no_user', request.url)
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  if (profile?.is_active === false) {
    await supabase.auth.signOut()
    return NextResponse.redirect(
      new URL('/login?error=account_banned', request.url)
    )
  }

  if (profile) {
    if (profile.role !== portal) {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL(
          `/login/${portal}?error=wrong_portal`
          + `&correct=${profile.role}`,
          request.url
        )
      )
    }
    await supabase.from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)
    return NextResponse.redirect(
      new URL(`/dashboard/${profile.role}`, request.url)
    )
  }

  // New user
  if (portal === 'admin') {
    const adminEmails = [
      'pranjalmsihra2409@gmail.com',  // The typo'd one provided earlier
      'praanjalmishra2409@gmail.com',
      'pranjalmishra2409@gmail.com',  // The actual one they just logged in with
      'pranjalwork2602@gmail.com'     // Another login detected
    ]
    const isHardcodedAdmin = adminEmails.includes(user.email ?? '')

    let wl = null
    if (!isHardcodedAdmin) {
      const { data } = await supabase
        .from('admin_whitelist')
        .select('email')
        .eq('email', user.email)
        .single()
      wl = data
    }

    if (!wl && !isHardcodedAdmin) {
      await supabase.auth.signOut()
      return NextResponse.redirect(
        new URL(
          '/login/admin?error=not_authorized',
          request.url
        )
      )
    }
  }

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

  if (portal === 'student') {
    await supabase.from('students').upsert({
      id: user.id,
      profile_is_public: false,
      profile_views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  return NextResponse.redirect(
    new URL(
      `/dashboard/${portal}`,
      request.url
    )
  )
}

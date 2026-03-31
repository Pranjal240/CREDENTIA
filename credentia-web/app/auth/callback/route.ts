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

  const cookiesToSetLater: { name: string; value: string; options: any }[] = []

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
            cookiesToSet.forEach(({ name, value, options }) => {
              // Try to set native route cookies
              cookieStore.set(name, value, options)
              // Store them to explicitly append onto NextResponse
              cookiesToSetLater.push({ name, value, options })
            })
          } catch {
            // ignore
          }
        },
      },
    }
  )

  // Helper to append guaranteed cookies to redirect
  const getGuaranteedRedirect = (urlPath: string) => {
    const response = NextResponse.redirect(new URL(urlPath, request.url))
    cookiesToSetLater.forEach(({ name, value, options }) => {
      response.cookies.set({ name, value, ...options })
    })
    return response
  }

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('EXCHANGE ERROR:', exchangeError.message)
    return getGuaranteedRedirect(`/login/${portal}?error=exchange_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return getGuaranteedRedirect('/login?error=no_user')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  if (profile?.is_active === false) {
    await supabase.auth.signOut()
    return getGuaranteedRedirect('/login?error=account_banned')
  }

  if (profile) {
    if (profile.role !== portal) {
      await supabase.auth.signOut()
      return getGuaranteedRedirect(`/login/${portal}?error=wrong_portal&correct=${profile.role}`)
    }
    await supabase.from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id)
    return getGuaranteedRedirect(`/dashboard/${profile.role}`)
  }

  // New user
  if (portal === 'admin') {
    const adminEmails = [
      'pranjalmsihra2409@gmail.com',
      'praanjalmishra2409@gmail.com',
      'pranjalmishra2409@gmail.com',
      'pranjalwork2602@gmail.com'
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
      return getGuaranteedRedirect('/login/admin?error=not_authorized')
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

  return getGuaranteedRedirect(`/dashboard/${portal}`)
}

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const portal = searchParams.get('portal') || 'student'

  const validPortals = ['student', 'university', 'company', 'admin']
  const safePortal = validPortals.includes(portal) ? portal : 'student'

  if (!code) {
    return NextResponse.redirect(new URL(`/login/${safePortal}?error=invalid_request`, origin))
  }

  // Create a mutable response to attach cookies to
  const response = NextResponse.next()

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[Auth Callback] Code exchange failed:', exchangeError.message)
    return NextResponse.redirect(new URL(`/login/${safePortal}?error=${encodeURIComponent(exchangeError.message)}`, origin))
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user || userError) {
    console.error('[Auth Callback] User retrieval failed:', userError?.message)
    return NextResponse.redirect(new URL(`/login/${safePortal}?error=auth_failed`, origin))
  }

  // Admin client for DB writes (bypasses RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Admin whitelist check
  if (safePortal === 'admin') {
    const { data: wl } = await supabaseAdmin
      .from('admin_whitelist')
      .select('email')
      .eq('email', user.email)
      .maybeSingle()

    if (!wl) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login/admin?error=not_authorized', origin))
    }
  }

  // Get existing profile (if any)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role, login_portal, full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  const isFirstLogin = !profile?.login_portal
  let finalRole = profile?.role || safePortal
  if (isFirstLogin && safePortal !== 'admin') {
    finalRole = safePortal
  }

  // Fetch existing role-specific record to prevent overwriting manual settings
  let existingRoleData: any = null
  if (!isFirstLogin) {
    if (finalRole === 'student') {
      const { data } = await supabaseAdmin.from('students').select('name').eq('id', user.id).maybeSingle()
      existingRoleData = data
    } else if (finalRole === 'university') {
      const { data } = await supabaseAdmin.from('universities').select('university_name').eq('id', user.id).maybeSingle()
      existingRoleData = data
    } else if (finalRole === 'company') {
      const { data } = await supabaseAdmin.from('companies').select('company_name').eq('id', user.id).maybeSingle()
      existingRoleData = data
    }
  }

  // Determine final name
  const finalName = profile?.full_name ? profile.full_name : (user.user_metadata?.full_name || user.user_metadata?.name || '')

  // Upsert profile without wiping existing name if already present
  await supabaseAdmin.from('profiles').upsert({
    id: user.id,
    email: user.email,
    full_name: finalName,
    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
    role: finalRole,
    login_portal: profile?.login_portal || safePortal,
    last_login_at: new Date().toISOString(),
    last_login_portal: safePortal,
    is_active: true,
  }, { onConflict: 'id' })

  // Upsert role-specific table safely
  try {
    if (finalRole === 'student') {
      await supabaseAdmin.from('students').upsert({
        id: user.id,
        name: existingRoleData?.name ? existingRoleData.name : finalName,
        email: user.email ?? '',
        profile_is_public: true,
        // Only set profile_views if the record doesn't exist to avoid resetting it
        ...(existingRoleData ? {} : { profile_views: 0 }),
      }, { onConflict: 'id' })
    } else if (finalRole === 'university') {
      await supabaseAdmin.from('universities').upsert({
        id: user.id,
        university_name: existingRoleData?.university_name ? existingRoleData.university_name : finalName,
      }, { onConflict: 'id' })
    } else if (finalRole === 'company') {
      await supabaseAdmin.from('companies').upsert({
        id: user.id,
        company_name: existingRoleData?.company_name ? existingRoleData.company_name : finalName,
      }, { onConflict: 'id' })
    }
  } catch (e) {
    console.error('[Auth Callback] Role-specific upsert failed:', e)
  }

  // Build the redirect response with the session cookies attached
  const destination = next ? `${origin}${next}` : `${origin}/dashboard/${finalRole}`
  const redirectResponse = NextResponse.redirect(new URL(destination, origin))
  
  // Copy all set-cookie headers from our response to the redirect
  response.cookies.getAll().forEach(cookie => {
    redirectResponse.cookies.set(cookie)
  })

  return redirectResponse
}

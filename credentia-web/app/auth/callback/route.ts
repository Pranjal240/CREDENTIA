import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_EMAIL = 'pranjalmishra2409@gmail.com'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const errorDescription = url.searchParams.get('error_description')

  // Handle OAuth errors returned by the provider
  if (error) {
    console.error('[auth/callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent(errorDescription || error), request.url)
    )
  }

  if (!code) {
    console.error('[auth/callback] No code provided')
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  // Step 1: Exchange the code for a session using the SSR client (sets cookies)
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
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.user) {
    console.error('[auth/callback] Code exchange failed:', exchangeError?.message)
    return NextResponse.redirect(
      new URL('/login?error=' + encodeURIComponent(exchangeError?.message || 'exchange_failed'), request.url)
    )
  }

  const user = data.user

  // Step 2: Use the SERVICE ROLE client for profile writes (bypasses RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Step 3: Check if profile exists
  const { data: existingProfile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  // Get the role they selected before clicking "Continue with Google"
  const pendingRoleCookie = request.cookies.get('pending_oauth_role')?.value
  let role = pendingRoleCookie || 'student'

  // Always force the admin email to be 'admin'
  if (user.email === ADMIN_EMAIL) {
    role = 'admin'
  }

  if (profileError || !existingProfile) {
    // Create profile

    await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    // If student, also create the student record
    if (role === 'student') {
      await supabaseAdmin.from('students').upsert({
        id: user.id,
        profile_is_public: false,
        profile_views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }

    console.log(`[auth/callback] Created new profile for ${user.email} with role=${role}`)
  } else {
    // Existing user
    role = existingProfile.role || 'student'
    if (user.email === ADMIN_EMAIL && role !== 'admin') {
      await supabaseAdmin.from('profiles').update({ role: 'admin', updated_at: new Date().toISOString() }).eq('id', user.id)
      role = 'admin'
    }
  }

  // Step 4: Redirect to role-specific dashboard
  // On Vercel, use x-forwarded-host to get the real public domain
  const dashboardPath = `/dashboard/${role}`
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocal = process.env.NODE_ENV === 'development'

  if (isLocal) {
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  } else if (forwardedHost) {
    return NextResponse.redirect(new URL(`https://${forwardedHost}${dashboardPath}`))
  } else {
    return NextResponse.redirect(new URL(dashboardPath, request.url))
  }
}

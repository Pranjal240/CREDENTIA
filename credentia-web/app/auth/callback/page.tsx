'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const VALID_ROLES = ['student', 'university', 'company', 'admin']

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Completing login...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Exchange the PKCE code for a session.
        //    The code is in the URL query params (?code=XXX).
        //    The PKCE verifier is in cookies on the SAME domain.
        //    Since this runs client-side, the browser has access
        //    to both — no www vs non-www cookie mismatch.
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const errorParam = params.get('error')

        if (errorParam) {
          console.error('[callback] OAuth error:', errorParam)
          router.replace('/login?error=auth_failed')
          return
        }

        if (code) {
          setStatus('Exchanging code...')
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('[callback] Exchange error:', exchangeError.message)
            router.replace('/login?error=exchange_failed')
            return
          }
        }

        // 2. Get the authenticated user
        setStatus('Verifying identity...')
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user || !user.email) {
          console.error('[callback] No user:', userError?.message)
          router.replace('/login?error=no_user')
          return
        }

        const email = user.email.toLowerCase()

        // 3. Read portal context from localStorage (set before OAuth redirect)
        const portalType = localStorage.getItem('credentia_login_portal') || 'student'
        localStorage.removeItem('credentia_login_portal')

        console.log('[callback] user:', email, 'portal:', portalType)

        // 4. Check existing profile
        setStatus('Loading profile...')
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, is_active')
          .eq('id', user.id)
          .single()

        // ── RETURNING USER ──────────────────────────────────────────
        if (profile) {
          if (profile.is_active === false) {
            await supabase.auth.signOut()
            router.replace('/?error=account_banned')
            return
          }

          const dbRole = profile.role

          if (dbRole && VALID_ROLES.includes(dbRole)) {
            // Update last login timestamp
            await supabase
              .from('profiles')
              .update({
                last_login_at: new Date().toISOString(),
                last_login_portal: portalType,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id)

            console.log('[callback] returning user →', `/dashboard/${dbRole}`)
            router.replace(`/dashboard/${dbRole}`)
            return
          }

          // Invalid role in DB — fix it
          const fixedRole = VALID_ROLES.includes(portalType) ? portalType : 'student'
          await supabase
            .from('profiles')
            .update({
              role: fixedRole,
              login_portal: fixedRole,
              last_login_portal: fixedRole,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

          router.replace(`/dashboard/${fixedRole}`)
          return
        }

        // ── NEW USER ────────────────────────────────────────────────
        setStatus('Creating account...')
        const newRole = VALID_ROLES.includes(portalType) ? portalType : 'student'

        // Admin whitelist check
        if (newRole === 'admin') {
          const { data: wl } = await supabase
            .from('admin_whitelist')
            .select('email')
            .eq('email', email)
            .single()

          if (!wl) {
            await supabase.auth.signOut()
            router.replace('/login/admin?error=not_authorized')
            return
          }
        }

        // Create profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: email,
            full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
            avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
            role: newRole,
            login_portal: newRole,
            last_login_at: new Date().toISOString(),
            last_login_portal: newRole,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('[callback] Profile insert error:', insertError.message)
          // If insert fails due to conflict, the profile might already exist
          // Retry by redirecting to the dashboard
          router.replace(`/dashboard/${newRole}`)
          return
        }

        // Create student record if needed
        if (newRole === 'student') {
          await supabase.from('students').upsert({
            id: user.id,
            profile_is_public: false,
            profile_views: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' })
        }

        console.log('[callback] new user →', `/dashboard/${newRole}`)
        router.replace(`/dashboard/${newRole}`)

      } catch (err: any) {
        console.error('[callback] Unexpected error:', err.message)
        router.replace('/login?error=auth_failed')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
         style={{ background: '#0B0E1A' }}>
      <div className="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">{status}</p>
    </div>
  )
}

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/**
 * Auth Callback Page — PKCE Flow
 *
 * This page handles the OAuth callback after Google authentication.
 * The URL will contain ?code=XXX&portal=YYY.
 *
 * We use the SAME supabase singleton from lib/supabase.ts that the
 * login page used to initiate the flow. This ensures the PKCE
 * code_verifier cookie is readable from the same storage.
 */

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Completing sign in…')

  useEffect(() => {
    const code = searchParams.get('code')
    const portal = searchParams.get('portal') || 'student'
    const validPortals = ['student', 'university', 'company', 'admin']
    const safePortal = validPortals.includes(portal) ? portal : 'student'

    const handleCallback = async () => {
      try {
        // ── Step 1: Exchange code for session ──────────────────────────
        if (code) {
          setStatus('Exchanging authorization code…')
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('[Callback] exchangeCodeForSession error:', exchangeError.message)
            // Don't give up yet — maybe the session was already set
          }
        }

        // ── Step 2: Get the user (might already be set from auto-detection) ──
        setStatus('Verifying your identity…')
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error('[Callback] getUser failed:', userError?.message)
          // Wait and retry once — the session might need a moment to propagate
          await new Promise(r => setTimeout(r, 1500))
          const { data: { user: retryUser } } = await supabase.auth.getUser()
          
          if (!retryUser) {
            router.replace(`/login/${safePortal}?error=auth_failed`)
            return
          }
          // Use the retry user
          await processUser(retryUser, safePortal)
          return
        }

        await processUser(user, safePortal)
      } catch (err: any) {
        console.error('[Callback] Unexpected error:', err)
        router.replace(`/login/${safePortal}?error=${encodeURIComponent(err?.message || 'unexpected_error')}`)
      }
    }

    const processUser = async (user: any, portal: string) => {
      // ── Admin gate ────────────────────────────────────────────────
      if (portal === 'admin') {
        setStatus('Checking admin access…')
        const { data: wl, error: wlError } = await supabase
          .from('admin_whitelist')
          .select('email')
          .eq('email', user.email)
          .maybeSingle()

        if (wlError) {
          console.error('[Callback] admin_whitelist query error:', wlError.message)
        }

        if (!wl) {
          setStatus('Not authorized — signing out…')
          await supabase.auth.signOut()
          router.replace('/login/admin?error=not_authorized')
          return
        }
      }

      // ── Check existing profile ──────────────────────────────────
      setStatus('Setting up your account…')
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error('[Callback] profile query error:', profileError.message)
        // Try to continue anyway
      }

      if (existingProfile) {
        // RETURNING USER
        await supabase
          .from('profiles')
          .update({
            last_login_at: new Date().toISOString(),
            last_login_portal: portal,
          })
          .eq('id', user.id)

        setStatus(`Welcome back! Redirecting…`)
        router.replace(`/dashboard/${existingProfile.role}`)
        return
      }

      // ── NEW USER → create profile ──────────────────────────────
      setStatus('Creating your profile…')
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
        avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? '',
        role: portal,
        login_portal: portal,
        last_login_at: new Date().toISOString(),
        last_login_portal: portal,
        is_active: true,
      })

      if (insertError) {
        console.error('[Callback] profile insert error:', insertError.message)
        // Race condition: profile might have been created by trigger
        const { data: retryProfile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle()

        if (retryProfile) {
          router.replace(`/dashboard/${retryProfile.role}`)
          return
        }
        // Last resort: just go to dashboard
        router.replace(`/dashboard/${portal}`)
        return
      }

      // Create student record if needed
      if (portal === 'student') {
        try {
          await supabase
            .from('students')
            .upsert(
              { id: user.id, profile_is_public: false, profile_views: 0 },
              { onConflict: 'id' }
            )
        } catch {
          // ignore errors
        }
      }

      setStatus('Welcome! Redirecting…')
      router.replace(`/dashboard/${portal}`)
    }

    handleCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1145 50%, #0f0c29 100%)',
        color: '#ffffff',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: '3px solid rgba(139, 92, 246, 0.3)',
          borderTopColor: '#8b5cf6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: 24,
        }}
      />
      <p style={{ fontSize: 18, fontWeight: 500, opacity: 0.9, margin: 0 }}>
        {status}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0c29 0%, #1a1145 50%, #0f0c29 100%)',
            color: '#ffffff',
          }}
        >
          <p>Loading…</p>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  )
}

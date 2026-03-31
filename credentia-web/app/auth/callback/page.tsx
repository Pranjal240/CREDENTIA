'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Auth Callback Page (CLIENT COMPONENT)
 *
 * WHY CLIENT-SIDE instead of a server Route Handler?
 * ─────────────────────────────────────────────────
 * The PKCE flow stores a `code_verifier` in the BROWSER's cookies when
 * signInWithOAuth() is called. A server Route Handler uses request.cookies
 * which should have the same cookies, but in practice, Vercel Edge/Node
 * environments sometimes fail to forward them correctly, causing:
 *    "PKCE code verifier not found in storage"
 *
 * By using a client component, the SAME browser client that stored the
 * code_verifier also reads it — eliminating the cross-boundary issue entirely.
 */

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Completing sign in…')

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const portal = searchParams.get('portal') || 'student'

      // Validate portal
      const validPortals = ['student', 'university', 'company', 'admin']
      const safePortal = validPortals.includes(portal) ? portal : 'student'

      if (!code) {
        router.replace(`/login/${safePortal}?error=no_code`)
        return
      }

      setStatus('Verifying your identity…')

      // ── Create browser client (same context as signInWithOAuth) ──────────
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // ── Exchange PKCE code for session ──────────────────────────────────
      // This reads the code_verifier from the BROWSER's cookies — guaranteed
      // to find it because the same client stored it.
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('[Auth Callback] Code exchange failed:', exchangeError.message)
        router.replace(`/login/${safePortal}?error=${encodeURIComponent(exchangeError.message)}`)
        return
      }

      setStatus('Setting up your account…')

      // ── Get the authenticated user ──────────────────────────────────────
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('[Auth Callback] getUser failed:', userError?.message)
        router.replace(`/login/${safePortal}?error=auth_failed`)
        return
      }

      // ── Admin gate ──────────────────────────────────────────────────────
      if (safePortal === 'admin') {
        const { data: wl } = await supabase
          .from('admin_whitelist')
          .select('email')
          .eq('email', user.email)
          .maybeSingle()

        if (!wl) {
          setStatus('Not authorized — signing out…')
          await supabase.auth.signOut()
          router.replace('/login/admin?error=not_authorized')
          return
        }
      }

      // ── Check for existing profile ──────────────────────────────────────
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle()

      if (existingProfile) {
        // RETURNING USER → update last login metadata
        await supabase
          .from('profiles')
          .update({
            last_login_at: new Date().toISOString(),
            last_login_portal: safePortal,
          })
          .eq('id', user.id)

        setStatus(`Redirecting to ${existingProfile.role} dashboard…`)
        router.replace(`/dashboard/${existingProfile.role}`)
        return
      }

      // ── NEW USER → create profile with portal role ──────────────────────
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
        avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? '',
        role: safePortal,
        login_portal: safePortal,
        last_login_at: new Date().toISOString(),
        last_login_portal: safePortal,
        is_active: true,
      })

      if (insertError) {
        console.error('[Auth Callback] Profile insert failed:', insertError.message)
        // Don't fail — the trigger might have created it. Try reading again.
        const { data: retryProfile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle()

        if (retryProfile) {
          router.replace(`/dashboard/${retryProfile.role}`)
          return
        }

        // Last resort: redirect to portal dashboard anyway
        router.replace(`/dashboard/${safePortal}`)
        return
      }

      // Create student record if needed
      if (safePortal === 'student') {
        await supabase.from('students').upsert(
          { id: user.id, profile_is_public: false, profile_views: 0 },
          { onConflict: 'id' }
        ).then(() => {/* ignore errors */})
      }

      setStatus(`Welcome! Redirecting to ${safePortal} dashboard…`)
      router.replace(`/dashboard/${safePortal}`)
    }

    handleCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f0c29 0%, #1a1145 50%, #0f0c29 100%)',
      color: '#ffffff',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      {/* Spinner */}
      <div style={{
        width: 48,
        height: 48,
        border: '3px solid rgba(139, 92, 246, 0.3)',
        borderTopColor: '#8b5cf6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: 24,
      }} />
      <p style={{
        fontSize: 18,
        fontWeight: 500,
        opacity: 0.9,
        margin: 0,
      }}>
        {status}
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// Wrap in Suspense because useSearchParams() requires it in Next.js 14+
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1145 50%, #0f0c29 100%)',
        color: '#ffffff',
      }}>
        <p>Loading…</p>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  )
}

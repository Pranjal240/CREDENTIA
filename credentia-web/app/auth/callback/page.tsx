'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/**
 * Auth Callback Page — Implicit Flow
 *
 * With implicit flow, the access_token comes in the URL hash fragment
 * (e.g., #access_token=...&refresh_token=...).
 *
 * The Supabase browser client automatically detects the hash and sets
 * the session. We just need to wait for onAuthStateChange to fire
 * and then handle profile creation + redirect.
 */

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Completing sign in…')

  useEffect(() => {
    // Get portal from the query param (appended by our signInWithOAuth redirectTo)
    const portal = searchParams.get('portal') || 'student'
    const validPortals = ['student', 'university', 'company', 'admin']
    const safePortal = validPortals.includes(portal) ? portal : 'student'

    // Listen for the session to be set from the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = session.user

          try {
            // ── Admin gate ────────────────────────────────────────────
            if (safePortal === 'admin') {
              setStatus('Checking admin access…')
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

            // ── Check for existing profile ────────────────────────────
            setStatus('Setting up your account…')
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

            // ── NEW USER → create profile ─────────────────────────────
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name:
                  user.user_metadata?.full_name ??
                  user.user_metadata?.name ??
                  '',
                avatar_url:
                  user.user_metadata?.avatar_url ??
                  user.user_metadata?.picture ??
                  '',
                role: safePortal,
                login_portal: safePortal,
                last_login_at: new Date().toISOString(),
                last_login_portal: safePortal,
                is_active: true,
              })

            if (insertError) {
              console.error(
                '[Auth Callback] Profile insert failed:',
                insertError.message
              )
              // Race condition: trigger might have created it
              const { data: retryProfile } = await supabase
                .from('profiles')
                .select('id, role')
                .eq('id', user.id)
                .maybeSingle()

              if (retryProfile) {
                router.replace(`/dashboard/${retryProfile.role}`)
                return
              }
            }

            // Create student record if needed
            if (safePortal === 'student') {
              await supabase
                .from('students')
                .upsert(
                  {
                    id: user.id,
                    profile_is_public: false,
                    profile_views: 0,
                  },
                  { onConflict: 'id' }
                )
                .then(() => {
                  /* ignore errors */
                })
            }

            setStatus(`Welcome! Redirecting…`)
            router.replace(`/dashboard/${safePortal}`)
          } catch (err) {
            console.error('[Auth Callback] Unexpected error:', err)
            router.replace(`/login/${safePortal}?error=unexpected_error`)
          }
        }
      }
    )

    // Also handle the case where the session was already set (e.g., page was
    // refreshed or event already fired before the listener was registered)
    const checkExistingSession = async () => {
      // Small delay to let onAuthStateChange fire first from hash
      await new Promise(r => setTimeout(r, 1000))

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Session exists — check if we already have a profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          router.replace(`/dashboard/${profile.role}`)
        } else {
          // New user without profile — the onAuthStateChange handler
          // should have handled this, but just in case
          router.replace(`/dashboard/${safePortal}`)
        }
      } else {
        // No session at all — something went wrong
        // Wait a bit more for the hash to be processed
        await new Promise(r => setTimeout(r, 2000))
        const { data: { user: retryUser } } = await supabase.auth.getUser()
        if (!retryUser) {
          router.replace(`/login/${safePortal}?error=no_session`)
        }
      }
    }

    checkExistingSession()

    return () => {
      subscription.unsubscribe()
    }
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
        background:
          'linear-gradient(135deg, #0f0c29 0%, #1a1145 50%, #0f0c29 100%)',
        color: '#ffffff',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Spinner */}
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
      <p
        style={{
          fontSize: 18,
          fontWeight: 500,
          opacity: 0.9,
          margin: 0,
        }}
      >
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
            background:
              'linear-gradient(135deg, #0f0c29 0%, #1a1145 50%, #0f0c29 100%)',
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

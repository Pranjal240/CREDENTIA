'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { PORTAL_META, isValidPortal } from '@/lib/auth/portalMeta'

export default function PortalLoginPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const portal = params.portal as string
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string|null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Sign out any existing session silently
    // so old sessions don't interfere
    supabase.auth.signOut()

    // Handle error params from callback
    const err = searchParams.get('error')
    const correct = searchParams.get('correct')
    if (err === 'wrong_portal' && correct) {
      setErrorMsg(
        `This account is registered as "${correct}".`
        + ` Please use the ${correct} portal.`
      )
    } else if (err === 'not_authorized') {
      setErrorMsg(
        'This account is not authorized for admin access.'
      )
    } else if (err === 'exchange_failed') {
      setErrorMsg('Login failed. Please try again.')
    } else if (err === 'account_banned') {
      setErrorMsg('Your account has been deactivated.')
    }
  }, [])

  const handleLogin = async () => {
    setLoading(true)
    setErrorMsg(null)

    // CRITICAL: hardcode www domain
    // CRITICAL: include ?portal= in redirectTo
    const isProd = process.env.NODE_ENV === 'production'
    const redirectTo = isProd
      ? `https://www.credentiaonline.in/auth/callback?portal=${portal}`
      : `http://localhost:3000/auth/callback?portal=${portal}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        // DO NOT add queryParams — never override state
      }
    })

    if (error) {
      setLoading(false)
      setErrorMsg('Login failed. Please try again.')
    }
    // On success browser redirects to Google
    // loading stays true intentionally
  }

  if (!isValidPortal(portal)) {
    return <div>Invalid portal</div>
  }

  const meta = PORTAL_META[portal]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080a19',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#141827',
        border: `1px solid ${meta.border}`,
        borderRadius: '20px',
        padding: '40px 32px',
        animation: 'cardIn 0.3s ease-out'
      }}>
        {/* Back link */}
        {portal !== 'admin' && (
          <a href="/login" style={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '13px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '24px'
          }}>← Back</a>
        )}

        {/* Heading */}
        <h1 style={{
          fontSize: '22px',
          fontWeight: 500,
          color: '#F1F5F9',
          margin: '0 0 8px'
        }}>{meta.label}</h1>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.4)',
          margin: '0 0 28px'
        }}>{meta.description}</p>

        {/* Admin warning */}
        {portal === 'admin' && (
          <div style={{
            padding: '10px 14px',
            marginBottom: '20px',
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: '8px',
            color: '#FCA5A5',
            fontSize: '12px'
          }}>
            Restricted access. Admins only.
            Unauthorized attempts are logged.
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '20px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '10px',
            color: '#FCA5A5',
            fontSize: '13px',
            lineHeight: 1.5
          }}>{errorMsg}</div>
        )}

        {/* Google Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: loading
              ? `rgba(${meta.accentRgb}, 0.4)`
              : `rgba(${meta.accentRgb}, 0.9)`,
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '18px', height: '18px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite'
              }}/>
              Connecting...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" opacity="0.9"/>
                <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity="0.7"/>
                <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity="0.5"/>
                <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity="0.8"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity:0; transform:scale(0.96) translateY(8px) }
          to   { opacity:1; transform:scale(1) translateY(0) }
        }
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  )
}

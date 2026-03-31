'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Loader2, ArrowLeft, ShieldAlert, GraduationCap, Building2, Briefcase, AlertTriangle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PORTAL_META, isValidPortal } from '@/lib/auth/portalMeta'
import type { Portal } from '@/lib/auth/portalMeta'

// ── Portal icon map ───────────────────────────────────────────────────────────
const PortalIcon: Record<string, React.FC<{ size: number; color: string }>> = {
  graduation: ({ size, color }) => <GraduationCap size={size} color={color} />,
  building:   ({ size, color }) => <Building2    size={size} color={color} />,
  briefcase:  ({ size, color }) => <Briefcase    size={size} color={color} />,
  shield:     ({ size, color }) => <ShieldAlert  size={size} color={color} />,
}

// ── Google logo SVG ───────────────────────────────────────────────────────────
function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

// ── Error message map ─────────────────────────────────────────────────────────
function getErrorContent(error: string | null, correct: string | null) {
  if (error === 'wrong_portal' && correct) {
    const correctMeta = isValidPortal(correct) ? PORTAL_META[correct] : null
    return {
      icon: <AlertTriangle size={16} className="flex-shrink-0" />,
      message: `This Google account is registered as a ${correctMeta?.label ?? correct} on Credentia.`,
      action: correctMeta ? { label: `Go to ${correctMeta.label} →`, href: `/login/${correct}` } : null,
    }
  }
  if (error === 'not_authorized') {
    return {
      icon: <XCircle size={16} className="flex-shrink-0" />,
      message: 'This account is not authorized for admin access. Contact the platform owner to request access.',
      action: null,
    }
  }
  if (error === 'account_banned') {
    return {
      icon: <XCircle size={16} className="flex-shrink-0" />,
      message: 'Your account has been deactivated. Contact support@credentiaonline.in for assistance.',
      action: null,
    }
  }
  if (error === 'oauth_cancelled') {
    return {
      icon: <AlertTriangle size={16} className="flex-shrink-0" />,
      message: 'Login was cancelled. Please try again.',
      action: null,
    }
  }
  if (error === 'auth_failed' || error === 'no_portal_context') {
    return {
      icon: <XCircle size={16} className="flex-shrink-0" />,
      message: "We're having trouble connecting. Please try again.",
      action: null,
    }
  }
  if (error) {
    return {
      icon: <AlertTriangle size={16} className="flex-shrink-0" />,
      message: decodeURIComponent(error),
      action: null,
    }
  }
  return null
}

// ── Inner content (needs useSearchParams, so must be wrapped in Suspense) ─────
function PortalLoginContent({ portal }: { portal: Portal }) {
  const meta         = PORTAL_META[portal]
  const searchParams = useSearchParams()
  const errorParam   = searchParams.get('error')
  const correctParam = searchParams.get('correct')
  const [loading, setLoading] = useState(false)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)

  const errorContent = getErrorContent(errorParam, correctParam) ??
                       (runtimeError ? { icon: <XCircle size={16} />, message: runtimeError, action: null } : null)

  const IconComponent = PortalIcon[meta.icon]

  const handleGoogleLogin = async () => {
    setLoading(true)
    setRuntimeError(null)

    // IMPORTANT: Supabase reserves the OAuth `state` parameter internally for
    // PKCE/CSRF protection — it cannot be used for custom data.
    // The correct approach is to embed the portal type in the redirectTo URL
    // as a query param. The callback reads it from there.
    const callbackUrl = `${window.location.origin}/auth/callback?portal=${portal}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'offline',
          prompt:      'consent',
        },
      },
    })

    if (error) {
      setRuntimeError(error.message)
      setLoading(false)
    }
    // If no error: browser redirects to Google — loading spinner stays on
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#080a19' }}
    >
      {/* Ambient glow blob */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none"
        style={{
          background: `rgba(${meta.accentRgb}, 0.08)`,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div
            className="relative w-9 h-9 rounded-full overflow-hidden"
            style={{ boxShadow: `0 0 0 2px rgba(${meta.accentRgb}, 0.4)` }}
          >
            <Image src="/logo.png" alt="CREDENTIA" fill className="object-contain p-0.5" />
          </div>
          <span className="font-heading text-lg font-bold text-white tracking-wide">CREDENTIA</span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 backdrop-blur-xl"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${meta.border}`,
            boxShadow: `0 0 60px rgba(${meta.accentRgb}, 0.06)`,
          }}
        >
          {/* Portal icon + heading */}
          <div className="mb-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: `rgba(${meta.accentRgb}, 0.12)`, border: `1px solid rgba(${meta.accentRgb}, 0.2)` }}
            >
              <IconComponent size={26} color={meta.accent} />
            </div>

            {/* Admin warning banner */}
            {portal === 'admin' && (
              <div
                className="flex items-start gap-2.5 rounded-xl p-3 mb-5 text-xs"
                style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#fca5a5' }}
              >
                <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  Restricted access. Admins only. Unauthorized access attempts are logged.
                </span>
              </div>
            )}

            <h1 className="font-heading text-2xl font-bold text-white mb-2">{meta.label}</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{meta.description}</p>
          </div>

          {/* Error state */}
          {errorContent && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-4 mb-6 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}
            >
              <div className="flex items-start gap-2.5 mb-2">
                {errorContent.icon}
                <span>{errorContent.message}</span>
              </div>
              {errorContent.action && (
                <Link
                  href={errorContent.action.href}
                  className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  {errorContent.action.label}
                </Link>
              )}
            </motion.div>
          )}

          {/* Google login button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-13 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-60 hover:translate-y-[-1px] active:scale-[0.98]"
            style={{
              height: '52px',
              background: loading
                ? `rgba(${meta.accentRgb}, 0.2)`
                : `rgba(${meta.accentRgb}, 0.15)`,
              border: `1px solid rgba(${meta.accentRgb}, 0.35)`,
              color: '#fff',
              boxShadow: loading ? 'none' : `0 4px 24px rgba(${meta.accentRgb}, 0.15)`,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Connecting to Google…</span>
              </>
            ) : (
              <>
                <GoogleLogo />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Or divider + use different account hint if wrong portal */}
          {errorParam === 'wrong_portal' && (
            <p className="text-center text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              or{' '}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="underline"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                continue with a different account
              </button>
            </p>
          )}
        </div>

        {/* Back link (not shown on admin) */}
        {portal !== 'admin' && (
          <Link
            href="/"
            className="flex items-center gap-2 mt-6 text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            <ArrowLeft size={14} />
            Back to portal selection
          </Link>
        )}

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.18)' }}>
          By continuing, you agree to Credentia's{' '}
          <a href="/terms" className="underline" style={{ color: 'rgba(255,255,255,0.35)' }}>Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="underline" style={{ color: 'rgba(255,255,255,0.35)' }}>Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  )
}

// ── Page component — dynamic route receives params.portal ─────────────────────
export default function PortalLoginPage({
  params,
}: {
  params: { portal: string }
}) {
  // Validate the portal slug. If invalid, show student portal as fallback.
  const portal: Portal = isValidPortal(params.portal) ? params.portal : 'student'

  return (
    // useSearchParams requires Suspense boundary in Next.js App Router
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080a19] flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-white/20" />
        </div>
      }
    >
      <PortalLoginContent portal={portal} />
    </Suspense>
  )
}

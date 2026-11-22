'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, Building2, GraduationCap, LoaderCircle, Lock, Mail, ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PORTAL_META, isValidPortal, type Portal } from '@/lib/auth/portalMeta'
import { CONTACT_EMAIL } from '@/lib/site-config'
import { AuthField, AuthNotice, AuthShell, GoogleLogo, OrDivider } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'

const PORTAL_ICON = {
  graduation: GraduationCap,
  building: Building2,
  briefcase: Briefcase,
  shield: ShieldAlert,
} as const

/** Turns the error code in the address into something a person can act on. */
function errorContent(error: string | null, correct: string | null): { message: string; action?: { label: string; href: string } } | null {
  if (error === 'wrong_portal' && correct) {
    const meta = isValidPortal(correct) ? PORTAL_META[correct] : null
    return {
      message: `This account is registered as a ${meta?.label ?? correct} on Credentia.`,
      action: meta ? { label: `Go to ${meta.label}`, href: `/login/${correct}` } : undefined,
    }
  }
  if (error === 'not_authorized') return { message: 'This account is not authorized for admin access. Contact the platform owner to request access.' }
  if (error === 'account_banned') return { message: `Your account has been deactivated. Contact ${CONTACT_EMAIL} for help.` }
  if (error === 'oauth_cancelled') return { message: 'Sign in was cancelled. Please try again.' }
  if (error === 'auth_failed' || error === 'no_portal_context') return { message: 'We are having trouble connecting. Please try again.' }
  if (error === 'session_expired') return { message: 'Your session ended. Please sign in again.' }
  if (error) return { message: decodeURIComponent(error) }
  return null
}

// useSearchParams needs a Suspense boundary, so the form lives in its own component.
function PortalLogin({ portal }: { portal: Portal }) {
  const meta = PORTAL_META[portal]
  const Icon = PORTAL_ICON[meta.icon]
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const correctParam = searchParams.get('correct')

  const [googleLoading, setGoogleLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // A signed in user goes straight to their dashboard. Never sign out here: the
  // auth callback has just set the session cookies and signing out would loop.
  useEffect(() => {
    let cancelled = false

    const check = async () => {
      // The server rejected the session, so clear it and show the form.
      if (errorParam === 'session_expired') {
        await supabase.auth.signOut()
        return
      }
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (cancelled || !session?.user) return
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
        if (!cancelled && profile?.role) router.replace(`/dashboard/${profile.role}`)
      } catch {
        // Show the form.
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [portal, router, errorParam])

  const banner = errorContent(errorParam, correctParam) ?? (runtimeError ? { message: runtimeError } : null)

  // skipBrowserRedirect avoids a race: the browser must not leave for Google before
  // the PKCE code_verifier cookie is written. We redirect by hand after a short wait.
  const handleGoogle = async () => {
    setGoogleLoading(true)
    setRuntimeError(null)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo:
          process.env.NODE_ENV === 'development'
            ? `http://localhost:3000/auth/callback?portal=${portal}`
            : `https://www.credentiaonline.in/auth/callback?portal=${portal}`,
        skipBrowserRedirect: true,
      },
    })

    if (error) {
      setRuntimeError(error.message)
      setGoogleLoading(false)
      return
    }
    if (data?.url) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      window.location.href = data.url
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setRuntimeError('Please fill in both fields.')
      return
    }

    // The administrative portal is limited to the platform owner.
    if (portal === 'admin' && email.toLowerCase() !== 'pranjalmishra2409@gmail.com') {
      setRuntimeError('Unauthorized. The administrative portal is restricted to the primary owner.')
      return
    }

    setEmailLoading(true)
    setRuntimeError(null)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setRuntimeError(error.message)
      setEmailLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('role, is_active').eq('id', data.user.id).maybeSingle()

      if (profile?.is_active === false) {
        await supabase.auth.signOut()
        setRuntimeError(`Your account has been deactivated. Contact ${CONTACT_EMAIL}.`)
        setEmailLoading(false)
        return
      }
      if (profile?.role && profile.role !== portal) {
        await supabase.auth.signOut()
        router.push(`/login/${portal}?error=wrong_portal&correct=${profile.role}`)
        return
      }
      router.replace(`/dashboard/${profile?.role ?? portal}`)
    }
    setEmailLoading(false)
  }

  const busy = googleLoading || emailLoading

  return (
    <AuthShell back={{ href: '/login', label: 'Back to portal selection' }}>
      <div className="mb-6">
        <div className="mb-5 grid size-14 place-items-center rounded-2xl border border-brand/30 bg-brand/10 text-brand-ink">
          <Icon className="size-6" aria-hidden="true" />
        </div>
        {portal === 'admin' ? (
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs">
            <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-danger" aria-hidden="true" />
            Restricted access. Admins only. Unauthorized access attempts are logged.
          </p>
        ) : null}
        <h1 className="text-2xl font-extrabold tracking-tight">{meta.label}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
      </div>

      {banner ? (
        <AuthNotice
          action={
            'action' in banner && banner.action ? (
              <Link href={banner.action.href} className="inline-flex rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold hover:bg-white/10">
                {banner.action.label}
              </Link>
            ) : undefined
          }
        >
          {banner.message}
        </AuthNotice>
      ) : null}

      <Button variant="default" className="w-full" disabled={busy} onClick={handleGoogle}>
        {googleLoading ? <LoaderCircle className="size-4 animate-spin" /> : <GoogleLogo />}
        {googleLoading ? 'Connecting to Google' : 'Continue with Google'}
      </Button>

      <OrDivider>or continue with email</OrDivider>

      <form onSubmit={handleEmail} className="space-y-4" noValidate>
        <AuthField label="Email address" type="email" icon={<Mail />} value={email} onChange={setEmail} disabled={busy} autoComplete="email" placeholder="you@example.com" />
        <AuthField label="Password" type="password" icon={<Lock />} value={password} onChange={setPassword} disabled={busy} autoComplete="current-password" placeholder="Your password" />
        <Button type="submit" variant="primary" className="w-full" disabled={busy}>
          {emailLoading ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {emailLoading ? 'Signing in' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-5 flex items-center justify-between gap-3 text-xs">
        <Link href={`/register?portal=${portal}`} className="font-semibold text-brand-ink hover:underline">
          No account yet? Sign up
        </Link>
        <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground hover:underline">
          Forgot password?
        </Link>
      </div>

      {errorParam === 'wrong_portal' ? (
        <p className="mt-5 text-center text-xs text-muted-foreground">
          or{' '}
          <button type="button" onClick={handleGoogle} disabled={busy} className="underline underline-offset-4 hover:text-foreground">
            continue with a different account
          </button>
        </p>
      ) : null}
    </AuthShell>
  )
}

export default function PortalLoginPage({ params }: { params: { portal: string } }) {
  const portal: Portal = isValidPortal(params.portal) ? params.portal : 'student'
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center">
          <LoaderCircle className="size-8 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
      }
    >
      <PortalLogin portal={portal} />
    </Suspense>
  )
}

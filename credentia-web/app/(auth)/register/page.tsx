'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Briefcase, Building2, CircleCheck, GraduationCap, LoaderCircle, Lock, Mail, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AuthField, AuthNotice, AuthShell, GoogleLogo, OrDivider } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'

const ROLES = [
  { id: 'student', Icon: GraduationCap, label: 'Student', desc: 'Verify your credentials and share one link' },
  { id: 'company', Icon: Briefcase, label: 'Company', desc: 'Find and review verified talent' },
  { id: 'university', Icon: Building2, label: 'University', desc: 'Manage your students and records' },
] as const

type RoleId = (typeof ROLES)[number]['id']
const isRole = (value: string | null): value is RoleId => ROLES.some((r) => r.id === value)

function Register() {
  const preset = useSearchParams().get('portal')
  const [step, setStep] = useState<'role' | 'form' | 'success'>(isRole(preset) ? 'form' : 'role')
  const [role, setRole] = useState<RoleId>(isRole(preset) ? preset : 'student')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback?portal=${role}` },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError('Passwords do not match.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setLoading(true)
    setError('')
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback?portal=${role}`,
        },
      })
      if (signUpError) {
        setError(signUpError.message)
      } else {
        setStep('success')
      }
    } catch (err) {
      setError((err as Error).message || 'Registration failed.')
    }
    setLoading(false)
  }

  const busy = loading || googleLoading

  if (step === 'success') {
    return (
      <AuthShell>
        <div className="py-4 text-center">
          <CircleCheck className="mx-auto mb-4 size-12 text-success" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold tracking-tight">Check your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Open it to activate your account.
          </p>
          <div className="mt-7 flex justify-center">
            <Button href={`/login/${role}`} variant="primary">
              Go to sign in
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </AuthShell>
    )
  }

  if (step === 'role') {
    return (
      <AuthShell width="max-w-[520px]" back={{ href: '/', label: 'Back to home' }}>
        <h1 className="text-2xl font-extrabold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">Which best describes you?</p>
        <ul className="mt-6 space-y-3">
          {ROLES.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  setRole(r.id)
                  setStep('form')
                  setError('')
                }}
                className="group flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left state-transition hover:border-brand/50 hover:bg-white/[0.07]"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-ink">
                  <r.Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold">{r.label}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{r.desc}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-ink" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-ink hover:underline">
            Sign in
          </Link>
        </p>
      </AuthShell>
    )
  }

  const current = ROLES.find((r) => r.id === role)

  return (
    <AuthShell back={{ href: '/login', label: 'Back to sign in' }}>
      <button type="button" onClick={() => setStep('role')} className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Change role
      </button>
      <h1 className="text-2xl font-extrabold tracking-tight">Create your {current?.label.toLowerCase()} account</h1>
      <p className="mt-2 text-sm text-muted-foreground">{current?.desc}.</p>

      <div className="mt-6">
        {error ? <AuthNotice>{error}</AuthNotice> : null}

        <Button variant="default" className="w-full" disabled={busy} onClick={handleGoogle}>
          {googleLoading ? <LoaderCircle className="size-4 animate-spin" /> : <GoogleLogo />}
          {googleLoading ? 'Connecting to Google' : 'Continue with Google'}
        </Button>

        <OrDivider>or sign up with email</OrDivider>

        <form onSubmit={handleRegister} className="space-y-4">
          <AuthField label="Full name" icon={<User />} value={fullName} onChange={setFullName} disabled={busy} autoComplete="name" required />
          <AuthField label="Email address" type="email" icon={<Mail />} value={email} onChange={setEmail} disabled={busy} autoComplete="email" required />
          <AuthField label="Password" type="password" icon={<Lock />} value={password} onChange={setPassword} disabled={busy} autoComplete="new-password" required />
          <AuthField label="Confirm password" type="password" icon={<Lock />} value={confirm} onChange={setConfirm} disabled={busy} autoComplete="new-password" required />
          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {loading ? 'Creating account' : 'Create account'}
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link href={`/login/${role}`} className="font-semibold text-brand-ink hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center">
          <LoaderCircle className="size-8 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
      }
    >
      <Register />
    </Suspense>
  )
}

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CircleCheck, LoaderCircle, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AuthField, AuthNotice, AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'

type Phase = 'checking' | 'ready' | 'invalid' | 'done'

/**
 * Landing page of the reset link. The link carries a one time code that is
 * exchanged for a short session, and only then does the form appear.
 */
function ResetPassword() {
  const router = useRouter()
  const code = useSearchParams().get('code')
  const [phase, setPhase] = useState<Phase>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    const prepare = async () => {
      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
        }
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (alive) setPhase(session ? 'ready' : 'invalid')
      } catch {
        if (alive) setPhase('invalid')
      }
    }
    prepare()
    return () => {
      alive = false
    }
  }, [code])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    setPhase('done')
    setLoading(false)
    window.setTimeout(() => router.replace('/dashboard'), 1500)
  }

  return (
    <AuthShell back={{ href: '/login', label: 'Back to sign in' }}>
      {phase === 'checking' ? (
        <div className="grid place-items-center py-10" role="status">
          <LoaderCircle className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Checking your reset link</span>
        </div>
      ) : null}

      {phase === 'invalid' ? (
        <div className="py-2 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">This link has expired</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Reset links work once and only for a short time. Ask for a new one and use it right away.</p>
          <div className="mt-6 flex justify-center">
            <Button href="/forgot-password" variant="primary">
              Send a new link
            </Button>
          </div>
        </div>
      ) : null}

      {phase === 'ready' ? (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight">Choose a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use at least 6 characters.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {error ? <AuthNotice>{error}</AuthNotice> : null}
            <AuthField label="New password" type="password" icon={<Lock />} value={password} onChange={setPassword} disabled={loading} autoComplete="new-password" required />
            <AuthField label="Confirm new password" type="password" icon={<Lock />} value={confirm} onChange={setConfirm} disabled={loading} autoComplete="new-password" required />
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {loading ? 'Saving' : 'Save password'}
            </Button>
          </form>
        </>
      ) : null}

      {phase === 'done' ? (
        <div className="py-2 text-center" role="status">
          <CircleCheck className="mx-auto mb-4 size-12 text-success" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold tracking-tight">Password updated</h1>
          <p className="mt-3 text-sm text-muted-foreground">Taking you to your dashboard. If nothing happens, <Link href="/dashboard" className="font-semibold text-brand-ink hover:underline">continue here</Link>.</p>
        </div>
      ) : null}
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center">
          <LoaderCircle className="size-8 animate-spin text-muted-foreground" aria-label="Loading" />
        </div>
      }
    >
      <ResetPassword />
    </Suspense>
  )
}

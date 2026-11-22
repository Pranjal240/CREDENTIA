'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LoaderCircle, Mail, MailCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AuthField, AuthNotice, AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'

/**
 * Asks Supabase to email a password reset link. The page always answers the same
 * way, whether or not the address has an account, so it cannot be used to find out
 * who is registered.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return setError('Enter the email address you signed up with.')
    setLoading(true)
    setError('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    // A rate limit is worth telling the person about. Anything else looks like success.
    if (resetError && /rate|too many|seconds/i.test(resetError.message)) {
      setError('Too many requests. Please wait a minute and try again.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <AuthShell back={{ href: '/login', label: 'Back to sign in' }}>
      {sent ? (
        <div className="py-2 text-center">
          <MailCheck className="mx-auto mb-4 size-12 text-success" aria-hidden="true" />
          <h1 className="text-2xl font-extrabold tracking-tight">Check your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            If an account exists for <strong className="text-foreground">{email}</strong>, a link to reset your password is on its way. It can take a minute to arrive.
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold tracking-tight">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your email and we will send you a link to choose a new password.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {error ? <AuthNotice>{error}</AuthNotice> : null}
            <AuthField label="Email address" type="email" icon={<Mail />} value={email} onChange={setEmail} disabled={loading} autoComplete="email" placeholder="you@example.com" />
            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {loading ? 'Sending' : 'Send reset link'}
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Remembered it?{' '}
            <Link href="/login" className="font-semibold text-brand-ink hover:underline">
              Sign in
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  )
}

'use client'

import * as React from 'react'
import Link from 'next/link'
import { CredentiaMark } from '@/components/brand/icons'
import { ArrowLeft, CircleAlert, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Centered glass card on the app background, shared by every sign in and sign up screen. */
export function AuthShell({
  children,
  back,
  width = 'max-w-[460px]',
}: {
  children: React.ReactNode
  back?: { href: string; label: string }
  width?: string
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className={cn('w-full', width)}>
        <Link href="/" className="mb-8 inline-flex items-center gap-2.5 rounded-lg text-lg font-extrabold tracking-tight">
          <CredentiaMark className="size-10 text-foreground" />
          Credentia
        </Link>
        <div className="glass-strong rounded-3xl p-6 sm:p-8">{children}</div>
        {back ? (
          <Link href={back.href} className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            {back.label}
          </Link>
        ) : null}
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          By continuing, you agree to Credentia&apos;s{' '}
          <Link href="/terms" className="font-semibold text-foreground/70 underline underline-offset-4 hover:text-foreground">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="font-semibold text-foreground/70 underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  )
}

/** A labelled input. The label is always visible, never only a placeholder. */
export function AuthField({
  label,
  icon,
  type = 'text',
  value,
  onChange,
  disabled,
  autoComplete,
  placeholder,
  required,
}: {
  label: string
  icon?: React.ReactNode
  type?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoComplete?: string
  placeholder?: string
  required?: boolean
}) {
  const [show, setShow] = React.useState(false)
  const isPassword = type === 'password'
  const id = React.useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-foreground/80">
        {label}
      </label>
      <div className="relative">
        {icon ? <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">{icon}</span> : null}
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          className={cn(
            'h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand/70 focus:bg-white/[0.06] disabled:opacity-50',
            icon ? 'pl-10' : 'pl-4',
            isPassword && 'pr-12',
          )}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
    </div>
  )
}

/** Error or notice banner. The icon and the words carry the meaning, not only the colour. */
export function AuthNotice({ tone = 'danger', children, action }: { tone?: 'danger' | 'info'; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('mb-5 rounded-xl border p-4 text-sm', tone === 'danger' ? 'border-danger/30 bg-danger/10 text-foreground' : 'border-white/15 bg-white/[0.05] text-foreground')}
    >
      <div className="flex items-start gap-2.5">
        <CircleAlert className={cn('mt-0.5 size-4 shrink-0', tone === 'danger' ? 'text-danger' : 'text-brand-ink')} aria-hidden="true" />
        <span>{children}</span>
      </div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}

export function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function OrDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground" role="separator">
      <span className="h-px flex-1 bg-white/10" />
      {children}
      <span className="h-px flex-1 bg-white/10" />
    </div>
  )
}

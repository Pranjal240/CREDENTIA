import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Briefcase, Building2, GraduationCap, ShieldAlert } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { PORTAL_META, type Portal } from '@/lib/auth/portalMeta'

export const metadata: Metadata = { title: 'Sign in', description: 'Choose your Credentia portal.' }

const PUBLIC_PORTALS: Portal[] = ['student', 'university', 'company']
const ICONS = { student: GraduationCap, university: Building2, company: Briefcase, admin: ShieldAlert } as const

export default function LoginChooser() {
  return (
    <AuthShell width="max-w-[520px]" back={{ href: '/', label: 'Back to home' }}>
      <h1 className="text-2xl font-extrabold tracking-tight">Sign in to Credentia</h1>
      <p className="mt-2 text-sm text-muted-foreground">Choose the portal that matches your account.</p>

      <ul className="mt-6 space-y-3">
        {PUBLIC_PORTALS.map((portal) => {
          const meta = PORTAL_META[portal]
          const Icon = ICONS[portal]
          return (
            <li key={portal}>
              <Link
                href={`/login/${portal}`}
                className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 state-transition hover:border-brand/50 hover:bg-white/[0.07]"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-ink">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-bold">{meta.label}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{meta.subtext}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand-ink" aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs">
        <span className="text-muted-foreground">New to Credentia?</span>
        <Link href="/register" className="font-semibold text-brand-ink hover:underline">
          Create an account
        </Link>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Platform staff:{' '}
        <Link href="/login/admin" className="font-semibold text-foreground/70 underline underline-offset-4 hover:text-foreground">
          admin access
        </Link>
      </p>
    </AuthShell>
  )
}

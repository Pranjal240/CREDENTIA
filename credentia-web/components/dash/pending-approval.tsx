'use client'

import { CircleCheck, Clock3, Hourglass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/dash/kit'

/**
 * Shown to a university, or any account that needs a decision, until an admin
 * approves it. The page refreshes by itself when the approval arrives.
 */
export function PendingApproval({ name, kind = 'institution' }: { name?: string | null; kind?: 'institution' | 'company' }) {
  const steps = [
    { label: 'Account created', done: true },
    { label: `An admin reviews your ${kind}`, active: true },
    { label: kind === 'institution' ? 'Your registry opens' : 'Your account is approved' },
  ]
  return (
    <div className="mx-auto grid min-h-[60dvh] max-w-xl place-items-center">
      <Panel className="w-full">
        <div className="px-2 py-6 text-center sm:px-6">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-warning/40 bg-warning/10 text-warning">
            <Hourglass className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Waiting for approval</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {name ? <strong className="font-bold text-foreground">{name}</strong> : 'Your account'} is with the Credentia admins. This page turns into your {kind === 'institution' ? 'student registry' : 'dashboard'} as soon as they approve it, so you can keep it open.
          </p>
          <ol className="mx-auto mt-6 max-w-sm space-y-2 text-left" aria-label="Approval progress">
            {steps.map((step) => (
              <li key={step.label} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold ${step.done ? 'border-success/40 bg-success/10 text-success' : step.active ? 'border-warning/40 bg-warning/10 text-warning' : 'border-white/10 bg-white/[0.03] text-muted-foreground'}`}>
                {step.done ? <CircleCheck className="size-[18px]" aria-hidden="true" /> : step.active ? <Clock3 className="size-[18px]" aria-hidden="true" /> : <span aria-hidden="true" className="ml-0.5 size-4 rounded-full border-2 border-current" />}
                {step.label}
              </li>
            ))}
          </ol>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            <Button href="/dashboard/university/settings" variant="default" size="sm">
              Check your details
            </Button>
            <Button href="/contact" variant="default" size="sm">
              Contact us
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  )
}

export default PendingApproval

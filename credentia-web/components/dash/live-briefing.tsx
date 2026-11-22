'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, CircleAlert, CircleCheck, Lightbulb } from 'lucide-react'
import { Panel } from '@/components/dash/kit'
import { cn } from '@/lib/utils'

export interface BriefingItem {
  id: string
  tone: 'alert' | 'good' | 'tip'
  title: string
  detail: string
  href?: string
}

const ICON = { alert: CircleAlert, good: CircleCheck, tip: Lightbulb } as const
const TONE = {
  alert: 'border-warning/35 bg-warning/[0.07] text-warning',
  good: 'border-success/35 bg-success/[0.07] text-success',
  tip: 'border-brand/35 bg-brand/[0.07] text-brand-ink',
} as const

/** When the data behind a panel last changed, so the panel can say how fresh it is. */
export function useLastChange(value: unknown): number | null {
  const [at, setAt] = React.useState<number | null>(null)
  React.useEffect(() => {
    if (value !== null && value !== undefined) setAt(Date.now())
  }, [value])
  return at
}

function ago(at: number | null, now: number): string {
  if (!at) return 'Loading'
  const s = Math.max(0, Math.round((now - at) / 1000))
  if (s < 10) return 'Updated just now'
  if (s < 60) return `Updated ${s} seconds ago`
  const m = Math.round(s / 60)
  return `Updated ${m} ${m === 1 ? 'minute' : 'minutes'} ago`
}

/**
 * A short list of what is true right now and what to do about it. The numbers come from data the page already
 * keeps live, so the list changes as things change, and the line under the title says how fresh it is.
 */
export function LiveBriefing({ items, updatedAt, title = 'Live briefing', index = 3, className }: { items: BriefingItem[]; updatedAt: number | null; title?: string; index?: number; className?: string }) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 10_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <Panel index={index} title={title} subtitle={`${ago(updatedAt, now)}. It refreshes by itself when anything changes.`} className={className}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing needs your attention right now.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2.5 md:grid-cols-2" aria-live="polite">
          {items.map((item) => {
            const Icon = ICON[item.tone]
            const body = (
              <>
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg border', TONE[item.tone])} aria-hidden="true">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold leading-snug text-foreground">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.detail}</span>
                </span>
                {item.href ? <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}
              </>
            )
            const cls = 'flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3'
            return (
              <li key={item.id}>
                {item.href ? (
                  <Link href={item.href} className={cn(cls, 'transition-colors hover:border-white/25 hover:bg-white/[0.06]')}>
                    {body}
                  </Link>
                ) : (
                  <div className={cls}>{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

export default LiveBriefing

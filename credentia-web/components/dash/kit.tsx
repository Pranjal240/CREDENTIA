'use client'

import * as React from 'react'
import gsap from 'gsap'
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Circle, Clock3, Minus, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCompact, formatDecimal, formatNumber, formatPercent } from '@/lib/format'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { statusInfo } from '@/lib/status'

/* -------------------------------------------------------------------------- */
/* Counter                                                                    */
/* -------------------------------------------------------------------------- */

export type CounterFormat = 'number' | 'compact' | 'percent' | 'decimal'

const FORMATTERS: Record<CounterFormat, (value: number) => string> = {
  number: formatNumber,
  compact: formatCompact,
  percent: (v) => formatPercent(v, Number.isInteger(v) ? 0 : 1),
  decimal: (v) => formatDecimal(v, 1),
}

/**
 * A number that counts up to its value. Screen readers get the final value at
 * once, and reduced motion skips the count.
 */
export function Counter({ value, format = 'number', duration = 0.9 }: { value: number; format?: CounterFormat; duration?: number }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const reduced = useReducedMotion()
  const text = FORMATTERS[format]

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      el.textContent = text(value)
      return
    }
    const state = { v: Number(el.dataset.from ?? 0) }
    const tween = gsap.to(state, {
      v: value,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = text(state.v)
        el.dataset.from = String(state.v)
      },
    })
    return () => {
      tween.kill()
    }
  }, [value, text, reduced, duration])

  return (
    <>
      <span ref={ref} aria-hidden="true" className="tabular">
        {text(0)}
      </span>
      <span className="sr-only">{text(value)}</span>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Panel and metric                                                           */
/* -------------------------------------------------------------------------- */

type RiseStyle = React.CSSProperties & { '--i'?: number }

export function Panel({
  title,
  subtitle,
  action,
  index = 0,
  className,
  bodyClassName,
  children,
}: {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  /** Position in the entrance sequence, so panels arrive one after another. */
  index?: number
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn('glass-flat rise min-w-0 rounded-[20px] p-4 sm:p-5', className)} style={{ '--i': index } as RiseStyle}>
      {title || action ? (
        <header className="mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-extrabold tracking-tight text-foreground">{title}</h2> : null}
            {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

export interface MetricChange {
  label: string
  direction: 'up' | 'down' | 'flat'
  /** Whether this movement is good news. Colour is paired with the arrow and the text. */
  tone?: 'good' | 'bad' | 'neutral'
}

export function Metric({
  title,
  icon,
  value,
  format,
  suffix,
  change,
  detail,
  emphasis,
  index = 0,
}: {
  title: string
  icon: React.ReactNode
  value: number
  format?: CounterFormat
  suffix?: string
  change?: MetricChange
  detail?: string
  /** The one highlighted metric on a page. */
  emphasis?: boolean
  index?: number
}) {
  const ChangeIcon = change?.direction === 'down' ? ArrowDownRight : change?.direction === 'flat' ? Minus : ArrowUpRight
  const changeTone =
    change?.tone === 'bad' ? 'bg-danger/10 text-danger' : change?.tone === 'neutral' ? 'bg-white/10 text-muted-foreground' : 'bg-success/10 text-success'

  return (
    <article
      className={cn(
        'rise flex min-h-[116px] min-w-0 flex-col justify-between rounded-2xl border p-3.5',
        emphasis ? 'border-brand/50 bg-brand/[0.14]' : 'glass-flat',
      )}
      style={{ '--i': index } as RiseStyle}
    >
      <div className="flex items-start justify-between gap-2 text-[11px] font-bold text-foreground/80">
        <span className="line-clamp-2 min-w-0 pt-1.5 leading-tight">{title}</span>
        <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-[10px] bg-white/[0.08] text-brand-ink [&_svg]:size-3.5">
          {icon}
        </span>
      </div>
      <p className="my-2 text-[clamp(24px,2.4vw,34px)] font-extrabold leading-none tracking-tight text-foreground">
        <Counter value={value} format={format} />
        {suffix ? <span className="ml-1 text-sm font-bold text-muted-foreground">{suffix}</span> : null}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {change ? (
          <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold', changeTone)}>
            <ChangeIcon className="size-3" aria-hidden="true" />
            {change.label}
          </span>
        ) : null}
        {detail ? <span>{detail}</span> : null}
      </div>
    </article>
  )
}

/* -------------------------------------------------------------------------- */
/* Page header and controls                                                   */
/* -------------------------------------------------------------------------- */

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-[clamp(26px,3.2vw,44px)] font-extrabold leading-[1.05] tracking-tight text-foreground">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div> : null}
    </header>
  )
}

/** A segmented control, for example 7 days, 30 days, 90 days. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex items-center rounded-xl border border-white/10 bg-white/[0.05] p-0.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
          className={cn(
            'min-h-9 min-w-14 whitespace-nowrap rounded-lg px-3 text-[11px] font-bold transition-colors pointer-coarse:min-h-11',
            option === value ? 'bg-brand text-on-brand' : 'text-foreground/70 hover:bg-white/10 hover:text-foreground',
          )}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

export type Tone = 'success' | 'warning' | 'danger' | 'neutral'

const TONE_STYLE: Record<Tone, { text: string; bg: string; Icon: React.ComponentType<{ className?: string }> }> = {
  success: { text: 'text-success', bg: 'bg-success/10', Icon: CheckCircle2 },
  warning: { text: 'text-warning', bg: 'bg-warning/10', Icon: Clock3 },
  danger: { text: 'text-danger', bg: 'bg-danger/10', Icon: XCircle },
  neutral: { text: 'text-muted-foreground', bg: 'bg-white/[0.07]', Icon: Circle },
}

/** The words and tone for a status. They come from lib/status, so dashboards, search and Peon always agree. */
export function statusMeta(status?: string | null): { label: string; tone: Tone } {
  return statusInfo(status)
}

/** Status pill. The icon and the words carry the meaning, the colour only reinforces it. */
export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  const style = TONE_STYLE[tone]
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-bold', style.bg, style.text, className)}>
      <style.Icon className="size-3" aria-hidden="true" />
      {children}
    </span>
  )
}

export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  const meta = statusMeta(status)
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  )
}

/* -------------------------------------------------------------------------- */
/* Empty and loading states                                                   */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  hint,
  action,
  className,
}: {
  icon?: React.ReactNode
  title: string
  hint?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid place-items-center px-4 py-10 text-center', className)}>
      <div className="max-w-sm">
        {icon ? <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-muted-foreground [&_svg]:size-5">{icon}</div> : null}
        <p className="text-sm font-bold text-foreground">{title}</p>
        {hint ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
        {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
      </div>
    </div>
  )
}

/** A grid of placeholder panels while a page loads. Heights match the real layout to avoid a jump. */
export function PageSkeleton({ metrics = 4, panels = 2 }: { metrics?: number; panels?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: metrics }).map((_, i) => (
          <div key={i} className="skeleton h-[116px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {Array.from({ length: panels }).map((_, i) => (
          <div key={i} className="skeleton h-64" />
        ))}
      </div>
    </div>
  )
}

/** Inline error with a way to try again. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<XCircle />}
      title="Something went wrong"
      hint={message}
      action={
        onRetry ? (
          <button type="button" onClick={onRetry} className="rounded-lg border border-white/20 px-4 py-2 text-xs font-bold text-foreground transition-colors hover:bg-white/10">
            Try again
          </button>
        ) : undefined
      }
    />
  )
}

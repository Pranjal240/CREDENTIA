'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'

/**
 * Charts for the dashboards. Flat fills only, drawn as SVG and CSS so they cost
 * almost nothing. Every chart has hover and focus readouts, a legend, and a
 * hidden table with the same numbers for screen readers.
 */

/** Series colours on black. Red leads, white and grey support, status colours only where they mean something. */
export const SERIES = {
  red: 'rgb(var(--brand-ink))',
  deep: 'rgb(var(--brand))',
  white: 'rgb(var(--foreground))',
  grey: 'rgb(var(--smooth-700))',
  green: 'rgb(var(--success))',
  amber: 'rgb(var(--warning))',
} as const

export type SeriesColor = (typeof SERIES)[keyof typeof SERIES]

export function Legend({ entries, className }: { entries: { label: string; color: string }[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-muted-foreground', className)}>
      {entries.map((entry) => (
        <li key={entry.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full" style={{ background: entry.color }} />
          {entry.label}
        </li>
      ))}
    </ul>
  )
}

/** Rounds a maximum up to a tidy axis value, for example 87 becomes 100 and 1340 becomes 1500. */
export function niceMax(value: number): number {
  if (value <= 0) return 1
  const exponent = Math.floor(Math.log10(value))
  const base = 10 ** exponent
  const fraction = value / base
  const step = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
  return step * base
}

type RiseVars = React.CSSProperties & { '--i'?: number }

/* -------------------------------------------------------------------------- */
/* Bars                                                                       */
/* -------------------------------------------------------------------------- */

export interface BarItem {
  label: string
  /** One value per series, stacked from the bottom. */
  values: number[]
}

export function BarsChart({
  items,
  series,
  title,
  format = formatNumber,
  height = 188,
}: {
  items: BarItem[]
  series: { label: string; color: string }[]
  title: string
  format?: (value: number) => string
  height?: number
}) {
  const [active, setActive] = React.useState<number | null>(null)
  const totals = items.map((item) => item.values.reduce((a, b) => a + b, 0))
  const max = Math.max(1, ...totals) * 1.1
  const labelEvery = items.length <= 12 ? 1 : Math.ceil(items.length / 8)
  const selected = active === null ? null : items[active]

  return (
    <figure aria-label={title}>
      <div className="flex h-5 items-center justify-between gap-2">
        <Legend entries={series} />
        {selected ? (
          <span className="tabular whitespace-nowrap text-[11px] font-extrabold text-foreground" aria-live="polite">
            {selected.label}: {format(totals[active as number])}
          </span>
        ) : null}
      </div>

      <div
        className="mt-2 grid grid-cols-1 gap-1"
        style={{ height, gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        onMouseLeave={() => setActive(null)}
      >
        {items.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            type="button"
            aria-label={`${item.label}: ${item.values.map((v, i) => `${format(v)} ${series[i]?.label ?? ''}`).join(', ')}`}
            aria-pressed={active === index}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            onMouseEnter={() => setActive(index)}
            onClick={() => setActive(index)}
            className={cn('flex min-w-0 flex-col items-center rounded-lg px-0 pt-1 transition-colors', active === index ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]')}
          >
            <span className="flex w-full flex-1 items-end justify-center border-b border-white/10" aria-hidden="true">
              <span
                className="bar-grow flex w-[min(65%,40px)] min-w-[5px] flex-col-reverse overflow-hidden rounded-t-md"
                style={{ height: `${(totals[index] / max) * 100}%`, '--i': index } as RiseVars}
              >
                {item.values.map((value, i) => (
                  <i key={i} className="block min-h-[2px] not-italic" style={{ flexGrow: value, flexBasis: 0, background: series[i]?.color }} />
                ))}
              </span>
            </span>
            <span className="mt-1.5 h-3 whitespace-nowrap text-[9px] text-muted-foreground" aria-hidden="true">
              {index % labelEvery === 0 ? item.label : ''}
            </span>
          </button>
        ))}
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Period</th>
            {series.map((s) => (
              <th key={s.label}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{item.label}</td>
              {item.values.map((v, j) => (
                <td key={j}>{format(v)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/* Trend line                                                                 */
/* -------------------------------------------------------------------------- */

type Point = [number, number]

function curve(points: Point[]): string {
  return points.reduce((path, [x, y], index) => {
    if (index === 0) return `M ${x} ${y}`
    const [px, py] = points[index - 1]
    const mid = (x + px) / 2
    return `${path} C ${mid} ${py}, ${mid} ${y}, ${x} ${y}`
  }, '')
}

export function TrendChart({
  labels,
  series,
  title,
  format = formatNumber,
  height = 208,
}: {
  labels: string[]
  series: { label: string; color: string; values: number[] }[]
  title: string
  format?: (value: number) => string
  height?: number
}) {
  const [active, setActive] = React.useState<number | null>(null)
  const width = 600
  const count = labels.length
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)) * 1.08)
  const ticks = [max, max * 0.75, max * 0.5, max * 0.25, 0]
  const x = (i: number) => (count <= 1 ? width / 2 : (i * width) / (count - 1))
  const y = (v: number) => height - (v / max) * height
  const points = (values: number[]): Point[] => values.map((v, i) => [x(i), y(v)])
  const labelEvery = count <= 8 ? 1 : Math.ceil(count / 7)

  return (
    <figure aria-label={title}>
      <Legend entries={series.map((s) => ({ label: s.label, color: s.color }))} className="mb-2" />
      <div className="grid grid-cols-[34px_minmax(0,1fr)]">
        <div className="flex flex-col justify-between text-[10px] text-muted-foreground" aria-hidden="true" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="tabular leading-none">
              {t === 0 ? '0' : format(t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0" style={{ height }} onMouseLeave={() => setActive(null)}>
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block size-full overflow-visible" aria-hidden="true">
            {ticks.map((t, i) => (
              <line key={t} x1="0" x2={width} y1={(height * i) / 4} y2={(height * i) / 4} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
            ))}
            <g className="draw-in">
              {series.map((s, si) => {
                const pts = points(s.values)
                const line = curve(pts)
                return (
                  <g key={s.label}>
                    {si === 0 && pts.length > 1 ? <path d={`${line} L ${pts[pts.length - 1][0]} ${height} L ${pts[0][0]} ${height} Z`} fill={s.color} fillOpacity="0.1" /> : null}
                    {pts.length > 1 ? (
                      <path d={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                    ) : null}
                  </g>
                )
              })}
            </g>
            {active !== null ? (
              <g>
                <line x1={x(active)} x2={x(active)} y1="0" y2={height} stroke="rgba(255,255,255,0.35)" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
                {series.map((s) => (
                  <circle key={s.label} cx={x(active)} cy={y(s.values[active] ?? 0)} r="4" fill={s.color} />
                ))}
              </g>
            ) : null}
          </svg>

          <div className="absolute inset-0 flex">
            {labels.map((label, i) => (
              <button
                key={`${label}-${i}`}
                type="button"
                aria-label={`${label}: ${series.map((s) => `${s.label} ${format(s.values[i] ?? 0)}`).join(', ')}`}
                aria-pressed={active === i}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onMouseEnter={() => setActive(i)}
                onClick={() => setActive(i)}
                className="min-w-0 flex-1 rounded-sm"
              />
            ))}
          </div>

          {active !== null ? (
            <div
              className="pointer-events-none absolute top-1.5 z-10 grid min-w-[128px] gap-0.5 rounded-xl border border-white/15 bg-black/85 p-2 text-[11px] shadow-lg"
              style={{ left: `clamp(70px, ${count <= 1 ? 50 : (active / (count - 1)) * 100}%, calc(100% - 70px))`, translate: '-50% 0' }}
            >
              <strong className="text-foreground">{labels[active]}</strong>
              {series.map((s) => (
                <span key={s.label} className="flex justify-between gap-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="size-1.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <b className="tabular text-foreground">{format(s.values[active] ?? 0)}</b>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="ml-[34px] mt-2 flex justify-between text-[9px] text-muted-foreground" aria-hidden="true">
        {labels.map((label, i) => (
          <span key={`${label}-${i}`} className={cn(i % labelEvery !== 0 && 'invisible')}>
            {label}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Period</th>
            {series.map((s) => (
              <th key={s.label}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((label, i) => (
            <tr key={i}>
              <td>{label}</td>
              {series.map((s) => (
                <td key={s.label}>{format(s.values[i] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/* Donut                                                                      */
/* -------------------------------------------------------------------------- */

export interface DonutSegment {
  label: string
  value: number
  color: string
}

export function DonutChart({
  segments,
  title,
  centerLabel,
  format = formatNumber,
}: {
  segments: DonutSegment[]
  title: string
  centerLabel: string
  format?: (value: number) => string
}) {
  const [active, setActive] = React.useState<number | null>(null)
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  const maskId = React.useId().replace(/:/g, '')
  let offset = 0

  return (
    <figure aria-label={title} className="grid justify-items-stretch gap-3">
      <div className="relative mx-auto aspect-square w-[min(100%,150px)]">
        <svg viewBox="0 0 124 124" className="block size-full" aria-hidden="true">
          <defs>
            <mask id={maskId}>
              <circle className="ring-draw" cx="62" cy="62" r="47" fill="none" stroke="white" strokeWidth="15" pathLength="100" transform="rotate(-90 62 62)" />
            </mask>
          </defs>
          <circle cx="62" cy="62" r="47" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
          <g mask={`url(#${maskId})`} transform="rotate(-90 62 62)">
            {total > 0
              ? segments.map((segment, index) => {
                  const share = (segment.value / total) * 100
                  const start = offset
                  offset += share
                  return (
                    <circle
                      key={segment.label}
                      cx="62"
                      cy="62"
                      r="47"
                      pathLength="100"
                      fill="none"
                      strokeWidth="14"
                      stroke={segment.color}
                      strokeDasharray={`${Math.max(0, share - 1.1)} 100`}
                      strokeDashoffset={-start}
                      style={{ opacity: active !== null && active !== index ? 0.3 : 1, transition: 'opacity 200ms ease' }}
                    />
                  )
                })
              : null}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <strong className="tabular text-[22px] font-extrabold leading-none tracking-tight text-foreground">
            {active === null ? format(total) : format(segments[active].value)}
          </strong>
          <span className="mt-1 text-[10px] text-muted-foreground">{active === null ? centerLabel : segments[active].label}</span>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-0.5">
        {segments.map((segment, index) => {
          const share = total > 0 ? Math.round((segment.value / total) * 100) : 0
          return (
            <li key={segment.label}>
              <button
                type="button"
                aria-pressed={active === index}
                aria-label={`${segment.label}: ${format(segment.value)}, ${share} percent`}
                onClick={() => setActive(active === index ? null : index)}
                onMouseEnter={() => setActive(index)}
                onMouseLeave={() => setActive(null)}
                className={cn('grid min-h-8 w-full grid-cols-[minmax(0,1fr)_auto_34px] items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors', active === index ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]')}
              >
                <span className="inline-flex min-w-0 items-center gap-2 text-[11px] font-semibold text-foreground/90">
                  <i className="size-2 shrink-0 rounded-full" style={{ background: segment.color }} />
                  <span className="truncate">{segment.label}</span>
                </span>
                <span className="tabular text-[11px] text-muted-foreground">{format(segment.value)}</span>
                <strong className="tabular text-right text-[11px] font-extrabold">{share}%</strong>
              </button>
            </li>
          )
        })}
      </ul>
    </figure>
  )
}

/* -------------------------------------------------------------------------- */
/* Meter                                                                      */
/* -------------------------------------------------------------------------- */

export function Meter({
  value,
  max = 100,
  label,
  color = SERIES.red,
  className,
}: {
  value: number
  max?: number
  label: string
  color?: string
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, max > 0 ? (value / max) * 100 : 0))
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-2 overflow-hidden rounded-full bg-white/10', className)}
    >
      <span className="meter-grow block h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

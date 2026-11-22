/**
 * Number, date and text formatters shared by every dashboard. Indian grouping
 * (lakhs and crores) for numbers, day month year for dates.
 */

const numberFormat = new Intl.NumberFormat('en-IN')
const compactFormat = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })

export function formatNumber(value: number): string {
  return numberFormat.format(Math.round(value))
}

export function formatCompact(value: number): string {
  return compactFormat.format(value)
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits)
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`
}

export function formatDateShort(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** "5 minutes ago", "3 days ago", falling back to a date after a month. */
export function timeAgo(iso?: string | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  if (days < 31) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDateShort(iso)
}

/** Whole days between two instants. */
export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000)
}

/** Short day label for chart axes, for example "12 Nov". */
export function dayLabel(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function pluralize(count: number, one: string, many = `${one}s`): string {
  return `${formatNumber(count)} ${count === 1 ? one : many}`
}

export function initialsOf(name?: string | null): string {
  if (!name) return 'U'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return (parts[0]?.[0] ?? 'U').concat(parts.length > 1 ? parts[parts.length - 1][0] : '').toUpperCase()
}

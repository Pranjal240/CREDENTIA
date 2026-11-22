import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

/** Score colour on black: success, warning, danger. Always paired with the number, never the only signal. */
export function getScoreColor(score: number) {
  if (score >= 75) return '#3DDC97'
  if (score >= 50) return '#FFB84D'
  return '#FF6B6B'
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

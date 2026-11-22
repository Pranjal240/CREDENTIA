export type Tone = 'success' | 'warning' | 'danger' | 'neutral'

/** A document counts as verified in any of these states. */
export const VERIFIED_STATUSES = ['ai_approved', 'admin_verified', 'verified'] as const
/** Waiting for a result or for an admin. */
export const PENDING_STATUSES = ['pending', 'needs_review'] as const
export const REJECTED_STATUSES = ['rejected', 'ai_rejected', 'invalid', 'failed'] as const

const LABELS: Record<string, string> = {
  ai_approved: 'AI verified',
  admin_verified: 'Admin verified',
  verified: 'Verified',
  not_submitted: 'Not submitted',
  pending: 'Pending',
  needs_review: 'Needs review',
  rejected: 'Rejected',
  ai_rejected: 'Rejected',
  invalid: 'Invalid',
  failed: 'Failed',
  open: 'Open',
  closed: 'Closed',
  resolved: 'Resolved',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  hired: 'Hired',
  reviewing: 'Reviewing',
}

export const isVerifiedStatus = (status?: string | null) => (VERIFIED_STATUSES as readonly string[]).includes(status ?? '')
export const isPendingStatus = (status?: string | null) => (PENDING_STATUSES as readonly string[]).includes(status ?? '')
export const isRejectedStatus = (status?: string | null) => (REJECTED_STATUSES as readonly string[]).includes(status ?? '')

const humanise = (value: string) => value.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

/** Label and colour tone for any status string used across the platform. */
export function statusInfo(status?: string | null): { label: string; tone: Tone } {
  const key = (status ?? '').toLowerCase()
  if (!key) return { label: 'Not started', tone: 'neutral' }
  const label = LABELS[key] ?? humanise(key)
  if (isVerifiedStatus(key) || key === 'accepted' || key === 'hired' || key === 'resolved') return { label, tone: 'success' }
  if (isPendingStatus(key) || key === 'open' || key === 'reviewing' || key === 'shortlisted') return { label, tone: 'warning' }
  if (isRejectedStatus(key)) return { label, tone: 'danger' }
  return { label, tone: 'neutral' }
}

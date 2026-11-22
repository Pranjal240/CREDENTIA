import type { DashRole } from '@/lib/dashboard-nav'

export type SearchType = 'student' | 'company' | 'university' | 'user' | 'verification' | 'document' | 'application' | 'audit' | 'support'

export interface SearchHit {
  id: string
  type: SearchType
  title: string
  subtitle?: string
  badge?: { label: string; tone?: 'success' | 'warning' | 'danger' | 'neutral' }
  href?: string
  avatar?: string
}

export interface SearchResponse {
  query: string
  ai: { summary: string } | null
  groups: { type: SearchType; label: string; hits: SearchHit[] }[]
  tookMs: number
}

export const SEARCH_LABELS: Record<SearchType, string> = {
  student: 'Students',
  company: 'Companies',
  university: 'Universities',
  user: 'Users',
  verification: 'Verifications',
  document: 'Documents',
  application: 'Applications',
  audit: 'Audit logs',
  support: 'Support',
}

/** What each role may search. The server enforces this list, the client only uses it to draw chips. */
export const SEARCH_TYPES: Record<DashRole, SearchType[]> = {
  student: ['document', 'company'],
  company: ['student', 'application'],
  university: ['student'],
  admin: ['user', 'student', 'company', 'university', 'verification', 'audit', 'support'],
}

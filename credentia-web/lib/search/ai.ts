import { generateJSON } from '@/lib/ai-text'
import { DOC_TYPES, docLabel, isDocType } from '@/lib/documents'
import { statusInfo } from '@/lib/status'
import type { DashRole } from '@/lib/dashboard-nav'
import { clean, type SearchFilters } from './engine'

export interface Interpretation {
  /** What is left of the request once the filter words are taken out. */
  text: string
  filters: SearchFilters
}

const ALLOWED_STATUS = ['pending', 'needs_review', 'verified', 'rejected', 'open', 'closed', 'shortlisted', 'accepted', 'hired']
const ALLOWED_ROLES = ['student', 'company', 'university', 'admin']

const SYSTEM = `You turn a search request into structured filters for Credentia, a credential verification platform in India.
Reply with one JSON object and nothing else: {"text": "...", "filters": {...}}
"text" is what is left of the request after the words that became filters are removed (names, places, keywords). Use an empty string when nothing is left.
Allowed filter keys. Include a key only when the request clearly states it. Never guess a value.
- minCgpa, maxCgpa: number from 0 to 10
- minAts: number from 0 to 100, the resume or ATS score
- minTrust: number from 0 to 100, the trust score
- docs: array with any of "aadhaar", "police", "degree", the documents that must be verified. "fully verified" means all three.
- verifiedOnly: true when the request says verified without naming a document
- course, branch, state, city: text such as "B.Tech", "Computer Science", "Delhi"
- graduationYear: four digit year
- skill: one skill name
- status: one of ${ALLOWED_STATUS.join(', ')}
- docType: one of ${DOC_TYPES.join(', ')}
- userRole: one of ${ALLOWED_ROLES.join(', ')}
- active: true or false
Examples:
"fully verified students from Delhi with CGPA above 8" -> {"text":"","filters":{"docs":["aadhaar","police","degree"],"state":"Delhi","minCgpa":8}}
"rahul police certificate needs review" -> {"text":"rahul","filters":{"docType":"police","status":"needs_review"}}
"B.Tech computer science 2025 with python" -> {"text":"","filters":{"course":"B.Tech","branch":"Computer Science","graduationYear":2025,"skill":"python"}}
"verified candidates with ATS over 70" -> {"text":"","filters":{"verifiedOnly":true,"minAts":70}}`

const num = (value: unknown, min: number, max: number) => (typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : undefined)
const word = (value: unknown) => (typeof value === 'string' ? clean(value).slice(0, 40) || undefined : undefined)

/** Keeps only known keys with sane values. Whatever the model returns, nothing else reaches the database. */
export function sanitizeFilters(raw: unknown): SearchFilters {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const filters: SearchFilters = {}

  const minCgpa = num(source.minCgpa, 0, 10)
  const maxCgpa = num(source.maxCgpa, 0, 10)
  const minAts = num(source.minAts, 0, 100)
  const minTrust = num(source.minTrust, 0, 100)
  if (minCgpa !== undefined) filters.minCgpa = minCgpa
  if (maxCgpa !== undefined) filters.maxCgpa = maxCgpa
  if (minAts !== undefined) filters.minAts = minAts
  if (minTrust !== undefined) filters.minTrust = minTrust

  if (Array.isArray(source.docs)) {
    const docs = source.docs.filter((d): d is 'aadhaar' | 'police' | 'degree' => d === 'aadhaar' || d === 'police' || d === 'degree')
    if (docs.length) filters.docs = Array.from(new Set(docs))
  }
  if (source.verifiedOnly === true) filters.verifiedOnly = true

  const course = word(source.course)
  const branch = word(source.branch)
  const state = word(source.state)
  const city = word(source.city)
  const skill = word(source.skill)
  if (course) filters.course = course
  if (branch) filters.branch = branch
  if (state) filters.state = state
  if (city) filters.city = city
  if (skill) filters.skill = skill

  const year = num(source.graduationYear, 1990, 2100)
  if (year !== undefined) filters.graduationYear = Math.round(year)

  if (typeof source.status === 'string' && ALLOWED_STATUS.includes(source.status)) filters.status = source.status
  if (isDocType(source.docType)) filters.docType = source.docType
  if (typeof source.userRole === 'string' && ALLOWED_ROLES.includes(source.userRole)) filters.userRole = source.userRole
  if (typeof source.active === 'boolean') filters.active = source.active

  return filters
}

const cache = new Map<string, { at: number; value: Interpretation }>()
const TTL_MS = 5 * 60_000

/** Reads a question into filters. Answers repeat often, so they are kept for a few minutes. */
export async function interpretQuery(query: string, role: DashRole): Promise<Interpretation> {
  const key = `${role}:${query.toLowerCase()}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value

  const { data } = await generateJSON<{ text?: unknown; filters?: unknown }>({
    system: SYSTEM,
    user: JSON.stringify({ request: query }),
    maxTokens: 300,
    timeoutMs: 3500,
  })

  const value: Interpretation = { text: typeof data.text === 'string' ? data.text.slice(0, 120) : '', filters: sanitizeFilters(data.filters) }
  cache.set(key, { at: Date.now(), value })
  if (cache.size > 500) cache.delete(cache.keys().next().value as string)
  return value
}

/** Plain phrases for the filters that were applied, so people can see how the question was read. */
export function describeFilters(filters: SearchFilters, text: string): string[] {
  const parts: string[] = []
  if (filters.minCgpa !== undefined) parts.push(`CGPA ${filters.minCgpa} or above`)
  if (filters.maxCgpa !== undefined) parts.push(`CGPA ${filters.maxCgpa} or below`)
  if (filters.minAts !== undefined) parts.push(`ATS score ${filters.minAts} or above`)
  if (filters.minTrust !== undefined) parts.push(`trust score ${filters.minTrust} or above`)
  if (filters.docs?.length) parts.push(`${filters.docs.map((d) => (d === 'aadhaar' ? 'Aadhaar' : d === 'police' ? 'police certificate' : 'degree')).join(', ')} verified`)
  if (filters.verifiedOnly) parts.push('at least one verified document')
  if (filters.course) parts.push(`course ${filters.course}`)
  if (filters.branch) parts.push(`branch ${filters.branch}`)
  if (filters.state) parts.push(`state ${filters.state}`)
  if (filters.city) parts.push(`city ${filters.city}`)
  if (filters.graduationYear) parts.push(`graduating ${filters.graduationYear}`)
  if (filters.skill) parts.push(`skill ${filters.skill}`)
  if (filters.docType) parts.push(docLabel(filters.docType).toLowerCase())
  if (filters.status) parts.push(`status ${statusInfo(filters.status).label.toLowerCase()}`)
  if (filters.userRole) parts.push(`${filters.userRole} accounts`)
  if (filters.active !== undefined) parts.push(filters.active ? 'active accounts' : 'disabled accounts')
  if (text.trim()) parts.push(`the words "${text.trim()}"`)
  return parts
}

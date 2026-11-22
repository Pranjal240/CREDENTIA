import { supabaseAdmin } from '@/lib/supabase'
import { DOC_ROUTE, docLabel, isDocType } from '@/lib/documents'
import { formatDateShort } from '@/lib/format'
import { PENDING_STATUSES, VERIFIED_STATUSES, statusInfo } from '@/lib/status'
import type { DashRole } from '@/lib/dashboard-nav'
import type { SearchHit, SearchType } from './types'

export interface SearchContext {
  userId: string
  role: DashRole
}

/** Structured filters. They come from the AI reading a question, and every value is checked before it is used. */
export interface SearchFilters {
  minCgpa?: number
  maxCgpa?: number
  minAts?: number
  minTrust?: number
  docs?: Array<'aadhaar' | 'police' | 'degree'>
  verifiedOnly?: boolean
  course?: string
  branch?: string
  state?: string
  city?: string
  graduationYear?: number
  skill?: string
  status?: string
  docType?: string
  userRole?: string
  active?: boolean
}

// The PostgREST builders are deeply generic. Every select below names its columns, which is where the shape is checked.
type Builder = any
type Row = Record<string, any>

type Searcher = (ctx: SearchContext, tokens: string[], filters: SearchFilters, limit: number) => Promise<SearchHit[]>

/** Letters, digits and a few address characters only. Anything else could break a PostgREST filter. */
export const clean = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}@.+\- ]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const tokensOf = (value: string) =>
  clean(value)
    .split(' ')
    .filter((token) => token.length >= 2)
    .slice(0, 4)

const like = (value: string) => `%${clean(value)}%`

/** Every token has to match at least one of the columns. */
function matchAll(builder: Builder, tokens: string[], columns: string[]): Builder {
  let next = builder
  for (const token of tokens) next = next.or(columns.map((column) => `${column}.ilike.%${token}%`).join(','))
  return next
}

const joinParts = (...parts: (string | number | null | undefined | false)[]) => parts.filter((part) => part !== null && part !== undefined && part !== false && part !== '').join(' · ')

const encode = (value: string) => encodeURIComponent(value)

const byId = (rows: Row[] | null | undefined) => new Map<string, Row>((rows ?? []).map((row) => [row.id as string, row] as [string, Row]))

async function namesFor(table: 'students', ids: string[], columns = 'id, name'): Promise<Map<string, Row>> {
  if (ids.length === 0) return new Map()
  const { data } = await supabaseAdmin.from(table).select(columns).in('id', ids)
  return byId(data as Row[] | null)
}

/* -------------------------------------------------------------------------- */
/* Students                                                                   */
/* -------------------------------------------------------------------------- */

const students: Searcher = async (ctx, tokens, f, limit) => {
  if (ctx.role !== 'company' && ctx.role !== 'university' && ctx.role !== 'admin') return []

  // Companies only ever see public profiles and never search by email or roll number.
  const columns = ctx.role === 'company' ? ['name', 'course', 'branch', 'city', 'state'] : ['name', 'email', 'roll_number', 'course', 'branch', 'city', 'state']

  let query: Builder = supabaseAdmin
    .from('students')
    .select('id, name, email, course, branch, graduation_year, cgpa, ats_score, trust_score, aadhaar_verified, police_verified, degree_verified, verified_docs_count, city, state, skills')

  if (ctx.role === 'company') query = query.eq('profile_is_public', true)
  if (ctx.role === 'university') query = query.eq('university_id', ctx.userId)

  query = matchAll(query, tokens, columns)
  if (f.minCgpa !== undefined) query = query.gte('cgpa', f.minCgpa)
  if (f.maxCgpa !== undefined) query = query.lte('cgpa', f.maxCgpa)
  if (f.minAts !== undefined) query = query.gte('ats_score', f.minAts)
  if (f.minTrust !== undefined) query = query.gte('trust_score', f.minTrust)
  if (f.verifiedOnly) query = query.gte('verified_docs_count', 1)
  for (const doc of f.docs ?? []) query = query.eq(`${doc}_verified`, true)
  if (f.course) query = query.ilike('course', like(f.course))
  if (f.branch) query = query.ilike('branch', like(f.branch))
  if (f.state) query = query.ilike('state', like(f.state))
  if (f.city) query = query.ilike('city', like(f.city))
  if (f.graduationYear) query = query.eq('graduation_year', f.graduationYear)

  // Skills are a text array, so they are matched here instead of in the database.
  query = query.order('trust_score', { ascending: false, nullsFirst: false }).limit(f.skill ? 80 : limit)

  const { data, error } = await query
  if (error) throw error

  let rows: Row[] = data ?? []
  if (f.skill) {
    const skill = f.skill.toLowerCase()
    rows = rows.filter((row) => ((row.skills as string[] | null) ?? []).some((s) => s.toLowerCase().includes(skill))).slice(0, limit)
  }

  const ids = rows.map((row) => row.id as string)
  const { data: profiles } = ids.length ? await supabaseAdmin.from('profiles').select('id, full_name, avatar_url').in('id', ids) : { data: [] as Row[] }
  const profileById = byId(profiles)

  return rows.map((row) => {
    const profile = profileById.get(row.id)
    const verified = [row.aadhaar_verified, row.police_verified, row.degree_verified].filter(Boolean).length
    const title = (row.name as string) || (profile?.full_name as string) || (row.email as string) || 'Student'
    const href =
      ctx.role === 'company'
        ? `/dashboard/company?student=${row.id}`
        : ctx.role === 'university'
          ? `/dashboard/university?student=${row.id}`
          : `/dashboard/admin/users?q=${encode((row.email as string) || title)}`
    return {
      id: row.id as string,
      type: 'student' as const,
      title,
      subtitle: joinParts(joinParts(row.course, row.branch).replace(' · ', ' '), row.graduation_year, row.cgpa ? `CGPA ${row.cgpa}` : null, row.state),
      badge: { label: `${verified} of 3 verified`, tone: verified === 3 ? ('success' as const) : verified > 0 ? ('warning' as const) : ('neutral' as const) },
      href,
      avatar: (profile?.avatar_url as string) || undefined,
    }
  })
}

/* -------------------------------------------------------------------------- */
/* Applications (company)                                                     */
/* -------------------------------------------------------------------------- */

const applications: Searcher = async (ctx, tokens, f, limit) => {
  if (ctx.role !== 'company') return []

  // Applicants whose name matches one of the words.
  let nameIds: string[] = []
  if (tokens.length) {
    const { data } = await supabaseAdmin
      .from('students')
      .select('id')
      .or(tokens.map((token) => `name.ilike.%${token}%`).join(','))
      .limit(80)
    nameIds = (data ?? []).map((row: Row) => row.id as string)
  }

  let query: Builder = supabaseAdmin.from('applications').select('id, student_id, job_title, status, created_at').eq('company_id', ctx.userId)
  if (tokens.length) {
    const parts = tokens.map((token) => `job_title.ilike.%${token}%`)
    if (nameIds.length) parts.push(`student_id.in.(${nameIds.join(',')})`)
    query = query.or(parts.join(','))
  }
  if (f.status) query = query.ilike('status', clean(f.status))
  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)
  if (error) throw error

  const rows: Row[] = data ?? []
  const names = await namesFor('students', rows.map((row) => row.student_id as string))

  return rows.map((row) => {
    const info = statusInfo(row.status)
    return {
      id: row.id as string,
      type: 'application' as const,
      title: (names.get(row.student_id)?.name as string) || 'Applicant',
      subtitle: joinParts(row.job_title, formatDateShort(row.created_at)),
      badge: info,
      href: `/dashboard/company/applicants?application=${row.id}`,
    }
  })
}

/* -------------------------------------------------------------------------- */
/* Documents (student, own only)                                              */
/* -------------------------------------------------------------------------- */

const documents: Searcher = async (ctx, tokens, f, limit) => {
  if (ctx.role !== 'student') return []

  const { data, error } = await supabaseAdmin
    .from('verifications')
    .select('id, type, status, document_filename, ai_confidence, updated_at')
    .eq('student_id', ctx.userId)
    .order('updated_at', { ascending: false })
  if (error) throw error

  const wanted = tokens.map((token) => token.toLowerCase())
  const rows = ((data ?? []) as Row[])
    .filter((row) => !f.docType || row.type === f.docType)
    .filter((row) => {
      if (!f.status) return true
      if (f.status === 'verified') return (VERIFIED_STATUSES as readonly string[]).includes(row.status)
      if (f.status === 'pending') return (PENDING_STATUSES as readonly string[]).includes(row.status)
      return row.status === f.status
    })
    .filter((row) => {
      const haystack = `${docLabel(row.type)} ${row.type} ${statusInfo(row.status).label} ${row.status} ${row.document_filename ?? ''}`.toLowerCase()
      return wanted.every((word) => haystack.includes(word))
    })
    .slice(0, limit)

  return rows.map((row) => ({
    id: row.id as string,
    type: 'document' as const,
    title: docLabel(row.type),
    subtitle: joinParts(row.document_filename, row.ai_confidence ? `${row.ai_confidence}% confidence` : null, formatDateShort(row.updated_at)),
    badge: statusInfo(row.status),
    href: isDocType(row.type) ? DOC_ROUTE[row.type] : '/dashboard/student/saved',
  }))
}

/* -------------------------------------------------------------------------- */
/* Companies (students see active ones, admins see all)                       */
/* -------------------------------------------------------------------------- */

const companies: Searcher = async (ctx, tokens, f, limit) => {
  if (ctx.role !== 'student' && ctx.role !== 'admin') return []

  let query: Builder = supabaseAdmin.from('companies').select('id, company_name, industry, state, is_verified, logo_url')
  query = matchAll(query, tokens, ['company_name', 'industry', 'state', 'description'])
  if (f.state) query = query.ilike('state', like(f.state))
  const { data, error } = await query.order('company_name', { ascending: true }).limit(limit * 3)
  if (error) throw error

  const rows: Row[] = data ?? []
  const ids = rows.map((row) => row.id as string)
  const { data: profiles } = ids.length ? await supabaseAdmin.from('profiles').select('id, is_active, email').in('id', ids) : { data: [] as Row[] }
  const profileById = byId(profiles)

  // Students only see companies whose account is active.
  const visible = rows.filter((row) => ctx.role === 'admin' || profileById.get(row.id)?.is_active === true).slice(0, limit)

  return visible.map((row) => ({
    id: row.id as string,
    type: 'company' as const,
    title: (row.company_name as string) || 'Company',
    subtitle: joinParts(row.industry, row.state, ctx.role === 'admin' ? profileById.get(row.id)?.email : null),
    badge: { label: row.is_verified ? 'Approved' : 'Pending', tone: row.is_verified ? ('success' as const) : ('warning' as const) },
    href: ctx.role === 'admin' ? `/dashboard/admin/companies?q=${encode((row.company_name as string) || '')}` : `/dashboard/student/apply?company=${row.id}`,
    avatar: (row.logo_url as string) || undefined,
  }))
}

/* -------------------------------------------------------------------------- */
/* Admin only                                                                 */
/* -------------------------------------------------------------------------- */

const universities: Searcher = async (ctx, tokens, f, limit) => {
  if (ctx.role !== 'admin') return []

  // The ERP access key is a secret and is deliberately not selected.
  let query: Builder = supabaseAdmin.from('universities').select('id, university_name, ugc_id, naac_grade, state, city, is_verified')
  query = matchAll(query, tokens, ['university_name', 'ugc_id', 'city', 'state'])
  if (f.state) query = query.ilike('state', like(f.state))
  const { data, error } = await query.order('university_name', { ascending: true }).limit(limit)
  if (error) throw error

  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id as string,
    type: 'university' as const,
    title: (row.university_name as string) || 'University',
    subtitle: joinParts(row.city, row.state, row.naac_grade ? `NAAC ${row.naac_grade}` : null),
    badge: { label: row.is_verified ? 'Approved' : 'Pending approval', tone: row.is_verified ? ('success' as const) : ('warning' as const) },
    href: `/dashboard/admin/outreach?q=${encode((row.university_name as string) || '')}`,
  }))
}

const users: Searcher = async (ctx, tokens, f, limit) => {
  if (ctx.role !== 'admin') return []

  let query: Builder = supabaseAdmin.from('profiles').select('id, full_name, email, role, phone, is_active, avatar_url')
  query = matchAll(query, tokens, ['full_name', 'email', 'phone', 'role'])
  if (f.userRole) query = query.eq('role', f.userRole)
  if (f.active !== undefined) query = query.eq('is_active', f.active)
  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)
  if (error) throw error

  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id as string,
    type: 'user' as const,
    title: (row.full_name as string) || (row.email as string) || 'User',
    subtitle: joinParts(row.email, row.role),
    badge: row.is_active === false ? { label: 'Disabled', tone: 'danger' as const } : { label: String(row.role ?? 'user').replace(/^\w/, (c: string) => c.toUpperCase()), tone: 'neutral' as const },
    href: `/dashboard/admin/users?q=${encode((row.email as string) || (row.full_name as string) || '')}`,
    avatar: (row.avatar_url as string) || undefined,
  }))
}

const verifications: Searcher = async (ctx, tokens, f, limit) => {
  if (ctx.role !== 'admin') return []

  // For each word, the students whose name or email contains it.
  const perToken = await Promise.all(
    tokens.map(async (token) => {
      const { data } = await supabaseAdmin.from('students').select('id').or(`name.ilike.%${token}%,email.ilike.%${token}%`).limit(60)
      return (data ?? []).map((row: Row) => row.id as string)
    }),
  )

  let query: Builder = supabaseAdmin.from('verifications').select('id, student_id, type, status, document_filename, ai_confidence, updated_at')
  tokens.forEach((token, index) => {
    const parts = [`type.ilike.%${token}%`, `status.ilike.%${token}%`, `document_filename.ilike.%${token}%`]
    if (perToken[index].length) parts.push(`student_id.in.(${perToken[index].join(',')})`)
    query = query.or(parts.join(','))
  })
  if (f.docType) query = query.eq('type', f.docType)
  if (f.status === 'verified') query = query.in('status', [...VERIFIED_STATUSES])
  else if (f.status === 'pending') query = query.in('status', [...PENDING_STATUSES])
  else if (f.status) query = query.eq('status', f.status)

  const { data, error } = await query.order('updated_at', { ascending: false }).limit(limit)
  if (error) throw error

  const rows: Row[] = data ?? []
  const names = await namesFor('students', rows.map((row) => row.student_id as string))

  return rows.map((row) => ({
    id: row.id as string,
    type: 'verification' as const,
    title: joinParts((names.get(row.student_id)?.name as string) || 'Student', docLabel(row.type)),
    subtitle: joinParts(row.document_filename, row.ai_confidence ? `${row.ai_confidence}% confidence` : null, formatDateShort(row.updated_at)),
    badge: statusInfo(row.status),
    href: `/dashboard/admin/verifications?verification=${row.id}`,
  }))
}

const audit: Searcher = async (ctx, tokens, _f, limit) => {
  if (ctx.role !== 'admin') return []

  let query: Builder = supabaseAdmin.from('audit_logs').select('id, actor_email, action, target_type, target_id, created_at')
  query = matchAll(query, tokens, ['action', 'actor_email', 'target_type', 'target_id'])
  const { data, error } = await query.order('created_at', { ascending: false }).limit(limit)
  if (error) throw error

  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id as string,
    type: 'audit' as const,
    title: String(row.action ?? 'action')
      .replace(/_/g, ' ')
      .replace(/^\w/, (c) => c.toUpperCase()),
    subtitle: joinParts(row.actor_email, row.target_type, formatDateShort(row.created_at)),
    href: `/dashboard/admin/audit?q=${encode((row.action as string) || '')}`,
  }))
}

const support: Searcher = async (ctx, tokens, f, limit) => {
  if (ctx.role !== 'admin') return []

  // Conversations whose messages contain the first word.
  let messageIds: string[] = []
  if (tokens.length) {
    const { data } = await supabaseAdmin.from('support_messages').select('conversation_id').ilike('content', `%${tokens[0]}%`).limit(40)
    messageIds = Array.from(new Set((data ?? []).map((row: Row) => row.conversation_id as string)))
  }

  let query: Builder = supabaseAdmin.from('support_conversations').select('id, user_name, user_email, user_role, subject, status, last_message_at')
  tokens.forEach((token, index) => {
    const parts = ['user_name', 'user_email', 'subject', 'user_role'].map((column) => `${column}.ilike.%${token}%`)
    if (index === 0 && messageIds.length) parts.push(`id.in.(${messageIds.join(',')})`)
    query = query.or(parts.join(','))
  })
  if (f.status) query = query.eq('status', f.status)
  const { data, error } = await query.order('last_message_at', { ascending: false, nullsFirst: false }).limit(limit)
  if (error) throw error

  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id as string,
    type: 'support' as const,
    title: (row.user_name as string) || (row.user_email as string) || 'Support conversation',
    subtitle: joinParts(row.subject, row.user_role),
    badge: statusInfo(row.status),
    href: `/dashboard/admin/support?conversation=${row.id}`,
  }))
}

const SEARCHERS: Record<SearchType, Searcher> = { student: students, application: applications, document: documents, company: companies, university: universities, user: users, verification: verifications, audit, support }

/** Lower is better: titles that start with the words first, then titles that contain them. */
function rank(hit: SearchHit, text: string) {
  const title = hit.title.toLowerCase()
  const needle = text.toLowerCase().trim()
  if (!needle) return 2
  if (title.startsWith(needle)) return 0
  if (title.includes(needle)) return 1
  return 2
}

export interface GroupResult {
  type: SearchType
  hits: SearchHit[]
}

/** Which filters mean something for each kind of result. */
const RELEVANT_FILTERS: Record<SearchType, (keyof SearchFilters)[]> = {
  student: ['minCgpa', 'maxCgpa', 'minAts', 'minTrust', 'docs', 'verifiedOnly', 'course', 'branch', 'state', 'city', 'graduationYear', 'skill'],
  verification: ['docType', 'status'],
  document: ['docType', 'status'],
  application: ['status'],
  company: ['state'],
  university: ['state'],
  user: ['userRole', 'active'],
  support: ['status'],
  audit: [],
}

/**
 * With no words left to match, a group only runs when a filter applies to it.
 * Otherwise "police documents that need review" would also list every user and company.
 */
const hasWork = (type: SearchType, tokens: string[], filters: SearchFilters) => tokens.length > 0 || RELEVANT_FILTERS[type].some((key) => filters[key] !== undefined)

/** Runs every requested search at once. One failing group never fails the rest. */
export async function runSearch(ctx: SearchContext, types: SearchType[], text: string, filters: SearchFilters, limit: number): Promise<GroupResult[]> {
  const tokens = tokensOf(text)
  return Promise.all(
    types.map(async (type) => {
      if (!hasWork(type, tokens, filters)) return { type, hits: [] as SearchHit[] }
      try {
        const hits = await SEARCHERS[type](ctx, tokens, filters, limit)
        return { type, hits: [...hits].sort((a, b) => rank(a, text) - rank(b, text)) }
      } catch (error) {
        console.error(`[search] ${type} failed:`, (error as Error).message)
        return { type, hits: [] as SearchHit[] }
      }
    }),
  )
}

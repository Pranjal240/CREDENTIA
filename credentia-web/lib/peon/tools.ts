import { supabaseAdmin } from '@/lib/supabase'
import type { Caller } from '@/lib/api-auth'
import type { DashRole } from '@/lib/dashboard-nav'
import { DOC_ROUTE, docLabel, isDocType } from '@/lib/documents'
import { formatDateShort } from '@/lib/format'
import { VERIFIED_STATUSES, statusInfo } from '@/lib/status'
import { runSearch } from '@/lib/search/engine'
import { sanitizeFilters } from '@/lib/search/ai'
import { SEARCH_TYPES, type SearchType } from '@/lib/search/types'
import { findTopics } from './knowledge'

type Row = Record<string, any>

export interface ToolContext {
  caller: Caller | null
  /** Registers a source and returns its number, so the answer can cite it as [n]. */
  cite: (title: string, url?: string) => number
}

export interface ToolOutcome {
  /** One short line shown next to the tool call. */
  summary: string
  /** What the model reads. Kept small. */
  data: unknown
  /** Set by request_human_support. The person confirms before anything is sent. */
  handoff?: { subject: string; summary: string }
}

export interface ToolDef {
  name: string
  description: string
  roles: Array<DashRole | 'guest'>
  parameters: Record<string, unknown>
  run: (args: Row, ctx: ToolContext) => Promise<ToolOutcome>
}

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

const count = async (table: string, filter?: (query: Row) => Row) => {
  let query: any = supabaseAdmin.from(table).select('id', { count: 'exact', head: true })
  if (filter) query = filter(query)
  const { count: total } = await query
  return total ?? 0
}

/** The few fields of an AI result that help explain a document, never the whole payload. */
function highlights(type: string, ai: Row | null | undefined): Row | undefined {
  if (!ai || typeof ai !== 'object') return undefined
  const pick = (keys: string[]) =>
    Object.fromEntries(
      keys
        .filter((key) => ai[key] !== undefined && ai[key] !== null && ai[key] !== '')
        .map((key) => [key, Array.isArray(ai[key]) ? ai[key].slice(0, 5) : typeof ai[key] === 'string' ? ai[key].slice(0, 300) : ai[key]]),
    )
  switch (type) {
    case 'resume':
      return pick(['ats_score', 'authenticity_score', 'top_skills', 'strengths', 'improvements', 'keywords_missing', 'summary'])
    case 'police':
      return pick(['is_police_certificate', 'confidence', 'issuing_authority', 'issue_date', 'district', 'state', 'issues', 'fraud_indicators'])
    case 'aadhaar':
      return pick(['verified', 'name', 'state', 'aadhaar_last4', 'confidence', 'issues'])
    case 'degree':
      return pick(['verified', 'confidence', 'university_name', 'degree', 'course', 'year_of_passing', 'grade_cgpa', 'issues'])
    default:
      return pick(['verified', 'confidence', 'board_name', 'percentage', 'grade', 'year_of_passing', 'issues'])
  }
}

const NO_ARGS = { type: 'object', properties: {}, additionalProperties: false }

export const TOOLS: ToolDef[] = [
  {
    name: 'get_help_topic',
    description: 'Looks up how Credentia works: documents, statuses, scores, privacy, sharing, companies, universities, pricing, support. Use it for any question about the platform itself.',
    roles: ['guest', 'student', 'company', 'university', 'admin'],
    parameters: { type: 'object', properties: { question: { type: 'string', description: 'The question in the person\'s own words.' } }, required: ['question'] },
    run: async (args, ctx) => {
      const topics = findTopics(text(args.question, 300), 3)
      return {
        summary: topics.length === 1 ? topics[0].title : `${topics.length} topics`,
        data: topics.map((topic) => ({ topic: topic.title, answer: topic.body, cite: `[${ctx.cite(topic.title, topic.href)}]` })),
      }
    },
  },

  {
    name: 'get_account_summary',
    description: 'Summary of the signed in person\'s own account: name, role and the numbers that matter for that role. Use it to greet or to answer "what is my status".',
    roles: ['student', 'company', 'university', 'admin'],
    parameters: NO_ARGS,
    run: async (_args, { caller }) => {
      if (!caller) throw new Error('Not signed in')
      const base = { name: caller.name || null, email: caller.email, role: caller.role }

      if (caller.role === 'student') {
        const { data: student } = await supabaseAdmin
          .from('students')
          .select('trust_score, verified_docs_count, ats_score, cgpa, course, branch, graduation_year, profile_complete_pct, profile_is_public, university_id, share_token')
          .eq('id', caller.userId)
          .maybeSingle()
        let university: string | null = null
        if (student?.university_id) {
          const { data: u } = await supabaseAdmin.from('universities').select('university_name').eq('id', student.university_id).maybeSingle()
          university = (u?.university_name as string) ?? null
        }
        return {
          summary: `Trust score ${student?.trust_score ?? 0}`,
          data: {
            ...base,
            trust_score: student?.trust_score ?? 0,
            verified_documents: student?.verified_docs_count ?? 0,
            ats_score: student?.ats_score ?? null,
            cgpa: student?.cgpa ?? null,
            course: [student?.course, student?.branch].filter(Boolean).join(' ') || null,
            graduation_year: student?.graduation_year ?? null,
            profile_completion_percent: student?.profile_complete_pct ?? 0,
            profile_is_public: student?.profile_is_public ?? null,
            has_share_link: Boolean(student?.share_token),
            linked_university: university,
          },
        }
      }

      if (caller.role === 'company') {
        const [{ data: company }, applicants, saved] = await Promise.all([
          supabaseAdmin.from('companies').select('company_name, is_verified, industry, state, minimum_ats_score, minimum_cgpa, require_police_verification, require_aadhaar, require_degree').eq('id', caller.userId).maybeSingle(),
          count('applications', (q) => q.eq('company_id', caller.userId)),
          count('saved_candidates', (q) => q.eq('company_id', caller.userId)),
        ])
        return { summary: company?.company_name || 'Company', data: { ...base, company, applicants, saved_candidates: saved } }
      }

      if (caller.role === 'university') {
        const { data: university } = await supabaseAdmin.from('universities').select('university_name, is_verified, city, state, data_sharing_on').eq('id', caller.userId).maybeSingle()
        const students = await count('students', (q) => q.eq('university_id', caller.userId))
        return { summary: university?.university_name || 'University', data: { ...base, university, linked_students: students, approved_by_admin: university?.is_verified === true } }
      }

      return { summary: 'Admin account', data: base }
    },
  },

  {
    name: 'list_documents',
    description: 'The signed in student\'s own documents with status, confidence, file name, what the AI found and why something was rejected or needs review. Use it for any question about their verification.',
    roles: ['student'],
    parameters: { type: 'object', properties: { type: { type: ['string', 'null'], description: 'Optional: resume, police, aadhaar, degree, marksheet_10th, marksheet_12th.' } } },
    run: async (args, { caller, cite }) => {
      if (!caller) throw new Error('Not signed in')
      let query = supabaseAdmin
        .from('verifications')
        .select('type, status, ai_confidence, document_filename, rejection_reason, admin_reviewed_at, updated_at, ai_result')
        .eq('student_id', caller.userId)
        .order('type')
      const type = text(args.type, 30)
      if (type && isDocType(type)) query = query.eq('type', type)
      const { data, error } = await query
      if (error) throw error

      const rows = (data ?? []) as Row[]
      const verified = rows.filter((row) => (VERIFIED_STATUSES as readonly string[]).includes(row.status)).length
      return {
        summary: `${rows.length} document${rows.length === 1 ? '' : 's'}, ${verified} verified`,
        data: rows.map((row) => ({
          document: docLabel(row.type),
          status: statusInfo(row.status).label,
          confidence_percent: row.ai_confidence ?? null,
          file: row.document_filename ?? null,
          rejection_reason: row.rejection_reason ?? null,
          reviewed_by_admin: Boolean(row.admin_reviewed_at),
          updated: formatDateShort(row.updated_at) || null,
          found_by_ai: highlights(row.type, row.ai_result),
          page: isDocType(row.type) ? DOC_ROUTE[row.type] : '/dashboard/student/saved',
          cite: `[${cite(docLabel(row.type), isDocType(row.type) ? DOC_ROUTE[row.type] : '/dashboard/student/saved')}]`,
        })),
      }
    },
  },

  {
    name: 'list_applications',
    description: 'Applications. For a student it is their own applications to companies. For a company it is the people who applied to it.',
    roles: ['student', 'company'],
    parameters: NO_ARGS,
    run: async (_args, { caller }) => {
      if (!caller) throw new Error('Not signed in')

      if (caller.role === 'student') {
        const { data } = await supabaseAdmin.from('applications').select('company_id, job_title, status, created_at').eq('student_id', caller.userId).order('created_at', { ascending: false }).limit(20)
        const rows = (data ?? []) as Row[]
        const ids = rows.map((row) => row.company_id as string)
        const { data: companies } = ids.length ? await supabaseAdmin.from('companies').select('id, company_name').in('id', ids) : { data: [] as Row[] }
        const names = new Map((companies ?? []).map((c: Row) => [c.id as string, c.company_name as string] as [string, string]))
        return {
          summary: `${rows.length} application${rows.length === 1 ? '' : 's'}`,
          data: rows.map((row) => ({ company: names.get(row.company_id) ?? 'Company', role: row.job_title, status: statusInfo(row.status).label, applied: formatDateShort(row.created_at) })),
        }
      }

      const { data } = await supabaseAdmin.from('applications').select('student_id, job_title, status, created_at').eq('company_id', caller.userId).order('created_at', { ascending: false }).limit(20)
      const rows = (data ?? []) as Row[]
      const ids = rows.map((row) => row.student_id as string)
      const { data: students } = ids.length ? await supabaseAdmin.from('students').select('id, name, course, trust_score').in('id', ids) : { data: [] as Row[] }
      const byId = new Map((students ?? []).map((s: Row) => [s.id as string, s] as [string, Row]))
      return {
        summary: `${rows.length} applicant${rows.length === 1 ? '' : 's'}`,
        data: rows.map((row) => ({ applicant: byId.get(row.student_id)?.name ?? 'Applicant', course: byId.get(row.student_id)?.course ?? null, trust_score: byId.get(row.student_id)?.trust_score ?? null, role: row.job_title, status: statusInfo(row.status).label, applied: formatDateShort(row.created_at) })),
      }
    },
  },

  {
    name: 'search_platform',
    description:
      'Searches the data this person is allowed to see. Students search their documents and companies. Companies search verified public students and their applicants. Universities search their own students. Admins search users, students, companies, universities, verifications, audit logs and support. Put names and keywords in query, and structured conditions in filters.',
    roles: ['student', 'company', 'university', 'admin'],
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Names or keywords. Can be empty when only filters are used.' },
        types: { type: ['array', 'null'], items: { type: 'string' }, description: 'Optional kinds of result: student, company, university, user, verification, document, application, audit, support.' },
        filters: {
          type: ['object', 'null'],
          description:
            'Optional. Keys: minCgpa, maxCgpa, minAts, minTrust (numbers), docs (array of aadhaar, police, degree that must be verified), verifiedOnly (true), course, branch, state, city, skill (text), graduationYear (number), status (pending, needs_review, verified, rejected, open, closed), docType (resume, police, aadhaar, degree, marksheet_10th, marksheet_12th), userRole (student, company, university, admin), active (true or false).',
        },
      },
      required: ['query'],
    },
    run: async (args, { caller, cite }) => {
      if (!caller) throw new Error('Not signed in')

      // A university only searches once an admin has approved it.
      if (caller.role === 'university') {
        const { data: university } = await supabaseAdmin.from('universities').select('is_verified').eq('id', caller.userId).maybeSingle()
        if (university?.is_verified !== true) return { summary: 'Not approved yet', data: { message: 'The university account is waiting for admin approval, so the registry is not searchable yet.' } }
      }

      const allowed = SEARCH_TYPES[caller.role]
      const asked = Array.isArray(args.types) ? (args.types as unknown[]).filter((t): t is SearchType => typeof t === 'string' && (allowed as string[]).includes(t)) : []
      const types = asked.length ? asked : allowed
      const groups = await runSearch({ userId: caller.userId, role: caller.role }, types, text(args.query, 200), sanitizeFilters(args.filters), 6)

      const results = groups.flatMap((group) =>
        group.hits.map((hit) => ({
          kind: group.type,
          title: hit.title,
          details: hit.subtitle ?? null,
          status: hit.badge?.label ?? null,
          cite: hit.href ? `[${cite(hit.title, hit.href)}]` : undefined,
        })),
      )
      return { summary: `${results.length} result${results.length === 1 ? '' : 's'}`, data: results.length ? results : { message: 'Nothing matched.' } }
    },
  },

  {
    name: 'get_platform_stats',
    description: 'Live platform numbers for admins: users by role, documents waiting for review, rejected documents, approvals waiting, open support conversations.',
    roles: ['admin'],
    parameters: NO_ARGS,
    run: async () => {
      const [students, publicStudents, companies, pendingCompanies, universities, pendingUniversities, needsReview, rejected, verified, openSupport] = await Promise.all([
        count('students'),
        count('students', (q) => q.eq('profile_is_public', true)),
        count('companies'),
        count('companies', (q) => q.eq('is_verified', false)),
        count('universities'),
        count('universities', (q) => q.eq('is_verified', false)),
        count('verifications', (q) => q.eq('status', 'needs_review')),
        count('verifications', (q) => q.eq('status', 'rejected')),
        count('verifications', (q) => q.in('status', [...VERIFIED_STATUSES])),
        count('support_conversations', (q) => q.eq('status', 'open')),
      ])
      return {
        summary: `${needsReview} to review`,
        data: {
          students,
          public_student_profiles: publicStudents,
          companies,
          companies_waiting_for_approval: pendingCompanies,
          universities,
          universities_waiting_for_approval: pendingUniversities,
          documents_needing_review: needsReview,
          documents_rejected: rejected,
          documents_verified: verified,
          open_support_conversations: openSupport,
          where: { review: '/dashboard/admin/verifications', support: '/dashboard/admin/support', universities: '/dashboard/admin/outreach', companies: '/dashboard/admin/companies' },
        },
      }
    },
  },

  {
    name: 'request_human_support',
    description:
      'Offers to send the conversation to the human support team. Call it when the person asks for a person, reports a problem you cannot solve, or when no tool gives the answer. The person is asked to confirm before anything is sent, so tell them what will be sent.',
    roles: ['student', 'company', 'university', 'admin'],
    parameters: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'A short title for the support team, under 80 characters.' },
        summary: { type: 'string', description: 'What the person needs, with the details the team would ask for. Plain text.' },
      },
      required: ['subject', 'summary'],
    },
    run: async (args) => {
      const subject = text(args.subject, 90) || 'Help needed'
      const summary = text(args.summary, 900)
      return {
        summary: 'Waiting for confirmation',
        data: { ready: true, note: 'The person will see a confirm button. Nothing has been sent yet.' },
        handoff: { subject, summary },
      }
    },
  },
]

/** The tools one kind of caller may use. */
export const toolsFor = (role: DashRole | 'guest') => TOOLS.filter((tool) => tool.roles.includes(role))

/** The same list in the shape the chat API expects. */
export const toolSchemas = (role: DashRole | 'guest') =>
  toolsFor(role).map((tool) => ({ type: 'function' as const, function: { name: tool.name, description: tool.description, parameters: tool.parameters } }))

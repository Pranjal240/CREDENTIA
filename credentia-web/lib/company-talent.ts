import { supabaseAdmin } from '@/lib/supabase'
import { isVerifiedStatus } from '@/lib/status'

type Row = Record<string, any>

/**
 * What a company or a university may know about a student. No document files
 * and no raw AI output. Companies only ever receive students with a public
 * profile, universities only their own linked students.
 */
export interface Talent {
  id: string
  name: string
  email: string
  avatar_url: string | null
  course: string
  branch: string
  graduation_year: number | null
  cgpa: number | null
  ats_score: number
  trust_score: number
  city: string
  state: string
  percentage_10th: number | null
  percentage_12th: number | null
  skills: string[]
  police_verified: boolean
  aadhaar_verified: boolean
  degree_verified: boolean
  verified_docs_count: number
  docs: { type: string; status: string }[]
  roll_number: string | null
  created_at: string | null
}

const toNumber = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

const firstText = (...values: unknown[]) => {
  for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim()
  return ''
}

interface LoadOptions {
  /** Only these students. */
  ids?: string[]
  /** The students linked to this university, public or not. Without it only public profiles are returned. */
  universityId?: string
}

/**
 * Students with their verification status, ready to search. Details the
 * student table lacks are filled from what the AI read, as the old pages did,
 * but the AI output itself never leaves the server.
 */
export async function loadTalent(options: LoadOptions = {}): Promise<Talent[]> {
  let query = supabaseAdmin
    .from('students')
    .select('id, name, email, course, branch, graduation_year, cgpa, ats_score, trust_score, city, state, percentage_10th, percentage_12th, skills, roll_number, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)
  query = options.universityId ? query.eq('university_id', options.universityId) : query.eq('profile_is_public', true)
  if (options.ids) query = query.in('id', options.ids)

  const { data: students, error } = await query
  if (error) throw error
  const rows: Row[] = students ?? []
  if (rows.length === 0) return []

  const ids = rows.map((row) => row.id as string)
  // The AI output is large, and only the resume and the degree are read from it, so it is fetched for those two
  // alone. Every document still gets its status.
  const [{ data: profiles }, { data: verifications }, { data: readings }] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, full_name, email, avatar_url').in('id', ids),
    supabaseAdmin.from('verifications').select('student_id, type, status').in('student_id', ids),
    supabaseAdmin.from('verifications').select('student_id, type, ai_result').in('student_id', ids).in('type', ['resume', 'degree']),
  ])
  const readingOf = new Map<string, Row>(((readings ?? []) as Row[]).map((r) => [`${r.student_id}:${r.type}`, (r.ai_result ?? {}) as Row] as [string, Row]))

  const profileById = new Map<string, Row>((profiles ?? []).map((p: Row) => [p.id as string, p] as [string, Row]))
  const docsByStudent = new Map<string, Row[]>()
  for (const v of (verifications ?? []) as Row[]) {
    const list = docsByStudent.get(v.student_id) ?? []
    list.push(v)
    docsByStudent.set(v.student_id, list)
  }

  return rows.map((row) => {
    const profile = profileById.get(row.id)
    const docs = docsByStudent.get(row.id) ?? []
    const resume = readingOf.get(`${row.id}:resume`) ?? {}
    const degree = readingOf.get(`${row.id}:degree`) ?? {}
    const verified = (type: string) => docs.some((d) => d.type === type && isVerifiedStatus(d.status))

    return {
      id: row.id as string,
      name: firstText(row.name, profile?.full_name) || 'Student',
      email: firstText(row.email, profile?.email),
      avatar_url: (profile?.avatar_url as string) || null,
      course: firstText(degree.course, resume.course, row.course),
      branch: firstText(degree.branch, resume.branch, row.branch),
      graduation_year: toNumber(row.graduation_year) ?? toNumber(degree.year_of_passing) ?? toNumber(resume.graduation_year),
      cgpa: toNumber(row.cgpa) ?? toNumber(degree.grade_cgpa) ?? toNumber(resume.cgpa),
      ats_score: Number(resume.ats_score) || Number(row.ats_score) || 0,
      trust_score: Number(row.trust_score) || 0,
      city: firstText(resume.city, row.city),
      state: firstText(resume.state, row.state),
      percentage_10th: toNumber(row.percentage_10th),
      percentage_12th: toNumber(row.percentage_12th),
      skills: Array.isArray(row.skills) ? (row.skills as string[]).slice(0, 12) : [],
      police_verified: verified('police'),
      aadhaar_verified: verified('aadhaar'),
      degree_verified: verified('degree'),
      verified_docs_count: docs.filter((d) => isVerifiedStatus(d.status)).length,
      docs: docs.map((d) => ({ type: d.type as string, status: d.status as string })),
      roll_number: (row.roll_number as string) || null,
      created_at: (row.created_at as string) || null,
    }
  })
}

import type { DocType } from '@/lib/documents'

/**
 * Helpers for what an AI reads out of a document. Pure, so they can be checked
 * without a network or a database.
 */

const MAX_STRING = 1500
const MAX_ITEMS = 40
const MAX_KEYS = 60
const MAX_DEPTH = 4
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g

function cleanValue(value: unknown, depth: number): unknown {
  if (value === null || typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') return value.replace(CONTROL, '').slice(0, MAX_STRING)
  if (depth >= MAX_DEPTH) return null
  if (Array.isArray(value)) return value.slice(0, MAX_ITEMS).map((item) => cleanValue(item, depth + 1))
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as object).slice(0, MAX_KEYS)) {
      if (key === '__proto__') continue
      out[key.slice(0, 60)] = cleanValue(item, depth + 1)
    }
    return out
  }
  return null
}

/**
 * A copy of the AI's answer that is safe to store and to show: plain data, no
 * control characters, with limits on text, lists, keys and depth. Anything that
 * is not an object gives an empty object.
 */
export function cleanAnalysis(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return cleanValue(value, 0) as Record<string, unknown>
}

const text = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.replace(CONTROL, '').trim().slice(0, max) : typeof value === 'number' ? String(value).slice(0, max) : ''

/** The first number in a value, so "7.54 CGPA", "85.4%" and 91 all work. */
function firstNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const match = value.match(/\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

const inRange = (value: number | null, min: number, max: number, minExclusive = false): value is number =>
  value !== null && (minExclusive ? value > min : value >= min) && value <= max

export interface StudentPatch {
  /** Fields for the students row, or null when there is nothing to write. */
  student: Record<string, unknown> | null
  /** Fields for the profiles row, or null when there is nothing to write. */
  profile: Record<string, unknown> | null
}

/**
 * The student details a document is allowed to fill in, taken from an AI
 * result the server has already sealed. Every value is checked before it goes
 * near a column. The verified flags and scores are not set here: they are
 * worked out from the records afterwards, so a document can never switch one on.
 */
export function studentPatchFromAnalysis(type: DocType | string, analysis: Record<string, unknown>, fileUrl: string, now: string): StudentPatch {
  const a = analysis

  if (type === 'resume') {
    const student: Record<string, unknown> = { resume_url: fileUrl, updated_at: now }
    const score = firstNumber(a.ats_score)
    if (score !== null && score > 0) student.ats_score = Math.min(Math.round(score), 100)

    const name = text(a.student_name, 120)
    if (name) student.name = name
    for (const [field, source] of [['city', a.city], ['state', a.state], ['course', a.course], ['branch', a.branch]] as const) {
      const value = text(source, 80)
      if (value) student[field] = value
    }

    let cgpaSource: unknown = a.cgpa
    if ((cgpaSource === null || cgpaSource === undefined || cgpaSource === '') && typeof a.summary === 'string') {
      cgpaSource = a.summary.match(/cgpa\s*(?:of|is|:)?\s*([0-9.]+)/i)?.[1]
    }
    const cgpa = firstNumber(cgpaSource)
    if (inRange(cgpa, 0, 10, true)) student.cgpa = cgpa

    const year = firstNumber(a.graduation_year)
    if (inRange(year, 1980, 2100)) student.graduation_year = Math.round(year)
    const experience = firstNumber(a.experience_years)
    if (inRange(experience, 0, 60)) student.experience_years = experience

    if (Array.isArray(a.top_skills)) {
      const skills = a.top_skills
        .filter((skill): skill is string => typeof skill === 'string')
        .map((skill) => skill.replace(CONTROL, '').trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 20)
      if (skills.length > 0) student.skills = skills
    }

    const phone = text(a.phone_number, 20)
    const profile: Record<string, unknown> = { updated_at: now }
    if (name) profile.full_name = name
    if (phone) profile.phone = phone
    return { student, profile: Object.keys(profile).length > 1 ? profile : null }
  }

  if (type === 'aadhaar') {
    const digits = typeof a.aadhaar_last4 === 'string' || typeof a.aadhaar_last4 === 'number' ? String(a.aadhaar_last4).replace(/\D/g, '') : ''
    return {
      student: {
        updated_at: now,
        aadhaar_last4: digits.length >= 4 ? digits.slice(-4) : null,
        aadhaar_name: text(a.name, 120) || null,
        aadhaar_dob: text(a.dob, 20) || null,
        aadhaar_state: text(a.state, 80) || null,
      },
      profile: null,
    }
  }

  if (type === 'degree') {
    const student: Record<string, unknown> = { updated_at: now }
    const course = text(a.course, 80) || text(a.degree, 80)
    if (course) student.course = course
    const branch = text(a.branch, 80)
    if (branch) student.branch = branch
    const cgpa = firstNumber(a.grade_cgpa)
    if (inRange(cgpa, 0, 10, true)) student.cgpa = cgpa
    const year = firstNumber(a.year_of_passing)
    if (inRange(year, 1980, 2100)) student.graduation_year = Math.round(year)
    const name = text(a.student_name, 120)
    if (name) student.name = name
    return { student, profile: null }
  }

  if (type === 'marksheet_10th' || type === 'marksheet_12th') {
    const percentage = firstNumber(a.percentage)
    if (!inRange(percentage, 0, 100)) return { student: null, profile: null }
    return { student: { updated_at: now, [type === 'marksheet_10th' ? 'percentage_10th' : 'percentage_12th']: percentage }, profile: null }
  }

  return { student: null, profile: null }
}

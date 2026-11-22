import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { fetchAll } from '@/lib/admin-data'
import { DOC_TYPES } from '@/lib/documents'
import { isPendingStatus, isRejectedStatus, isVerifiedStatus } from '@/lib/status'
import type { AdminAnalytics } from '@/lib/admin-types'

export const dynamic = 'force-dynamic'

const DAY = 86_400_000
const IST = 330 * 60_000
const RANGES = [30, 90, 180, 365]

const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0)
const round1 = (value: number) => Math.round(value * 10) / 10

/** Splits 0 to 100 scores into five bands. */
const BANDS = ['0 to 19', '20 to 39', '40 to 59', '60 to 79', '80 to 100']
const bandOf = (score: number) => Math.min(4, Math.max(0, Math.floor(score / 20)))

/**
 * Counts for the analytics page, worked out on the server so the browser never
 * receives every row. Days are Indian calendar days. A short range is shown by
 * day, a medium one by week and a long one by month.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const asked = Number(new URL(request.url).searchParams.get('days'))
  const days = RANGES.includes(asked) ? asked : 90

  try {
    const [profiles, docs, students] = await Promise.all([
      fetchAll<{ role: string; created_at: string | null }>((from, to) => supabaseAdmin.from('profiles').select('role, created_at').order('id').range(from, to)),
      fetchAll<{ student_id: string; type: string; status: string; ai_confidence: number | null; updated_at: string | null }>((from, to) =>
        supabaseAdmin.from('verifications').select('id, student_id, type, status, ai_confidence, updated_at').neq('status', 'not_submitted').order('id').range(from, to),
      ),
      fetchAll<{ id: string; trust_score: number | null; ats_score: number | null; cgpa: number | null }>((from, to) =>
        supabaseAdmin.from('students').select('id, trust_score, ats_score, cgpa').order('id').range(from, to),
      ),
    ])

    /* Buckets */
    const bucket: AdminAnalytics['bucket'] = days <= 31 ? 'day' : days <= 120 ? 'week' : 'month'
    const todayIdx = Math.floor((Date.now() + IST) / DAY)
    const size = bucket === 'week' ? 7 : 1
    const count = bucket === 'month' ? (days >= 365 ? 12 : 6) : Math.ceil(days / size)
    const startIdx = todayIdx - count * size + 1
    const now = new Date(Date.now() + IST)
    const monthStart = now.getUTCFullYear() * 12 + now.getUTCMonth() - (count - 1)

    const indexOf = (iso: string | null): number => {
      if (!iso) return -1
      const ms = new Date(iso).getTime()
      if (Number.isNaN(ms)) return -1
      let i: number
      if (bucket === 'month') {
        const d = new Date(ms + IST)
        i = d.getUTCFullYear() * 12 + d.getUTCMonth() - monthStart
      } else {
        i = Math.floor((Math.floor((ms + IST) / DAY) - startIdx) / size)
      }
      return i >= 0 && i < count ? i : -1
    }

    const labels = Array.from({ length: count }, (_, i) =>
      bucket === 'month'
        ? new Date(Date.UTC(Math.floor((monthStart + i) / 12), (monthStart + i) % 12, 1)).toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' })
        : new Date((startIdx + i * size) * DAY).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
    )
    const zeros = () => Array.from({ length: count }, () => 0)

    const signups = { student: zeros(), company: zeros(), university: zeros() }
    for (const profile of profiles) {
      const i = indexOf(profile.created_at)
      if (i >= 0 && profile.role in signups) signups[profile.role as keyof typeof signups][i] += 1
    }

    const processed = { verified: zeros(), review: zeros(), rejected: zeros() }
    for (const doc of docs) {
      const i = indexOf(doc.updated_at)
      if (i < 0) continue
      if (isVerifiedStatus(doc.status)) processed.verified[i] += 1
      else if (isPendingStatus(doc.status)) processed.review[i] += 1
      else if (isRejectedStatus(doc.status)) processed.rejected[i] += 1
    }

    /* Everything below is the state of the platform today, not limited to the range. */
    let aiVerified = 0
    let adminVerified = 0
    let review = 0
    let rejected = 0
    const byType = new Map<string, { verified: number; pending: number; rejected: number }>(DOC_TYPES.map((type) => [type, { verified: 0, pending: 0, rejected: 0 }]))
    const confidence = new Map<string, number[]>()
    const submitted = new Set<string>()
    const verifiedTypes = new Map<string, Set<string>>()

    for (const doc of docs) {
      submitted.add(doc.student_id)
      const row = byType.get(doc.type) ?? { verified: 0, pending: 0, rejected: 0 }
      byType.set(doc.type, row)
      if (isVerifiedStatus(doc.status)) {
        row.verified += 1
        if (doc.status === 'ai_approved') aiVerified += 1
        else adminVerified += 1
        const set = verifiedTypes.get(doc.student_id) ?? new Set<string>()
        set.add(doc.type)
        verifiedTypes.set(doc.student_id, set)
      } else if (isPendingStatus(doc.status)) {
        row.pending += 1
        review += 1
      } else if (isRejectedStatus(doc.status)) {
        row.rejected += 1
        rejected += 1
      }
      if (doc.ai_confidence && doc.ai_confidence > 0) confidence.set(doc.type, [...(confidence.get(doc.type) ?? []), doc.ai_confidence])
    }

    const trust = BANDS.map((label) => ({ label, value: 0 }))
    const ats = BANDS.map((label) => ({ label, value: 0 }))
    for (const student of students) {
      trust[bandOf(student.trust_score ?? 0)].value += 1
      if ((student.ats_score ?? 0) > 0) ats[bandOf(student.ats_score ?? 0)].value += 1
    }

    const verifiedDocs = aiVerified + adminVerified
    const fully = Array.from(verifiedTypes.values()).filter((set) => set.has('degree') && set.has('police') && set.has('aadhaar')).length

    const payload: AdminAnalytics = {
      days,
      bucket,
      labels,
      signups,
      processed,
      totals: {
        users: profiles.length,
        students: students.length,
        documents: docs.length,
        verifiedRate: docs.length ? round1((verifiedDocs / docs.length) * 100) : 0,
        avgTrust: round1(mean(students.map((s) => s.trust_score ?? 0))),
        avgAts: round1(mean(students.map((s) => s.ats_score ?? 0).filter((v) => v > 0))),
        avgCgpa: round1(mean(students.map((s) => s.cgpa ?? 0).filter((v) => v > 0))),
      },
      statuses: [
        { label: 'AI verified', value: aiVerified },
        { label: 'Admin verified', value: adminVerified },
        { label: 'Needs review', value: review },
        { label: 'Rejected', value: rejected },
      ],
      pipeline: Array.from(byType.entries()).map(([type, row]) => ({ type, ...row })),
      trust,
      ats,
      confidence: Array.from(confidence.entries()).map(([type, values]) => ({ type, value: Math.round(mean(values)) })),
      funnel: [
        { label: 'Students', value: students.length },
        { label: 'Submitted a document', value: submitted.size },
        { label: 'Has a verified document', value: verifiedTypes.size },
        { label: 'Degree, police and Aadhaar verified', value: fully },
      ],
    }
    return NextResponse.json(payload)
  } catch (error) {
    console.error('[admin/analytics] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The analytics could not be loaded.' }, { status: 500 })
  }
}

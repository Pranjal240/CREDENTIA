import { NextResponse } from 'next/server'
import { aiAvailable, generateJSON } from '@/lib/ai-text'
import { loadTalent } from '@/lib/company-talent'
import { rateLimit } from '@/lib/rate-limit'
import { getUniversityAccess } from '@/lib/university-access'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const SYSTEM = `You write a short briefing for a university about its own cohort on Credentia, a credential verification platform in India.
You receive only counts and averages. Reply with one JSON object and nothing else:
{"paragraphs": ["...", "...", "..."]}
Write exactly three short paragraphs, each under 55 words:
1. How academically strong and job ready the cohort looks, comparing CGPA with ATS scores.
2. How complete verification is and where the gaps are.
3. Which courses lead and what to do next.
Rules: use only the numbers given, never invent a figure, never name a student, say "the cohort". Plain sentences. No dashes, no markdown.`

/**
 * A short written briefing about the university's own cohort. The numbers are
 * counted on the server from the registry, never taken from the request.
 */
export async function POST() {
  const access = await getUniversityAccess()
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!access.approved) return NextResponse.json({ error: 'Your institution is waiting for approval.' }, { status: 403 })
  if (!aiAvailable()) return NextResponse.json({ error: 'The AI briefing is not available right now.' }, { status: 503 })
  if (!rateLimit(`uni-insights:${access.caller.userId}`, 6, 60_000)) return NextResponse.json({ error: 'Please wait a moment before asking again.' }, { status: 429 })

  try {
    const students = await loadTalent({ universityId: access.caller.userId })
    if (students.length === 0) return NextResponse.json({ error: 'There are no linked students to summarise yet.' }, { status: 400 })

    const avg = (values: number[]) => (values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0)
    const courses = new Map<string, number>()
    for (const s of students) if (s.course) courses.set(s.course, (courses.get(s.course) ?? 0) + 1)

    const facts = {
      students: students.length,
      average_cgpa: avg(students.map((s) => s.cgpa ?? 0).filter(Boolean)),
      average_ats: avg(students.map((s) => s.ats_score).filter(Boolean)),
      average_trust: avg(students.map((s) => s.trust_score)),
      degree_verified: students.filter((s) => s.degree_verified).length,
      police_verified: students.filter((s) => s.police_verified).length,
      aadhaar_verified: students.filter((s) => s.aadhaar_verified).length,
      fully_verified: students.filter((s) => s.degree_verified && s.police_verified && s.aadhaar_verified).length,
      no_documents_verified: students.filter((s) => s.verified_docs_count === 0).length,
      top_courses: Array.from(courses.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([course, count]) => ({ course, count })),
    }

    const { data } = await generateJSON<{ paragraphs?: unknown }>({ system: SYSTEM, user: JSON.stringify(facts), maxTokens: 600, timeoutMs: 20_000 })
    const paragraphs = (Array.isArray(data.paragraphs) ? data.paragraphs : [])
      .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
      .slice(0, 3)
      .map((p) => p.replace(/[\u2013\u2014]/g, ',').replace(/--+/g, ',').trim())
    if (paragraphs.length === 0) throw new Error('empty briefing')

    return NextResponse.json({ paragraphs, facts })
  } catch (error) {
    console.error('[university/ai-insights] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The briefing did not finish. Please try again.' }, { status: 502 })
  }
}

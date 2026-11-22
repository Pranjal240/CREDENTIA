import { NextResponse } from 'next/server'
import { getCallerWithRole } from '@/lib/api-auth'
import { aiAvailable, generateJSON } from '@/lib/ai-text'
import { loadTalent } from '@/lib/company-talent'
import { rateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const SYSTEM = `You are a recruiter's assistant for Credentia. Read the job description and choose the best candidates from the list.
Reply with one JSON object and nothing else: {"matches":[{"id":"...","match_score":0-100,"reason":"one short sentence"}]}
Rules:
- Use only ids from the candidate list. Never invent a candidate.
- Judge by course, branch, skills, CGPA, ATS score, graduation year and verified documents. Say what actually fits. Do not make up facts.
- Order by match_score, highest first. Return at most 8 matches. Return fewer, or an empty list, when nobody fits.
- The reason is plain words, with no dashes.`

/**
 * Ranks public candidates against a job description. The caller names the
 * candidates it is looking at, the server reads their details itself, and only
 * ids it knows can come back.
 */
export async function POST(req: Request) {
  const caller = await getCallerWithRole(['company'])
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!aiAvailable()) return NextResponse.json({ error: 'AI matching is not available right now.' }, { status: 503 })
  if (!rateLimit(`ai-match:${caller.userId}`, 10, 60_000)) return NextResponse.json({ error: 'Please wait a moment before matching again.' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const jobDescription = typeof body?.jobDescription === 'string' ? body.jobDescription.trim().slice(0, 3000) : ''
  if (jobDescription.length < 8) return NextResponse.json({ error: 'Describe the role in a few words.' }, { status: 400 })
  const wanted: string[] | undefined = Array.isArray(body?.ids) ? body.ids.filter((id: unknown): id is string => typeof id === 'string').slice(0, 80) : undefined

  try {
    const pool = await loadTalent(wanted ? { ids: wanted } : {})
    if (pool.length === 0) return NextResponse.json({ matches: [] })

    const candidates = pool.slice(0, 80).map((s) => ({
      id: s.id,
      course: s.course,
      branch: s.branch,
      skills: s.skills,
      cgpa: s.cgpa,
      ats: s.ats_score,
      year: s.graduation_year,
      state: s.state,
      verified: { degree: s.degree_verified, police: s.police_verified, aadhaar: s.aadhaar_verified },
    }))

    const { data } = await generateJSON<{ matches?: { id?: unknown; match_score?: unknown; reason?: unknown }[] }>({
      system: SYSTEM,
      user: `Job description:\n${jobDescription}\n\nCandidates:\n${JSON.stringify(candidates)}`,
      maxTokens: 900,
      timeoutMs: 20_000,
    })

    const known = new Set(candidates.map((c) => c.id))
    const matches = (Array.isArray(data.matches) ? data.matches : [])
      .filter((m): m is { id: string; match_score: number; reason: string } => typeof m.id === 'string' && known.has(m.id))
      .map((m) => ({
        id: m.id,
        match_score: Math.max(0, Math.min(100, Math.round(Number(m.match_score) || 0))),
        reason: String(m.reason ?? '').replace(/[\u2013\u2014]/g, ',').replace(/--+/g, ',').slice(0, 220),
      }))
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 8)

    return NextResponse.json({ matches })
  } catch (error) {
    console.error('[company/ai-match] failed:', (error as Error).message)
    return NextResponse.json({ error: 'Matching did not finish. Please try again.' }, { status: 502 })
  }
}

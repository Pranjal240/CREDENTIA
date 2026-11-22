import { NextResponse } from 'next/server'
import { getCallerWithRole } from '@/lib/api-auth'
import { rateLimit } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase'
import { MAX_UPLOAD_BYTES } from '@/lib/documents'
import { keyFromFileUrl, sniffFile } from '@/lib/doc-files'
import { prepareContent } from '@/lib/doc-read'
import { readFromR2 } from '@/lib/r2'
import { callAI } from '@/lib/groq'
import { renderJakesResume, type ResumeData } from '@/lib/jakes-resume'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const fail = (status: number, error: string) => NextResponse.json({ success: false, error }, { status })

const text = (value: unknown, max = 300): string => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '')
const list = (value: unknown, count: number, max = 300): string[] =>
  Array.isArray(value) ? value.map((v) => text(v, max)).filter(Boolean).slice(0, count) : []

/** The signed in student's own saved resume, read from storage by its key. Nothing is fetched from a browser supplied address. */
async function loadOwnResume(userId: string): Promise<{ content: string; isImage: boolean } | { error: string; status: number }> {
  const { data } = await supabaseAdmin.from('verifications').select('document_url').eq('student_id', userId).eq('type', 'resume').maybeSingle()
  if (!data?.document_url) return { error: 'Upload and save your resume first, then try again.', status: 400 }
  const checked = keyFromFileUrl(data.document_url, userId)
  if (checked.ok === false) return { error: 'Your saved resume could not be used. Please upload it again.', status: 400 }
  try {
    const file = await readFromR2(checked.key, MAX_UPLOAD_BYTES)
    const kind = sniffFile(file.buffer)
    if (!kind) return { error: 'Only PDF, JPG or PNG resumes can be read.', status: 400 }
    return await prepareContent(file.buffer, kind)
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === 'missing') return { error: 'Your saved resume file could not be found. Please upload it again.', status: 400 }
    console.error('[resume-tools] the resume could not be loaded:', (error as Error).message)
    return { error: 'Your resume could not be loaded right now. Please try again in a moment.', status: 502 }
  }
}

async function jobMatch(resume: { content: string; isImage: boolean }, jobDescription: string, jobTitle: string) {
  const system = `You are an expert applicant tracking system reviewer for the Indian job market. Compare the candidate's resume with the job description below and return ONLY a valid JSON object, with no markdown and no extra text.
Be honest and specific. Only suggest adding skills or experience as something to add IF the candidate truly has it. Never tell the candidate to invent anything.
The JSON schema:
{
  "match_score": <0-100, how well this resume matches this job as an ATS would score it>,
  "summary": "<2 to 3 sentences: how strong the match is and the single biggest gap>",
  "matched_keywords": ["keywords from the job that the resume already has"],
  "missing_keywords": ["important keywords from the job that the resume lacks"],
  "add_suggestions": [{"where": "<section of the resume>", "suggestion": "<what to add or change, in plain words>"}],
  "rewrite_examples": [{"before": "<a weak line from the resume or empty>", "after": "<a stronger version that stays truthful>"}],
  "format_tips": ["short tips that help an ATS read the resume"]
}
Give 3 to 6 add_suggestions, up to 3 rewrite_examples, and up to 4 format_tips.
Job title: ${jobTitle || 'not given'}
Job description:
"""
${jobDescription}
"""`
  const raw = (await callAI(system, resume.content, resume.isImage, 2200)) as Record<string, unknown>
  const score = Number(raw?.match_score)
  const suggestions = Array.isArray(raw?.add_suggestions) ? raw.add_suggestions : []
  const rewrites = Array.isArray(raw?.rewrite_examples) ? raw.rewrite_examples : []
  return {
    match_score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
    summary: text(raw?.summary, 600),
    matched_keywords: list(raw?.matched_keywords, 20, 60),
    missing_keywords: list(raw?.missing_keywords, 20, 60),
    add_suggestions: suggestions
      .map((s) => ({ where: text((s as Record<string, unknown>)?.where, 60), suggestion: text((s as Record<string, unknown>)?.suggestion, 320) }))
      .filter((s) => s.suggestion)
      .slice(0, 6),
    rewrite_examples: rewrites
      .map((s) => ({ before: text((s as Record<string, unknown>)?.before, 240), after: text((s as Record<string, unknown>)?.after, 280) }))
      .filter((s) => s.after)
      .slice(0, 3),
    format_tips: list(raw?.format_tips, 4, 200),
  }
}

async function extractResumeFields(resume: { content: string; isImage: boolean }): Promise<ResumeData> {
  const system = `You read a resume and return its content as plain fields. Return ONLY a valid JSON object, with no markdown and no extra text.
Use ONLY what is written in the resume. Never invent a school, employer, date, number, link or skill. If something is not there, use an empty string or an empty list. Write dates the way the resume does.
Keep each bullet to one line, in the resume's own words, tidied only for grammar.
The JSON schema:
{
  "name": "", "phone": "", "email": "", "linkedin": "", "github": "",
  "education": [{"school": "", "location": "", "degree": "", "dates": ""}],
  "experience": [{"role": "", "company": "", "location": "", "dates": "", "bullets": [""]}],
  "projects": [{"name": "", "tech": "", "dates": "", "bullets": [""]}],
  "skills": [{"label": "Languages", "items": "comma separated"}, {"label": "Frameworks", "items": ""}, {"label": "Developer Tools", "items": ""}]
}`
  const raw = (await callAI(system, resume.content, resume.isImage, 3200)) as Record<string, unknown>
  const arr = (v: unknown, n: number) => (Array.isArray(v) ? v.slice(0, n) : [])
  const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
  return {
    name: text(raw?.name, 80),
    phone: text(raw?.phone, 40),
    email: text(raw?.email, 100),
    linkedin: text(raw?.linkedin, 120),
    github: text(raw?.github, 120),
    education: arr(raw?.education, 4).map((e) => ({ school: text(obj(e).school, 120), location: text(obj(e).location, 80), degree: text(obj(e).degree, 140), dates: text(obj(e).dates, 60) })).filter((e) => e.school),
    experience: arr(raw?.experience, 5).map((e) => ({ role: text(obj(e).role, 100), company: text(obj(e).company, 100), location: text(obj(e).location, 80), dates: text(obj(e).dates, 60), bullets: list(obj(e).bullets, 6, 240) })).filter((e) => e.role || e.company),
    projects: arr(raw?.projects, 5).map((e) => ({ name: text(obj(e).name, 100), tech: text(obj(e).tech, 140), dates: text(obj(e).dates, 60), bullets: list(obj(e).bullets, 5, 240) })).filter((e) => e.name),
    skills: arr(raw?.skills, 6).map((e) => ({ label: text(obj(e).label, 40), items: text(obj(e).items, 300) })).filter((e) => e.label && e.items),
  }
}

/**
 * Tools for the signed in student's own resume. A job specific ATS check, and the resume as LaTeX in the
 * style of Jake's resume. The LaTeX is only built when the student asks for it.
 */
export async function POST(request: Request) {
  const caller = await getCallerWithRole(['student'])
  if (!caller) return fail(401, 'Please sign in again to continue.')
  if (!rateLimit(`resume-tools:${caller.userId}`, 12, 60 * 60_000)) return fail(429, 'You are using the resume tools very quickly. Please wait a little and try again.')

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'That request could not be understood.')
  const input = body as Record<string, unknown>
  const action = input.action

  if (action === 'job-match') {
    const jobDescription = typeof input.jobDescription === 'string' ? input.jobDescription.trim().slice(0, 6000) : ''
    if (jobDescription.length < 60) return fail(400, 'Paste the full job description, at least a few lines, so the check is meaningful.')
    const jobTitle = text(input.jobTitle, 100)
    const resume = await loadOwnResume(caller.userId)
    if ('error' in resume) return fail(resume.status, resume.error)
    try {
      return NextResponse.json({ success: true, result: await jobMatch(resume, jobDescription, jobTitle) })
    } catch (error) {
      console.error('[resume-tools] job match failed:', (error as Error).message)
      return fail(502, 'The check could not be completed right now. Please try again in a moment.')
    }
  }

  if (action === 'latex') {
    const resume = await loadOwnResume(caller.userId)
    if ('error' in resume) return fail(resume.status, resume.error)
    try {
      const fields = await extractResumeFields(resume)
      if (!fields.name && fields.education.length === 0 && fields.experience.length === 0 && fields.projects.length === 0) {
        return fail(422, 'The resume could not be read well enough to build LaTeX from it. Try a clearer PDF.')
      }
      return NextResponse.json({ success: true, latex: renderJakesResume(fields) })
    } catch (error) {
      console.error('[resume-tools] latex failed:', (error as Error).message)
      return fail(502, 'The LaTeX could not be built right now. Please try again in a moment.')
    }
  }

  return fail(400, 'That action is not recognised.')
}

'use client'

import * as React from 'react'
import { ArrowUpRight, Check, Download, FileCode2, Target } from 'lucide-react'
import AILoader from '@/components/smoothui/components/ai-loader'
import { ScoreRing } from '@/components/dash/analysis-report'
import { Field, TextArea, TextInput } from '@/components/dash/form'
import { Panel } from '@/components/dash/kit'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { ATS_HABITS, OVERLEAF_STEPS } from '@/lib/jakes-resume'

interface JobMatch {
  match_score: number
  summary: string
  matched_keywords: string[]
  missing_keywords: string[]
  add_suggestions: { where: string; suggestion: string }[]
  rewrite_examples: { before: string; after: string }[]
  format_tips: string[]
}

async function call(body: Record<string, unknown>) {
  const res = await fetch('/api/student/resume-tools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.success) throw new Error(data.error || 'That could not be done right now. Please try again.')
  return data
}

const KeywordList = ({ items, tone }: { items: string[]; tone: 'good' | 'gap' }) =>
  items.length === 0 ? (
    <p className="text-sm text-muted-foreground">None.</p>
  ) : (
    <ul className="flex flex-wrap gap-2">
      {items.map((word) => (
        <li key={word} className={tone === 'good' ? 'rounded-lg border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success' : 'rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-ink'}>
          {word}
        </li>
      ))}
    </ul>
  )

/**
 * Tools that work on the student's saved resume. Both are free. The job check compares the resume with one
 * job description. The LaTeX is only built when the student presses the button for it.
 */
export function ResumeTools({ hasResume }: { hasResume: boolean }) {
  const [title, setTitle] = React.useState('')
  const [job, setJob] = React.useState('')
  const [checking, setChecking] = React.useState(false)
  const [checkError, setCheckError] = React.useState('')
  const [match, setMatch] = React.useState<JobMatch | null>(null)

  const [building, setBuilding] = React.useState(false)
  const [latexError, setLatexError] = React.useState('')
  const [latex, setLatex] = React.useState('')

  const runCheck = async () => {
    setChecking(true)
    setCheckError('')
    try {
      const data = await call({ action: 'job-match', jobDescription: job, jobTitle: title })
      setMatch(data.result as JobMatch)
    } catch (err) {
      setCheckError((err as Error).message)
    } finally {
      setChecking(false)
    }
  }

  const buildLatex = async () => {
    setBuilding(true)
    setLatexError('')
    try {
      const data = await call({ action: 'latex' })
      setLatex(String(data.latex))
    } catch (err) {
      setLatexError((err as Error).message)
    } finally {
      setBuilding(false)
    }
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([latex], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'resume.tex'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!hasResume) {
    return (
      <Panel title="Resume tools" subtitle="Free for every student." index={1} className="mt-4">
        <p className="text-sm leading-relaxed text-muted-foreground">Save your resume above first. Then you can check it against a specific job and get it as LaTeX for Overleaf.</p>
      </Panel>
    )
  }

  return (
    <div className="mt-4 grid gap-4">
      <Panel title="Check your resume against a job" subtitle="Paste a job description to see how an ATS would score your resume for it, and what to add." index={1}>
        <div className="grid gap-3">
          <Field label="Job title (optional)" htmlFor="job-title">
            <TextInput id="job-title" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="Software Engineer Intern" />
          </Field>
          <Field label="Job description" htmlFor="job-text" hint={`${job.length} of 6000 characters`}>
            <TextArea id="job-text" rows={7} value={job} maxLength={6000} onChange={(e) => setJob(e.target.value)} placeholder="Paste the full job description here." />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" size="sm" disabled={checking || job.trim().length < 60} onClick={() => void runCheck()}>
              <Target className="size-4" aria-hidden="true" />
              {checking ? 'Checking' : 'Check against this job'}
            </Button>
            {checking ? <AILoader label="Comparing your resume with the job" variant="bar" /> : null}
          </div>
          {checkError ? (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {checkError}
            </p>
          ) : null}
        </div>

        {match ? (
          <div className="mt-6 space-y-6 border-t border-white/10 pt-6">
            <div className="flex flex-wrap items-center gap-5">
              <ScoreRing value={match.match_score} label="Match for this job" />
              <div className="min-w-0 flex-1 basis-60">
                <p className="text-sm font-extrabold">Match for this job</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{match.summary}</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-extrabold">Already in your resume</h3>
                <KeywordList items={match.matched_keywords} tone="good" />
              </div>
              <div>
                <h3 className="mb-2 text-sm font-extrabold">Missing from your resume</h3>
                <KeywordList items={match.missing_keywords} tone="gap" />
              </div>
            </div>

            {match.add_suggestions.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-extrabold">What to add or change</h3>
                <ul className="space-y-2.5">
                  {match.add_suggestions.map((s, i) => (
                    <li key={i} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                      <span>
                        {s.where ? <strong className="font-bold">{s.where}. </strong> : null}
                        {s.suggestion}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">Add a skill only if it is true for you. Companies and interviewers will ask about it.</p>
              </div>
            ) : null}

            {match.rewrite_examples.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-extrabold">Stronger ways to say it</h3>
                <ul className="space-y-3">
                  {match.rewrite_examples.map((r, i) => (
                    <li key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm leading-relaxed">
                      {r.before ? (
                        <p className="text-muted-foreground">
                          <span className="font-bold text-foreground/80">Before: </span>
                          {r.before}
                        </p>
                      ) : null}
                      <p className={r.before ? 'mt-1.5' : ''}>
                        <span className="font-bold text-success">After: </span>
                        {r.after}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {match.format_tips.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {match.format_tips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </Panel>

      <Panel title="Your resume as LaTeX, in Jake's style" subtitle="The one page layout most students build on Overleaf, and the one ATS systems read well. Built only when you ask." index={2}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="default" size="sm" disabled={building} onClick={() => void buildLatex()}>
            <FileCode2 className="size-4" aria-hidden="true" />
            {building ? 'Building' : latex ? 'Build it again' : 'Get the LaTeX code'}
          </Button>
          {building ? <AILoader label="Turning your resume into LaTeX" variant="bar" /> : null}
        </div>
        {latexError ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-destructive">
            {latexError}
          </p>
        ) : null}

        {latex ? (
          <div className="mt-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <CopyButton value={latex} />
              <Button variant="default" size="sm" onClick={download}>
                <Download className="size-4" aria-hidden="true" />
                Download resume.tex
              </Button>
            </div>
            <label htmlFor="latex-code" className="sr-only">
              LaTeX code
            </label>
            <textarea id="latex-code" readOnly value={latex} spellCheck={false} className="h-64 w-full resize-y rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-foreground/90 outline-none focus-visible:border-white/30" />
            <p className="mt-2 text-xs text-muted-foreground">The AI copied this from your resume. Read every line before you send it to anyone.</p>
          </div>
        ) : null}

        <details className="group mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <summary className="cursor-pointer text-sm font-extrabold text-foreground outline-none focus-visible:text-brand-ink">How to make a perfect resume on Overleaf</summary>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/85">
            {OVERLEAF_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <h3 className="mt-4 text-sm font-extrabold">Habits that help with ATS</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {ATS_HABITS.map((habit) => (
              <li key={habit}>{habit}</li>
            ))}
          </ul>
          <div className="mt-4">
            <Button href="https://www.overleaf.com/project" target="_blank" rel="noreferrer noopener" variant="default" size="sm">
              Open Overleaf
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </details>
      </Panel>
    </div>
  )
}

export default ResumeTools

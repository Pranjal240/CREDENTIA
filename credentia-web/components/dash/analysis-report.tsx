'use client'

import * as React from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/dash/kit'

type Analysis = Record<string, any>

const has = (value: unknown) => value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)

/** A grid of labelled facts. Empty values are left out so a sparse result stays tidy. */
function Facts({ items }: { items: { label: string; value: unknown }[] }) {
  const shown = items.filter((item) => has(item.value))
  if (shown.length === 0) return null
  return (
    <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {shown.map((item) => (
        <div key={item.label} className="glass-flat min-w-0 rounded-xl px-3 py-2.5">
          <dt className="text-[11px] font-semibold text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 break-words text-sm font-bold text-foreground">{typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value)}</dd>
        </div>
      ))}
    </dl>
  )
}

function Chips({ title, items, tone = 'neutral' }: { title: string; items?: string[] | null; tone?: 'neutral' | 'brand' | 'muted' }) {
  if (!Array.isArray(items) || items.length === 0) return null
  return (
    <div>
      <h4 className="mb-2 text-xs font-extrabold text-foreground/80">{title}</h4>
      <ul className="flex flex-wrap gap-1.5">
        {items.slice(0, 14).map((item, i) => (
          <li
            key={`${item}-${i}`}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-xs font-semibold',
              tone === 'brand' ? 'border-brand/40 bg-brand/10 text-brand-ink' : tone === 'muted' ? 'border-white/10 bg-transparent text-muted-foreground' : 'border-white/12 bg-white/[0.05] text-foreground/85',
            )}
          >
            {String(item)}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Points({ title, items, icon }: { title: string; items?: string[] | null; icon: 'good' | 'improve' }) {
  if (!Array.isArray(items) || items.length === 0) return null
  const Icon = icon === 'good' ? CircleCheck : CircleAlert
  return (
    <div>
      <h4 className="mb-2 text-xs font-extrabold text-foreground/80">{title}</h4>
      <ul className="space-y-1.5">
        {items.slice(0, 6).map((item, i) => (
          <li key={`${item}-${i}`} className="flex gap-2 text-sm leading-snug text-foreground/85">
            <Icon className={cn('mt-0.5 size-4 shrink-0', icon === 'good' ? 'text-success' : 'text-warning')} aria-hidden="true" />
            <span>{String(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ScoreRing({ value, label, size = 96 }: { value: number; label: string; size?: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)))
  const color = safe >= 75 ? 'rgb(var(--success))' : safe >= 50 ? 'rgb(var(--warning))' : 'rgb(var(--danger))'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label} ${safe} out of 100`}>
      <svg viewBox="0 0 80 80" className="-rotate-90" width={size} height={size} aria-hidden="true">
        <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
        <circle cx="40" cy="40" r="34" pathLength="100" stroke={color} strokeWidth="6" fill="none" strokeDasharray="100" strokeDashoffset={100 - safe} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
        <span className="text-2xl font-extrabold leading-none">{safe}</span>
      </div>
    </div>
  )
}

/** The result line: whether the AI accepted the document and how sure it was. */
function Verdict({ ok, label, confidence }: { ok: boolean; label: string; confidence?: number | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge tone={ok ? 'success' : 'warning'}>{label}</Badge>
      {confidence ? <span className="text-xs font-semibold text-muted-foreground">{confidence}% confidence</span> : null}
    </div>
  )
}

function Issues({ items, title = 'What the AI noted' }: { items?: unknown; title?: string }) {
  if (!Array.isArray(items) || items.length === 0) return null
  return (
    <div>
      <h4 className="mb-2 text-xs font-extrabold text-foreground/80">{title}</h4>
      <ul className="space-y-1.5">
        {items.slice(0, 6).map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-snug text-foreground/85">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            <span>{String(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * What the AI read from a document, laid out by type. Used on every document
 * page and in the records view, so a result always looks the same.
 */
export function AnalysisReport({ type, result, confidence }: { type: string; result?: Analysis | null; confidence?: number | null }) {
  if (!result || typeof result !== 'object') return <p className="text-sm text-muted-foreground">No analysis is stored for this document yet.</p>
  const r = result
  const conf = (r.confidence as number | undefined) ?? confidence ?? null

  if (type === 'resume') {
    const score = Number(r.ats_score) || 0
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-5">
          <ScoreRing value={score} label="ATS score" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">ATS score</p>
            {r.summary ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.summary}</p> : null}
            {r.authenticity_score ? <p className="mt-2 text-xs font-semibold text-muted-foreground">Authenticity {r.authenticity_score} out of 100</p> : null}
          </div>
        </div>
        <Facts
          items={[
            { label: 'Name', value: r.student_name },
            { label: 'Course', value: r.course },
            { label: 'Branch', value: r.branch },
            { label: 'CGPA', value: r.cgpa },
            { label: 'Graduation year', value: r.graduation_year },
            { label: 'Experience', value: r.experience_years ? `${r.experience_years} ${Number(r.experience_years) === 1 ? 'year' : 'years'}` : null },
            { label: 'City', value: r.city },
            { label: 'State', value: r.state },
          ]}
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Points title="Strengths" items={r.strengths} icon="good" />
          <Points title="Improvements" items={r.improvements} icon="improve" />
        </div>
        <Chips title="Top skills" items={r.top_skills} tone="brand" />
        <Chips title="Keywords found" items={r.keywords_found} />
        <Chips title="Keywords to add" items={r.keywords_missing} tone="muted" />
      </div>
    )
  }

  if (type === 'police') {
    return (
      <div className="space-y-4">
        <Verdict ok={Boolean(r.is_police_certificate)} label={r.is_police_certificate ? 'Looks like a police certificate' : 'Not recognised as a police certificate'} confidence={conf} />
        <Facts
          items={[
            { label: 'Certificate number', value: r.certificate_number },
            { label: 'Issuing authority', value: r.issuing_authority },
            { label: 'Applicant', value: r.applicant_name },
            { label: 'District', value: r.district },
            { label: 'State', value: r.state },
            { label: 'Issue date', value: r.issue_date },
          ]}
        />
        <Issues items={[...(r.fraud_indicators ?? []), ...(r.issues ?? [])]} />
      </div>
    )
  }

  if (type === 'aadhaar') {
    return (
      <div className="space-y-4">
        <Verdict ok={Boolean(r.verified)} label={r.verified ? 'Identity details read' : 'Could not confirm the card'} confidence={conf} />
        <Facts
          items={[
            { label: 'Name', value: r.name },
            { label: 'Date of birth', value: r.dob },
            { label: 'Gender', value: r.gender },
            { label: 'State', value: r.state },
            { label: 'Aadhaar number', value: r.aadhaar_last4 ? `XXXX XXXX ${r.aadhaar_last4}` : null },
          ]}
        />
        <Issues items={r.issues} />
      </div>
    )
  }

  if (type === 'degree') {
    return (
      <div className="space-y-4">
        <Verdict ok={Boolean(r.verified)} label={r.verified ? 'Degree details read' : 'Could not confirm the degree'} confidence={conf} />
        <Facts
          items={[
            { label: 'University', value: r.university_name },
            { label: 'Degree', value: r.degree },
            { label: 'Course', value: r.course },
            { label: 'Year of passing', value: r.year_of_passing },
            { label: 'CGPA or grade', value: r.grade_cgpa },
            { label: 'Roll number', value: r.roll_number },
          ]}
        />
        <Issues items={r.issues} />
      </div>
    )
  }

  if (type === 'marksheet_10th' || type === 'marksheet_12th') {
    const subjects = Array.isArray(r.subjects) ? (r.subjects as { name?: string; marks?: string | number; max_marks?: string | number }[]) : []
    return (
      <div className="space-y-4">
        <Verdict ok={Boolean(r.verified)} label={r.verified ? 'Marksheet read' : 'Could not confirm the marksheet'} confidence={conf} />
        <Facts
          items={[
            { label: 'Board', value: r.board_name },
            { label: 'School', value: r.school_name },
            { label: 'Year', value: r.year_of_passing },
            { label: 'Percentage', value: r.percentage },
            { label: 'Grade', value: r.grade },
            { label: 'Result', value: r.result },
            { label: 'Roll number', value: r.roll_number },
          ]}
        />
        {subjects.length > 0 ? (
          <div>
            <h4 className="mb-2 text-xs font-extrabold text-foreground/80">Subjects</h4>
            <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
              {subjects.slice(0, 8).map((subject, i) => (
                <li key={`${subject.name}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{subject.name}</span>
                  <span className="tabular shrink-0 text-muted-foreground">
                    {subject.marks}
                    {subject.max_marks ? ` of ${subject.max_marks}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <Issues items={r.issues} />
      </div>
    )
  }

  // Other credentials and anything unknown: show the plain facts that were stored.
  const entries = Object.entries(r).filter(([, value]) => value !== null && value !== undefined && typeof value !== 'object')
  return <Facts items={entries.map(([key, value]) => ({ label: key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()), value }))} />
}

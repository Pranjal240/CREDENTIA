'use client'

import * as React from 'react'
import { Bookmark, BookmarkCheck, CreditCard, Download, GraduationCap, Mail, Shield } from 'lucide-react'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { Dialog } from '@/components/dash/dialog'
import { ProfileAvatar } from '@/components/dash/profile-avatar'
import { ScoreRing } from '@/components/dash/analysis-report'
import { Meter } from '@/components/dash/charts'
import { StatusBadge } from '@/components/dash/kit'
import { cn } from '@/lib/utils'
import { saveCsv } from '@/lib/csv'
import { DOC_TYPES, docLabel } from '@/lib/documents'
import type { Talent } from '@/lib/company-talent'

export interface AiMatch {
  id: string
  match_score: number
  reason: string
}

/** Three small marks for the documents companies ask about most. Words, not colour alone. */
export function VerifyMarks({ talent, className }: { talent: Pick<Talent, 'police_verified' | 'aadhaar_verified' | 'degree_verified'>; className?: string }) {
  const items = [
    { ok: talent.police_verified, label: 'Police', icon: Shield },
    { ok: talent.aadhaar_verified, label: 'Aadhaar', icon: CreditCard },
    { ok: talent.degree_verified, label: 'Degree', icon: GraduationCap },
  ]
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)} aria-label="Verified documents">
      {items.map((item) => (
        <li
          key={item.label}
          className={cn('inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold', item.ok ? 'border-success/40 bg-success/10 text-success' : 'border-white/10 bg-white/[0.03] text-muted-foreground')}
        >
          <item.icon className="size-3" aria-hidden="true" />
          {item.label}
          <span className="sr-only">{item.ok ? ' verified' : ' not verified'}</span>
        </li>
      ))}
    </ul>
  )
}

export function CandidateCard({
  talent,
  saved,
  match,
  comparing,
  onOpen,
  onToggleSave,
  onToggleCompare,
  index = 0,
}: {
  talent: Talent
  saved: boolean
  match?: AiMatch
  comparing?: boolean
  onOpen: () => void
  onToggleSave: () => void
  onToggleCompare?: () => void
  index?: number
}) {
  return (
    <article className={cn('glass-flat rise flex min-w-0 flex-col gap-3 rounded-2xl p-4', match && 'border-brand/50 bg-brand/[0.06]')} style={{ '--i': index } as React.CSSProperties}>
      <div className="flex items-start gap-3">
        <ProfileAvatar name={talent.name} avatarUrl={talent.avatar_url} size={44} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold">{talent.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{[talent.course, talent.branch].filter(Boolean).join(' ') || 'Course not added'}</p>
          <p className="truncate text-xs text-muted-foreground">{[talent.graduation_year, talent.city || talent.state].filter(Boolean).join(', ')}</p>
        </div>
        <SmoothButton size="icon-sm" variant="ghost" shape="pill" aria-pressed={saved} aria-label={saved ? `Remove ${talent.name} from saved` : `Save ${talent.name}`} onClick={onToggleSave}>
          {saved ? <BookmarkCheck className="text-brand-ink" aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
        </SmoothButton>
      </div>

      {match ? (
        <div role="note" className="rounded-xl border border-brand/40 bg-brand/10 px-3 py-2">
          <p className="text-[11px] font-extrabold text-brand-ink">AI match, {match.match_score} out of 100</p>
          <p className="mt-0.5 text-xs leading-snug text-foreground/90">{match.reason}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <ScoreRing value={talent.ats_score} label="ATS score" size={52} />
        <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
          <dt className="text-muted-foreground">ATS score</dt>
          <dd className="text-right font-bold">{talent.ats_score}</dd>
          <dt className="text-muted-foreground">CGPA</dt>
          <dd className="text-right font-bold">{talent.cgpa ?? 'Not added'}</dd>
          <dt className="text-muted-foreground">Trust</dt>
          <dd className="text-right font-bold">{talent.trust_score}</dd>
        </dl>
      </div>

      <VerifyMarks talent={talent} />

      <div className="mt-auto flex items-center gap-2 pt-1">
        <Button size="sm" variant="primary" onClick={onOpen} className="flex-1">
          View profile
        </Button>
        {onToggleCompare ? (
          <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold has-[:checked]:border-brand/60 has-[:checked]:bg-brand/10">
            <input type="checkbox" checked={Boolean(comparing)} onChange={onToggleCompare} className="size-3.5 accent-[rgb(var(--brand))]" />
            Compare
          </label>
        ) : null}
      </div>
    </article>
  )
}

export function CandidateDialog({
  talent,
  saved,
  onClose,
  onToggleSave,
  note,
}: {
  talent: Talent | null
  saved: boolean
  onClose: () => void
  onToggleSave: () => void
  note?: React.ReactNode
}) {
  const download = () => {
    if (!talent) return
    saveCsv(`${talent.name.replace(/\s+/g, '_')}_profile.csv`, [
      ['Field', 'Value'],
      ['Name', talent.name],
      ['Email', talent.email],
      ['Course', talent.course],
      ['Branch', talent.branch],
      ['Graduation year', talent.graduation_year],
      ['CGPA', talent.cgpa],
      ['ATS score', talent.ats_score],
      ['Trust score', talent.trust_score],
      ['10th percentage', talent.percentage_10th],
      ['12th percentage', talent.percentage_12th],
      ['City', talent.city],
      ['State', talent.state],
      ['Skills', talent.skills.join('; ')],
      ['Police certificate verified', talent.police_verified ? 'Yes' : 'No'],
      ['Aadhaar verified', talent.aadhaar_verified ? 'Yes' : 'No'],
      ['Degree verified', talent.degree_verified ? 'Yes' : 'No'],
    ])
  }

  const facts = talent
    ? [
        { label: 'Course', value: talent.course },
        { label: 'Branch', value: talent.branch },
        { label: 'CGPA', value: talent.cgpa },
        { label: 'Graduation year', value: talent.graduation_year },
        { label: '10th percentage', value: talent.percentage_10th ? `${talent.percentage_10th}%` : null },
        { label: '12th percentage', value: talent.percentage_12th ? `${talent.percentage_12th}%` : null },
        { label: 'City', value: talent.city },
        { label: 'State', value: talent.state },
      ]
    : []

  return (
    <Dialog
      open={Boolean(talent)}
      onClose={onClose}
      title={talent?.name ?? ''}
      description={talent ? [talent.course, talent.branch, talent.graduation_year].filter(Boolean).join(', ') : undefined}
      size="lg"
      footer={
        talent ? (
          <>
            <SmoothButton size="sm" variant="outline" shape="pill" onClick={onToggleSave}>
              {saved ? <BookmarkCheck aria-hidden="true" /> : <Bookmark aria-hidden="true" />}
              {saved ? 'Saved' : 'Save candidate'}
            </SmoothButton>
            {talent.email ? (
              <>
                <Button href={`mailto:${talent.email}`} size="sm" variant="primary">
                  <Mail className="size-4" aria-hidden="true" />
                  Contact
                </Button>
                <CopyButton value={talent.email} />
              </>
            ) : null}
            <SmoothButton size="sm" variant="ghost" shape="pill" onClick={download}>
              <Download aria-hidden="true" />
              Download CSV
            </SmoothButton>
          </>
        ) : null
      }
    >
      {talent ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-5">
            <ScoreRing value={talent.ats_score} label="ATS score" />
            <div className="min-w-[180px] flex-1">
              <p className="text-sm font-extrabold">ATS score</p>
              <p className="text-xs text-muted-foreground">From the resume this student verified</p>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs font-semibold">
                  <span>Trust score</span>
                  <span className="tabular text-muted-foreground">{talent.trust_score} out of 100</span>
                </div>
                <Meter label="Trust score" value={talent.trust_score} />
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label} className="glass-flat min-w-0 rounded-xl px-3 py-2.5">
                <dt className="text-[11px] font-semibold text-muted-foreground">{fact.label}</dt>
                <dd className="mt-0.5 truncate text-sm font-bold">{fact.value || <span className="font-medium text-muted-foreground">Not added</span>}</dd>
              </div>
            ))}
          </dl>

          {talent.skills.length > 0 ? (
            <div>
              <h4 className="mb-2 text-xs font-extrabold text-foreground/80">Skills</h4>
              <ul className="flex flex-wrap gap-1.5">
                {talent.skills.map((skill) => (
                  <li key={skill} className="rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-ink">
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <h4 className="mb-2 text-xs font-extrabold text-foreground/80">{talent.verified_docs_count} documents verified</h4>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {DOC_TYPES.map((type) => {
                const doc = talent.docs.find((d) => d.type === type)
                return (
                  <li key={type} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <span className="min-w-0 truncate text-sm font-semibold">{docLabel(type)}</span>
                    <StatusBadge status={doc?.status ?? 'not_submitted'} />
                  </li>
                )
              })}
            </ul>
          </div>
          {note}
        </div>
      ) : null}
    </Dialog>
  )
}

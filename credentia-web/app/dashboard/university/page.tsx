'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { CircleCheck, GraduationCap, Shield, Sparkles, TrendingUp, Users } from 'lucide-react'
import AILoader from '@/components/smoothui/components/ai-loader'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { useRegistry } from '@/hooks/use-registry'
import { ScoreRing } from '@/components/dash/analysis-report'
import { VerifyMarks } from '@/components/dash/candidate'
import { DataTable, type Column } from '@/components/dash/data-table'
import { Dialog } from '@/components/dash/dialog'
import { Field, TextInput } from '@/components/dash/form'
import { FolderShelf, type FolderSpec } from '@/components/dash/folder-shelf'
import { LiveBriefing, useLastChange, type BriefingItem } from '@/components/dash/live-briefing'
import { PendingApproval } from '@/components/dash/pending-approval'
import { PinShelf } from '@/components/dash/pin-shelf'
import { ProfileAvatar } from '@/components/dash/profile-avatar'
import { EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel, StatusBadge } from '@/components/dash/kit'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { saveCsv } from '@/lib/csv'
import { DOC_TYPES, docLabel } from '@/lib/documents'
import { formatDateShort } from '@/lib/format'
import type { Talent } from '@/lib/company-talent'

const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0)

export default function UniversityRegistryPage() {
  const params = useSearchParams()
  const { userId, approved, university, students, loading, error, refresh, updateCgpa } = useRegistry()
  const updatedAt = useLastChange(loading ? null : students)
  const [open, setOpen] = React.useState<Talent | null>(null)
  const [cgpa, setCgpa] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [notice, setNotice] = React.useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [briefing, setBriefing] = React.useState<{ open: boolean; busy: boolean; error: string; paragraphs: string[] }>({ open: false, busy: false, error: '', paragraphs: [] })

  const wanted = params?.get('student')
  React.useEffect(() => {
    if (!wanted) return
    const found = students.find((s) => s.id === wanted)
    if (found) setOpen(found)
  }, [wanted, students])

  React.useEffect(() => {
    setCgpa(open?.cgpa ? String(open.cgpa) : '')
    setNotice(null)
  }, [open])

  const stats = React.useMemo(() => {
    const fully = students.filter((s) => s.degree_verified && s.police_verified && s.aadhaar_verified)
    return {
      total: students.length,
      degree: students.filter((s) => s.degree_verified).length,
      police: students.filter((s) => s.police_verified).length,
      fully,
      avgCgpa: avg(students.map((s) => s.cgpa ?? 0).filter(Boolean)),
      avgTrust: Math.round(avg(students.map((s) => s.trust_score))),
    }
  }, [students])

  const courses = React.useMemo(() => Array.from(new Set(students.map((s) => s.course).filter(Boolean))).sort(), [students])
  const years = React.useMemo(() => Array.from(new Set(students.map((s) => s.graduation_year).filter((y): y is number => Boolean(y)))).sort((a, b) => b - a), [students])

  const exportCsv = () =>
    saveCsv(`university_registry_${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Name', 'Email', 'Roll number', 'Course', 'Branch', 'Graduation year', 'CGPA', 'ATS score', 'Trust score', 'Degree verified', 'Police verified', 'Aadhaar verified', 'Verified documents', 'Joined'],
      ...students.map((s) => [s.name, s.email, s.roll_number, s.course, s.branch, s.graduation_year, s.cgpa, s.ats_score, s.trust_score, s.degree_verified ? 'Yes' : 'No', s.police_verified ? 'Yes' : 'No', s.aadhaar_verified ? 'Yes' : 'No', s.verified_docs_count, formatDateShort(s.created_at)]),
    ])

  const saveCgpa = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!open) return
    const value = Number(cgpa)
    if (!Number.isFinite(value) || value < 0 || value > 10) {
      setNotice({ tone: 'error', text: 'Enter a CGPA between 0 and 10.' })
      return
    }
    setSaving(true)
    setNotice(null)
    try {
      await updateCgpa(open.id, value)
      setOpen((prev) => (prev ? { ...prev, cgpa: value } : prev))
      setNotice({ tone: 'success', text: 'CGPA saved.' })
    } catch (err) {
      setNotice({ tone: 'error', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const askBriefing = async () => {
    setBriefing({ open: true, busy: true, error: '', paragraphs: [] })
    try {
      const res = await fetch('/api/university/ai-insights', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'The briefing did not finish.')
      setBriefing({ open: true, busy: false, error: '', paragraphs: data.paragraphs ?? [] })
    } catch (err) {
      setBriefing({ open: true, busy: false, error: (err as Error).message, paragraphs: [] })
    }
  }

  const columns: Column<Talent>[] = [
    {
      key: 'name',
      header: 'Student',
      sortValue: (s) => s.name,
      cell: (s) => (
        <span className="flex min-w-0 items-center gap-3">
          <ProfileAvatar name={s.name} avatarUrl={s.avatar_url} size={36} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{s.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{s.roll_number ? `Roll ${s.roll_number}` : s.email}</span>
          </span>
        </span>
      ),
    },
    { key: 'course', header: 'Course', hideOnMobile: true, sortValue: (s) => s.course, cell: (s) => <span className="text-muted-foreground">{[s.course, s.graduation_year].filter(Boolean).join(', ') || 'Not added'}</span> },
    { key: 'cgpa', header: 'CGPA', align: 'right', sortValue: (s) => s.cgpa ?? 0, cell: (s) => <span className="tabular font-bold">{s.cgpa ?? 'Not added'}</span> },
    { key: 'ats', header: 'ATS', align: 'right', hideOnMobile: true, sortValue: (s) => s.ats_score, cell: (s) => <span className="tabular">{s.ats_score}</span> },
    { key: 'trust', header: 'Trust', align: 'right', hideOnMobile: true, sortValue: (s) => s.trust_score, cell: (s) => <span className="tabular">{s.trust_score}</span> },
    { key: 'docs', header: 'Verified', hideOnMobile: true, cell: (s) => <VerifyMarks talent={s} /> },
    { key: 'joined', header: 'Joined', hideOnMobile: true, sortValue: (s) => s.created_at ?? '', cell: (s) => <span className="text-muted-foreground">{formatDateShort(s.created_at)}</span> },
  ]

  if (loading) return <PageSkeleton metrics={4} panels={2} />
  if (error) return <ErrorState message={error} onRetry={refresh} />
  if (approved === false) return <PendingApproval name={university?.name} />

  const weekAgo = Date.now() - 7 * 86_400_000
  const joined = students.filter((s) => s.created_at && new Date(s.created_at).getTime() > weekAgo)
  const notStarted = students.filter((s) => s.verified_docs_count === 0)
  const noCgpa = students.filter((s) => !s.cgpa)
  const liveItems: BriefingItem[] = []
  if (joined.length > 0) liveItems.push({ id: 'joined', tone: 'good', title: `${joined.length} ${joined.length === 1 ? 'student' : 'students'} joined this week`, detail: 'They appear in the registry as soon as they link their account to your institution.' })
  if (notStarted.length > 0) liveItems.push({ id: 'notstarted', tone: 'alert', title: `${notStarted.length} ${notStarted.length === 1 ? 'student has' : 'students have'} not verified a single document`, detail: 'Open the Not started folder below. A reminder from the department usually moves these quickly.' })
  if (noCgpa.length > 0) liveItems.push({ id: 'cgpa', tone: 'tip', title: `${noCgpa.length} ${noCgpa.length === 1 ? 'student has' : 'students have'} no CGPA on record`, detail: 'Open a student and add the CGPA. Companies filter on it.' })
  if (stats.fully.length > 0) liveItems.push({ id: 'full', tone: 'good', title: `${stats.fully.length} fully verified ${stats.fully.length === 1 ? 'student' : 'students'}`, detail: `${Math.round((stats.fully.length / Math.max(1, stats.total)) * 100)}% of your cohort has degree, police certificate and Aadhaar verified.` })
  if (stats.total > 0 && stats.avgTrust < 50) liveItems.push({ id: 'trust', tone: 'tip', title: `Average trust score is ${stats.avgTrust}`, detail: 'Students with more verified documents score higher and are found more often by companies.' })

  const entry = (s: Talent) => ({
    id: s.id,
    name: s.name,
    kind: 'person' as const,
    meta: [s.course, s.graduation_year].filter(Boolean).join(', '),
    status: { label: `${s.verified_docs_count} verified`, tone: s.verified_docs_count >= 3 ? ('success' as const) : s.verified_docs_count > 0 ? ('warning' as const) : ('neutral' as const) },
    onOpen: () => setOpen(s),
    copyValue: s.email || undefined,
    copyLabel: 'Email',
    details: [
      { label: 'CGPA', value: s.cgpa ? String(s.cgpa) : 'Not added' },
      { label: 'Trust score', value: String(s.trust_score) },
    ],
  })

  const base: Omit<FolderSpec, 'meta'>[] = [
    { id: 'full', label: 'Fully verified', art: 'obsidian', subtitle: 'Degree, police certificate and Aadhaar all verified', entries: stats.fully.map(entry), emptyTitle: 'Nobody yet', emptyHint: 'Students appear here when all three are verified.' },
    { id: 'part', label: 'In progress', art: 'ember', subtitle: 'Some documents verified', entries: students.filter((s) => s.verified_docs_count > 0 && !(s.degree_verified && s.police_verified && s.aadhaar_verified)).map(entry), emptyTitle: 'Nobody yet' },
    { id: 'none', label: 'Not started', art: 'crimson', subtitle: 'No document verified yet', entries: students.filter((s) => s.verified_docs_count === 0).map(entry), emptyTitle: 'Everyone has started', emptyHint: 'Students with no verified document would be listed here.' },
  ]
  const folders: FolderSpec[] = base.map((f) => ({ ...f, meta: f.entries.length === 0 ? 'Empty' : `${f.entries.length} ${f.entries.length === 1 ? 'student' : 'students'}` }))

  return (
    <>
      <PageHeader
        title="Student registry"
        description={`${university?.name ?? 'Your institution'}. Every student linked to you, with their scores and which documents are verified.`}
        actions={
          <>
            <SmoothButton size="sm" variant="outline" shape="pill" onClick={askBriefing} disabled={students.length === 0}>
              <Sparkles aria-hidden="true" />
              AI summary
            </SmoothButton>
            <SmoothButton size="sm" variant="outline" shape="pill" onClick={exportCsv} disabled={students.length === 0}>
              Export CSV
            </SmoothButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Students" icon={<Users />} value={stats.total} detail="Linked to your institution" />
        <Metric index={1} title="Degree verified" icon={<GraduationCap />} value={stats.degree} detail={stats.total ? `${Math.round((stats.degree / stats.total) * 100)}% of students` : 'No students yet'} />
        <Metric index={2} title="Police verified" icon={<Shield />} value={stats.police} detail={stats.total ? `${Math.round((stats.police / stats.total) * 100)}% of students` : 'No students yet'} />
        <Metric index={3} title="Average CGPA" icon={<TrendingUp />} value={Number(stats.avgCgpa.toFixed(1))} format="decimal" detail={`Average trust ${stats.avgTrust}`} />
      </div>

      {students.length > 0 ? <LiveBriefing items={liveItems} updatedAt={updatedAt} className="mt-3" /> : null}

      {students.length === 0 ? (
        <div className="mt-3">
          <Panel>
            <EmptyState icon={<Users />} title="No students are linked to you yet" hint="Students link their account to your institution from their Settings page. They appear here as soon as they do." />
          </Panel>
        </div>
      ) : (
        <>
          <div className="mt-3">
            <Panel index={4} title="Cohort folders" subtitle="Press a folder to open the students inside it">
              <FolderShelf folders={folders} />
            </Panel>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_2fr]">
            {userId ? (
              <PinShelf
                index={5}
                storageKey={`credentia:pins:university:${userId}`}
                title="Pinned students"
                subtitle="Pin the students you follow closely"
                label="Students"
                max={4}
                items={students.slice(0, 60).map((s) => ({ id: s.id, title: s.name, meta: `${[s.course, s.graduation_year].filter(Boolean).join(', ') || 'Course not added'}, ${s.verified_docs_count} verified`, icon: <Users className="size-4" /> }))}
              />
            ) : null}
            <Panel index={6} title="Student directory" subtitle="Search, filter and sort. Press a row to open a student.">
              <DataTable
                label="Students"
                rows={students}
                columns={columns}
                getRowId={(s) => s.id}
                searchText={(s) => `${s.name} ${s.email} ${s.roll_number ?? ''} ${s.course} ${s.branch}`}
                searchPlaceholder="Search by name, email or roll number"
                pageSize={8}
                onRowClick={(s) => setOpen(s)}
                filters={[
                  { id: 'course', label: 'All courses', options: courses.map((c) => ({ value: c, label: c })), predicate: (s, v) => s.course === v },
                  { id: 'year', label: 'All years', options: years.map((y) => ({ value: String(y), label: String(y) })), predicate: (s, v) => String(s.graduation_year) === v },
                  { id: 'docs', label: 'All verification', options: [{ value: 'full', label: 'Fully verified' }, { value: 'part', label: 'In progress' }, { value: 'none', label: 'Not started' }], predicate: (s, v) => (v === 'full' ? s.degree_verified && s.police_verified && s.aadhaar_verified : v === 'none' ? s.verified_docs_count === 0 : s.verified_docs_count > 0 && !(s.degree_verified && s.police_verified && s.aadhaar_verified)) },
                  { id: 'cgpa', label: 'Any CGPA', options: [{ value: '9', label: '9 and above' }, { value: '8', label: '8 to 9' }, { value: '7', label: '7 to 8' }, { value: '0', label: 'Below 7' }], predicate: (s, v) => { const c = s.cgpa ?? 0; return v === '9' ? c >= 9 : v === '8' ? c >= 8 && c < 9 : v === '7' ? c >= 7 && c < 8 : c < 7 } },
                ]}
              />
            </Panel>
          </div>
        </>
      )}

      <Dialog
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open?.name ?? ''}
        description={open ? [open.course, open.branch, open.graduation_year].filter(Boolean).join(', ') : undefined}
        size="lg"
        footer={open?.email ? <CopyButton value={open.email} /> : null}
      >
        {open ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-5">
              <ScoreRing value={open.trust_score} label="Trust score" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-extrabold">Trust score</p>
                <p className="text-xs text-muted-foreground">{open.verified_docs_count} documents verified, ATS score {open.ats_score}</p>
                {open.email ? <p className="mt-1 truncate font-semibold">{open.email}</p> : null}
                {open.roll_number ? <p className="text-xs text-muted-foreground">Roll number {open.roll_number}</p> : null}
              </div>
            </div>

            <form onSubmit={saveCgpa} className="glass-flat rounded-2xl p-4">
              <h4 className="text-sm font-extrabold">Academic record</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">Correct the CGPA when the value the student entered is wrong. The change is recorded.</p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <Field label="CGPA" htmlFor="uni-cgpa" className="w-36">
                  <TextInput id="uni-cgpa" type="number" inputMode="decimal" step="0.01" min={0} max={10} value={cgpa} onChange={(e) => setCgpa(e.target.value)} />
                </Field>
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  {saving ? 'Saving' : 'Save CGPA'}
                </Button>
                {notice ? (
                  <p role={notice.tone === 'error' ? 'alert' : 'status'} className={notice.tone === 'error' ? 'text-sm text-destructive' : 'text-sm font-semibold text-success'}>
                    {notice.text}
                  </p>
                ) : null}
              </div>
            </form>

            <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { label: '10th percentage', value: open.percentage_10th ? `${open.percentage_10th}%` : null },
                { label: '12th percentage', value: open.percentage_12th ? `${open.percentage_12th}%` : null },
                { label: 'City', value: open.city },
                { label: 'State', value: open.state },
              ].map((fact) => (
                <div key={fact.label} className="glass-flat min-w-0 rounded-xl px-3 py-2.5">
                  <dt className="text-[11px] font-semibold text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-0.5 truncate text-sm font-bold">{fact.value || <span className="font-medium text-muted-foreground">Not added</span>}</dd>
                </div>
              ))}
            </dl>

            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {DOC_TYPES.map((type) => (
                <li key={type} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="min-w-0 truncate text-sm font-semibold">{docLabel(type)}</span>
                  <StatusBadge status={open.docs.find((d) => d.type === type)?.status ?? 'not_submitted'} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Dialog>

      <Dialog open={briefing.open} onClose={() => setBriefing((b) => ({ ...b, open: false }))} title="AI summary of your cohort" description="Written from the counts in your registry. It never names a student." size="md">
        {briefing.busy ? (
          <div className="grid place-items-center py-8" role="status">
            <AILoader variant="bar" label="Reading your registry" showElapsed />
          </div>
        ) : briefing.error ? (
          <p role="alert" className="text-sm text-destructive">
            {briefing.error}
          </p>
        ) : (
          <div className="space-y-3 text-sm leading-relaxed">
            {briefing.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
      </Dialog>
    </>
  )
}

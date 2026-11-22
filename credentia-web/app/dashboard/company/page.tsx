'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { BookmarkCheck, ChevronLeft, ChevronRight, CircleCheck, Sparkles, TrendingUp, Users } from 'lucide-react'
import AILoader from '@/components/smoothui/components/ai-loader'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { useTalent } from '@/hooks/use-talent'
import { useSearch } from '@/components/search/search-context'
import { CandidateCard, CandidateDialog, type AiMatch } from '@/components/dash/candidate'
import { Dialog } from '@/components/dash/dialog'
import { Field, SelectInput, TextArea, TextInput } from '@/components/dash/form'
import { FolderShelf, type FolderSpec } from '@/components/dash/folder-shelf'
import { LiveBriefing, useLastChange, type BriefingItem } from '@/components/dash/live-briefing'
import { EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel } from '@/components/dash/kit'
import { SearchBar } from '@/components/ui/search-bar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Talent } from '@/lib/company-talent'

const PAGE_SIZE = 12

const SORTS = [
  { value: 'ats', label: 'ATS score, highest first' },
  { value: 'trust', label: 'Trust score, highest first' },
  { value: 'cgpa', label: 'CGPA, highest first' },
  { value: 'year', label: 'Graduation year, latest first' },
  { value: 'name', label: 'Name, A to Z' },
] as const
type SortKey = (typeof SORTS)[number]['value']

const DOC_FILTERS = [
  { key: 'police_verified', label: 'Police certificate' },
  { key: 'aadhaar_verified', label: 'Aadhaar' },
  { key: 'degree_verified', label: 'Degree' },
] as const

export default function TalentSearchPage() {
  const params = useSearchParams()
  const search = useSearch()
  const { talent, savedIds, byId, loading, error, refresh, toggleSave } = useTalent()
  const updatedAt = useLastChange(loading ? null : talent)

  const [query, setQuery] = React.useState(params?.get('q') ?? '')
  const [atsMin, setAtsMin] = React.useState(0)
  const [cgpaMin, setCgpaMin] = React.useState('')
  const [course, setCourse] = React.useState('all')
  const [year, setYear] = React.useState('all')
  const [docs, setDocs] = React.useState<Record<string, boolean>>({})
  const [sort, setSort] = React.useState<SortKey>('ats')
  const [page, setPage] = React.useState(0)
  const [open, setOpen] = React.useState<Talent | null>(null)
  const [compare, setCompare] = React.useState<string[]>([])
  const [showCompare, setShowCompare] = React.useState(false)
  const [notice, setNotice] = React.useState('')

  const [jobText, setJobText] = React.useState('')
  const [matching, setMatching] = React.useState(false)
  const [matchError, setMatchError] = React.useState('')
  const [matches, setMatches] = React.useState<AiMatch[]>([])

  // A search result can link straight to one candidate.
  const wanted = params?.get('student')
  React.useEffect(() => {
    if (!wanted) return
    const found = byId.get(wanted)
    if (found) setOpen(found)
  }, [wanted, byId])

  const courses = React.useMemo(() => Array.from(new Set(talent.map((t) => t.course).filter(Boolean))).sort(), [talent])
  const years = React.useMemo(() => Array.from(new Set(talent.map((t) => t.graduation_year).filter((y): y is number => Boolean(y)))).sort((a, b) => b - a), [talent])

  const matchById = React.useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches])

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = talent.filter((t) => {
      if (q && !`${t.name} ${t.course} ${t.branch} ${t.city} ${t.state} ${t.skills.join(' ')}`.toLowerCase().includes(q)) return false
      if (t.ats_score < atsMin) return false
      if (cgpaMin && (t.cgpa ?? 0) < Number(cgpaMin)) return false
      if (course !== 'all' && t.course !== course) return false
      if (year !== 'all' && String(t.graduation_year) !== year) return false
      for (const doc of DOC_FILTERS) if (docs[doc.key] && !t[doc.key]) return false
      return true
    })
    const by: Record<SortKey, (a: Talent, b: Talent) => number> = {
      ats: (a, b) => b.ats_score - a.ats_score,
      trust: (a, b) => b.trust_score - a.trust_score,
      cgpa: (a, b) => (b.cgpa ?? 0) - (a.cgpa ?? 0),
      year: (a, b) => (b.graduation_year ?? 0) - (a.graduation_year ?? 0),
      name: (a, b) => a.name.localeCompare(b.name),
    }
    return [...list].sort((a, b) => {
      if (matches.length > 0) {
        const ma = matchById.get(a.id)
        const mb = matchById.get(b.id)
        if (ma && !mb) return -1
        if (!ma && mb) return 1
        if (ma && mb) return mb.match_score - ma.match_score
      }
      return by[sort](a, b)
    })
  }, [talent, query, atsMin, cgpaMin, course, year, docs, sort, matches, matchById])

  React.useEffect(() => setPage(0), [query, atsMin, cgpaMin, course, year, docs, sort, matches])

  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const shown = results.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  const save = async (id: string) => {
    try {
      await toggleSave(id)
      setNotice('')
    } catch (err) {
      setNotice((err as Error).message)
    }
  }

  const findMatches = async () => {
    setMatching(true)
    setMatchError('')
    setMatches([])
    try {
      const res = await fetch('/api/company/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jobText, ids: results.slice(0, 80).map((t) => t.id) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Matching did not finish.')
      setMatches(data.matches ?? [])
      if ((data.matches ?? []).length === 0) setMatchError('Nobody in the current results fits that role. Try loosening the filters.')
    } catch (err) {
      setMatchError((err as Error).message)
    } finally {
      setMatching(false)
    }
  }

  const toggleCompare = (id: string) => setCompare((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev))

  const fully = talent.filter((t) => t.police_verified && t.aadhaar_verified && t.degree_verified)
  const avgAts = talent.length ? Math.round(talent.reduce((sum, t) => sum + t.ats_score, 0) / talent.length) : 0

  const entry = (t: Talent) => ({
    id: t.id,
    name: t.name,
    kind: 'person' as const,
    meta: [t.course, t.graduation_year].filter(Boolean).join(', '),
    status: { label: `${t.verified_docs_count} verified`, tone: t.verified_docs_count >= 3 ? ('success' as const) : t.verified_docs_count > 0 ? ('warning' as const) : ('neutral' as const) },
    onOpen: () => setOpen(t),
    copyValue: t.email || undefined,
    copyLabel: 'Email',
    details: [
      { label: 'ATS score', value: String(t.ats_score) },
      { label: 'Trust score', value: String(t.trust_score) },
      ...(t.cgpa ? [{ label: 'CGPA', value: String(t.cgpa) }] : []),
    ],
  })

  const folderBase: Omit<FolderSpec, 'meta'>[] = [
    { id: 'saved', label: 'Saved', art: 'crimson', subtitle: 'Candidates you bookmarked', entries: talent.filter((t) => savedIds.has(t.id)).map(entry), emptyTitle: 'No saved candidates', emptyHint: 'Press the bookmark on a candidate to keep them here.' },
    { id: 'verified', label: 'Fully verified', art: 'obsidian', subtitle: 'Police, Aadhaar and degree all verified', entries: fully.map(entry), emptyTitle: 'Nobody yet', emptyHint: 'Candidates appear here once all three documents are verified.' },
    { id: 'ats', label: 'ATS 70 and above', art: 'ember', subtitle: 'Strong resumes', entries: talent.filter((t) => t.ats_score >= 70).map(entry), emptyTitle: 'Nobody yet', emptyHint: 'Candidates appear here when their resume scores 70 or more.' },
  ]
  const folders: FolderSpec[] = folderBase.map((folder) => ({ ...folder, meta: folder.entries.length === 0 ? 'Empty' : `${folder.entries.length} ${folder.entries.length === 1 ? 'person' : 'people'}` }))

  const reset = () => {
    setQuery('')
    setAtsMin(0)
    setCgpaMin('')
    setCourse('all')
    setYear('all')
    setDocs({})
    setSort('ats')
  }

  if (loading) return <PageSkeleton metrics={4} panels={2} />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const weekAgo = Date.now() - 7 * 86_400_000
  const fresh = talent.filter((t) => t.created_at && new Date(t.created_at).getTime() > weekAgo)
  const strongUnsaved = fully.filter((t) => t.ats_score >= 70 && !savedIds.has(t.id)).sort((a, b) => b.ats_score - a.ats_score)
  const briefing: BriefingItem[] = []
  if (fresh.length > 0) briefing.push({ id: 'fresh', tone: 'good', title: `${fresh.length} new ${fresh.length === 1 ? 'profile' : 'profiles'} this week`, detail: 'Students who just made their profile public. Sort by trust score to see the best first.' })
  if (strongUnsaved.length > 0) {
    briefing.push({ id: 'strong', tone: 'tip', title: `${strongUnsaved.length} fully verified ${strongUnsaved.length === 1 ? 'student has' : 'students have'} an ATS score of 70 or more and ${strongUnsaved.length === 1 ? 'is' : 'are'} not saved`, detail: `Start with ${strongUnsaved[0].name}, ATS ${strongUnsaved[0].ats_score}.` })
  }
  if (savedIds.size === 0 && talent.length > 0) briefing.push({ id: 'shortlist', tone: 'tip', title: 'Build a shortlist', detail: 'Press the bookmark on a candidate to save them. Saved candidates stay in the Saved folder, with notes.' })
  if (talent.length > 0) briefing.push({ id: 'match', tone: 'tip', title: 'Rank candidates for a role', detail: 'Paste a job description in Match candidates to a role and AI orders the people in your results.' })
  const notFully = talent.length - fully.length
  if (notFully > 0 && talent.length > 0) briefing.push({ id: 'verified', tone: 'alert', title: `${notFully} of ${talent.length} candidates are not fully verified yet`, detail: 'Turn on the document filters to see only students whose police certificate, Aadhaar and degree are verified.' })

  const compared = compare.map((id) => byId.get(id)).filter((t): t is Talent => Boolean(t))

  return (
    <>
      <PageHeader title="Talent search" description="Students who chose to make their profile public, with every score and document status read from their verified files." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Available talent" icon={<Users />} value={talent.length} detail="Public profiles" />
        <Metric index={1} title="Fully verified" icon={<CircleCheck />} value={fully.length} detail="Police, Aadhaar and degree" />
        <Metric index={2} title="Average ATS score" icon={<TrendingUp />} value={avgAts} suffix="out of 100" detail="Across the pool" />
        <Metric index={3} title="Saved" icon={<BookmarkCheck />} value={savedIds.size} detail="Your shortlist" />
      </div>

      <LiveBriefing items={briefing} updatedAt={updatedAt} className="mt-3" />

      <div className="mt-3">
        <Panel index={4} title="Match candidates to a role" subtitle="Describe the role and AI ranks the candidates in your current results">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="job-text" className="sr-only">
                Role description
              </label>
              <TextArea id="job-text" value={jobText} onChange={(e) => setJobText(e.target.value)} maxLength={3000} placeholder="For example: a frontend developer with React and TypeScript, a CGPA above 7.5, graduating in 2026" className="min-h-[88px]" />
            </div>
            <div className="flex gap-2">
              <Button variant="primary" onClick={findMatches} disabled={matching || jobText.trim().length < 8}>
                <Sparkles className="size-4" aria-hidden="true" />
                {matching ? 'Matching' : 'Find matches'}
              </Button>
              {matches.length > 0 ? (
                <Button variant="default" onClick={() => { setMatches([]); setJobText('') }}>
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
          {matching ? (
            <div className="mt-3" role="status">
              <AILoader variant="bar" label="Reading the role and the candidates" showElapsed />
            </div>
          ) : null}
          {matchError ? (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {matchError}
            </p>
          ) : null}
          {matches.length > 0 ? <p className="mt-3 text-xs font-semibold text-muted-foreground">{matches.length} matches, highest first. Each card says why.</p> : null}
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={5} title="Filters">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Search" className="md:col-span-2 xl:col-span-2">
              <SearchBar value={query} onChange={setQuery} placeholder="Name, course, skill or place" onAskAI={(text) => search.open({ query: text })} />
            </Field>
            <Field label={`Minimum ATS score: ${atsMin}`} htmlFor="ats-min">
              <input id="ats-min" type="range" min={0} max={100} step={5} value={atsMin} onChange={(e) => setAtsMin(Number(e.target.value))} className="h-11 w-full accent-[rgb(var(--brand))]" />
            </Field>
            <Field label="Minimum CGPA" htmlFor="cgpa-min">
              <TextInput id="cgpa-min" type="number" inputMode="decimal" min={0} max={10} step={0.1} value={cgpaMin} onChange={(e) => setCgpaMin(e.target.value)} placeholder="For example 7.5" />
            </Field>
            <Field label="Course" htmlFor="f-course">
              <SelectInput id="f-course" value={course} onChange={(e) => setCourse(e.target.value)}>
                <option value="all">All courses</option>
                {courses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Graduation year" htmlFor="f-year">
              <SelectInput id="f-year" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="all">All years</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Sort by" htmlFor="f-sort">
              <SelectInput id="f-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <fieldset className="min-w-0">
              <legend className="mb-1.5 text-xs font-bold text-foreground/85">Must be verified</legend>
              <div className="flex flex-wrap gap-1.5">
                {DOC_FILTERS.map((doc) => (
                  <label
                    key={doc.key}
                    className={cn('inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition-colors', docs[doc.key] ? 'border-brand/60 bg-brand/15 text-brand-ink' : 'border-white/10 text-foreground/80 hover:bg-white/[0.06]')}
                  >
                    <input type="checkbox" className="sr-only" checked={Boolean(docs[doc.key])} onChange={(e) => setDocs((prev) => ({ ...prev, [doc.key]: e.target.checked }))} />
                    {doc.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
            <p className="text-xs font-semibold text-muted-foreground" aria-live="polite">
              {results.length} {results.length === 1 ? 'candidate' : 'candidates'} found
            </p>
            <SmoothButton size="sm" variant="ghost" shape="pill" onClick={reset}>
              Reset filters
            </SmoothButton>
          </div>
          {notice ? (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {notice}
            </p>
          ) : null}
        </Panel>
      </div>

      <div className="mt-3">
        {results.length === 0 ? (
          <Panel>
            <EmptyState icon={<Users />} title={talent.length === 0 ? 'No public profiles yet' : 'No candidate matches these filters'} hint={talent.length === 0 ? 'Students appear here once they make their profile public.' : 'Loosen a filter or clear the search.'} action={talent.length > 0 ? <Button variant="default" size="sm" onClick={reset}>Reset filters</Button> : undefined} />
          </Panel>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((t, i) => (
                <li key={t.id} className="min-w-0">
                  <CandidateCard talent={t} index={i} saved={savedIds.has(t.id)} match={matchById.get(t.id)} comparing={compare.includes(t.id)} onOpen={() => setOpen(t)} onToggleSave={() => void save(t.id)} onToggleCompare={() => toggleCompare(t.id)} />
                </li>
              ))}
            </ul>
            {pageCount > 1 ? (
              <nav className="mt-4 flex items-center justify-center gap-3" aria-label="Pages of candidates">
                <SmoothButton size="sm" variant="outline" shape="pill" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous page">
                  <ChevronLeft aria-hidden="true" />
                  Previous
                </SmoothButton>
                <span className="text-xs font-semibold text-muted-foreground">
                  Page {current + 1} of {pageCount}
                </span>
                <SmoothButton size="sm" variant="outline" shape="pill" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)} aria-label="Next page">
                  Next
                  <ChevronRight aria-hidden="true" />
                </SmoothButton>
              </nav>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-3">
        <Panel index={6} title="Shortlists" subtitle="Press a folder to open the people inside it">
          <FolderShelf folders={folders} />
        </Panel>
      </div>

      <CandidateDialog talent={open} saved={open ? savedIds.has(open.id) : false} onClose={() => setOpen(null)} onToggleSave={() => open && void save(open.id)} />

      {compare.length > 0 ? (
        <div className="fixed inset-x-0 bottom-[92px] z-[55] flex justify-center px-4 lg:bottom-8">
          <div className="glass-strong flex items-center gap-3 rounded-2xl py-1.5 pl-5 pr-1.5">
            <p className="text-sm font-bold">
              {compare.length} of 3 selected
            </p>
            <Button size="sm" variant="primary" disabled={compare.length < 2} onClick={() => setShowCompare(true)}>
              Compare
            </Button>
            <SmoothButton size="sm" variant="ghost" shape="pill" onClick={() => setCompare([])}>
              Clear
            </SmoothButton>
          </div>
        </div>
      ) : null}

      <Dialog open={showCompare} onClose={() => setShowCompare(false)} title="Compare candidates" description="Side by side, from their verified records" size="lg">
        <div className="overflow-x-auto scrollbar-thin" data-lenis-prevent>
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr>
                <th scope="col" className="w-36 py-2 pr-3 text-left text-xs font-semibold text-muted-foreground">
                  Measure
                </th>
                {compared.map((t) => (
                  <th key={t.id} scope="col" className="px-3 py-2 text-left text-sm font-extrabold">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {[
                { label: 'Course', value: (t: Talent) => [t.course, t.branch].filter(Boolean).join(' ') || 'Not added' },
                { label: 'Graduation year', value: (t: Talent) => t.graduation_year ?? 'Not added' },
                { label: 'ATS score', value: (t: Talent) => t.ats_score },
                { label: 'Trust score', value: (t: Talent) => t.trust_score },
                { label: 'CGPA', value: (t: Talent) => t.cgpa ?? 'Not added' },
                { label: '10th percentage', value: (t: Talent) => (t.percentage_10th ? `${t.percentage_10th}%` : 'Not added') },
                { label: '12th percentage', value: (t: Talent) => (t.percentage_12th ? `${t.percentage_12th}%` : 'Not added') },
                { label: 'Police certificate', value: (t: Talent) => (t.police_verified ? 'Verified' : 'Not verified') },
                { label: 'Aadhaar', value: (t: Talent) => (t.aadhaar_verified ? 'Verified' : 'Not verified') },
                { label: 'Degree', value: (t: Talent) => (t.degree_verified ? 'Verified' : 'Not verified') },
                { label: 'Documents verified', value: (t: Talent) => t.verified_docs_count },
              ].map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="py-2.5 pr-3 text-left text-xs font-semibold text-muted-foreground">
                    {row.label}
                  </th>
                  {compared.map((t) => (
                    <td key={t.id} className="px-3 py-2.5 font-semibold">
                      {row.value(t)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Dialog>
    </>
  )
}

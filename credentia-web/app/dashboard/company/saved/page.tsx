'use client'

import * as React from 'react'
import { Bookmark, BookmarkCheck, Mail, NotebookPen, Trash2, Users } from 'lucide-react'
import { useTalent } from '@/hooks/use-talent'
import { CandidateDialog, VerifyMarks } from '@/components/dash/candidate'
import { DataTable, type Column } from '@/components/dash/data-table'
import { Dialog } from '@/components/dash/dialog'
import { TextArea } from '@/components/dash/form'
import { FolderShelf } from '@/components/dash/folder-shelf'
import { PinShelf } from '@/components/dash/pin-shelf'
import { ProfileAvatar } from '@/components/dash/profile-avatar'
import { EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel } from '@/components/dash/kit'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { Button } from '@/components/ui/button'
import { saveCsv } from '@/lib/csv'
import { formatDateShort } from '@/lib/format'
import type { Talent } from '@/lib/company-talent'

interface Row {
  id: string
  saved_at: string
  notes: string | null
  talent: Talent | null
}

export default function SavedCandidatesPage() {
  const { userId, talent, saved, savedIds, byId, loading, error, refresh, toggleSave, saveNote } = useTalent()
  const [open, setOpen] = React.useState<Talent | null>(null)
  const [noting, setNoting] = React.useState<Row | null>(null)
  const [draft, setDraft] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState('')

  const rows: Row[] = React.useMemo(() => saved.map((s) => ({ id: s.student_id, saved_at: s.created_at, notes: s.notes, talent: byId.get(s.student_id) ?? null })), [saved, byId])
  const visible = rows.filter((r) => r.talent)
  const hidden = rows.length - visible.length

  const remove = async (id: string) => {
    setNotice('')
    try {
      await toggleSave(id)
    } catch (err) {
      setNotice((err as Error).message)
    }
  }

  const submitNote = async () => {
    if (!noting) return
    setBusy(true)
    try {
      await saveNote(noting.id, draft)
      setNoting(null)
    } catch (err) {
      setNotice((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const exportCsv = () =>
    saveCsv('saved_candidates.csv', [
      ['Name', 'Email', 'Course', 'Graduation year', 'CGPA', 'ATS score', 'Trust score', 'Verified documents', 'Saved on', 'Note'],
      ...visible.map((r) => [r.talent!.name, r.talent!.email, [r.talent!.course, r.talent!.branch].filter(Boolean).join(' '), r.talent!.graduation_year, r.talent!.cgpa, r.talent!.ats_score, r.talent!.trust_score, r.talent!.verified_docs_count, formatDateShort(r.saved_at), r.notes]),
    ])

  const columns: Column<Row>[] = [
    {
      key: 'name',
      header: 'Candidate',
      sortValue: (r) => r.talent?.name ?? '',
      cell: (r) => (
        <span className="flex min-w-0 items-center gap-3">
          <ProfileAvatar name={r.talent!.name} avatarUrl={r.talent!.avatar_url} size={36} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{r.talent!.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{[r.talent!.course, r.talent!.graduation_year].filter(Boolean).join(', ') || 'Course not added'}</span>
          </span>
        </span>
      ),
    },
    { key: 'ats', header: 'ATS', align: 'right', sortValue: (r) => r.talent?.ats_score ?? 0, cell: (r) => <span className="tabular font-bold">{r.talent!.ats_score}</span> },
    { key: 'trust', header: 'Trust', align: 'right', hideOnMobile: true, sortValue: (r) => r.talent?.trust_score ?? 0, cell: (r) => <span className="tabular">{r.talent!.trust_score}</span> },
    { key: 'docs', header: 'Verified', hideOnMobile: true, cell: (r) => <VerifyMarks talent={r.talent!} /> },
    { key: 'note', header: 'Note', hideOnMobile: true, cell: (r) => (r.notes ? <span className="line-clamp-1 max-w-[220px] text-muted-foreground">{r.notes}</span> : <span className="text-muted-foreground">None</span>) },
    { key: 'saved', header: 'Saved', hideOnMobile: true, sortValue: (r) => r.saved_at, cell: (r) => <span className="text-muted-foreground">{formatDateShort(r.saved_at)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (r) => (
        <span className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <SmoothButton size="icon-sm" variant="ghost" shape="pill" aria-label={`Write a note about ${r.talent!.name}`} onClick={() => { setDraft(r.notes ?? ''); setNoting(r) }}>
            <NotebookPen aria-hidden="true" />
          </SmoothButton>
          {r.talent!.email ? (
            <SmoothButton size="icon-sm" variant="ghost" shape="pill" aria-label={`Email ${r.talent!.name}`} onClick={() => (window.location.href = `mailto:${r.talent!.email}`)}>
              <Mail aria-hidden="true" />
            </SmoothButton>
          ) : null}
          <SmoothButton size="icon-sm" variant="ghost" shape="pill" aria-label={`Remove ${r.talent!.name} from saved`} onClick={() => void remove(r.id)}>
            <Trash2 aria-hidden="true" />
          </SmoothButton>
        </span>
      ),
    },
  ]

  if (loading) return <PageSkeleton metrics={3} panels={1} />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const folder = {
    id: 'saved',
    label: 'Saved',
    art: 'crimson' as const,
    subtitle: 'Your shortlist',
    meta: visible.length === 0 ? 'Empty' : `${visible.length} ${visible.length === 1 ? 'person' : 'people'}`,
    emptyTitle: 'No saved candidates',
    emptyHint: 'Save candidates from Talent search.',
    entries: visible.map((r) => ({
      id: r.id,
      name: r.talent!.name,
      kind: 'person' as const,
      meta: [r.talent!.course, r.talent!.graduation_year].filter(Boolean).join(', '),
      date: formatDateShort(r.saved_at),
      timestamp: new Date(r.saved_at).getTime(),
      status: { label: `${r.talent!.verified_docs_count} verified`, tone: r.talent!.verified_docs_count >= 3 ? ('success' as const) : r.talent!.verified_docs_count > 0 ? ('warning' as const) : ('neutral' as const) },
      onOpen: () => setOpen(r.talent),
      copyValue: r.talent!.email || undefined,
      copyLabel: 'Email',
    })),
    actions: (
      <Button href="/dashboard/company" size="sm" variant="primary">
        Find candidates
      </Button>
    ),
  }

  return (
    <>
      <PageHeader
        title="Saved candidates"
        description="Your shortlist, with notes only you can see."
        actions={
          <SmoothButton size="sm" variant="outline" shape="pill" onClick={exportCsv} disabled={visible.length === 0}>
            Export CSV
          </SmoothButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Metric index={0} emphasis title="Saved" icon={<BookmarkCheck />} value={visible.length} detail="On your shortlist" />
        <Metric index={1} title="With a note" icon={<NotebookPen />} value={rows.filter((r) => r.notes).length} detail="Your own notes" />
        <Metric index={2} title="In the talent pool" icon={<Users />} value={talent.length} detail="Public profiles" />
      </div>

      {hidden > 0 ? (
        <p role="status" className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-muted-foreground">
          {hidden} saved {hidden === 1 ? 'candidate has' : 'candidates have'} made their profile private, so {hidden === 1 ? 'they are' : 'they are'} hidden here.
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.4fr]">
        <Panel index={3} title="Shortlist folder" subtitle="Press the folder to open it">
          <FolderShelf folders={[folder]} />
        </Panel>
        {userId && visible.length > 0 ? (
          <PinShelf
            index={4}
            storageKey={`credentia:pins:company:${userId}`}
            title="Pinned candidates"
            subtitle="Pin the people you want at the top"
            label="Candidates"
            max={4}
            items={visible.map((r) => ({ id: r.id, title: r.talent!.name, meta: `ATS ${r.talent!.ats_score}, ${r.talent!.verified_docs_count} verified`, icon: <Bookmark className="size-4" /> }))}
          />
        ) : (
          <Panel index={4} title="Pinned candidates">
            <EmptyState icon={<Bookmark />} title="Nothing to pin yet" hint="Saved candidates appear here, ready to pin." />
          </Panel>
        )}
      </div>

      <div className="mt-3">
        <Panel index={5} title="All saved candidates">
          {notice ? (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {notice}
            </p>
          ) : null}
          {visible.length === 0 ? (
            <EmptyState icon={<Users />} title="No saved candidates yet" hint="Press the bookmark on a candidate in Talent search to save them here." action={<Button href="/dashboard/company" variant="primary" size="sm">Open talent search</Button>} />
          ) : (
            <DataTable
              label="Saved candidates"
              rows={visible}
              columns={columns}
              getRowId={(r) => r.id}
              searchText={(r) => `${r.talent!.name} ${r.talent!.course} ${r.talent!.branch} ${r.notes ?? ''}`}
              searchPlaceholder="Search saved candidates"
              pageSize={8}
              onRowClick={(r) => setOpen(r.talent)}
            />
          )}
        </Panel>
      </div>

      <CandidateDialog talent={open} saved={open ? savedIds.has(open.id) : false} onClose={() => setOpen(null)} onToggleSave={() => open && void remove(open.id)} />

      <Dialog
        open={Boolean(noting)}
        onClose={() => setNoting(null)}
        title={noting?.talent ? `Note about ${noting.talent.name}` : 'Note'}
        description="Only your company can see this note."
        size="sm"
        footer={
          <>
            <Button variant="default" size="sm" onClick={() => setNoting(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={submitNote} disabled={busy}>
              {busy ? 'Saving' : 'Save note'}
            </Button>
          </>
        }
      >
        <label htmlFor="saved-note" className="sr-only">
          Note
        </label>
        <TextArea id="saved-note" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} placeholder="Why you saved them, what to ask next" autoFocus />
      </Dialog>
    </>
  )
}

'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CircleCheck, Clock3, ExternalLink, FileText, ShieldCheck, ShieldX, User } from 'lucide-react'
import AILoader from '@/components/smoothui/components/ai-loader'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { useAdminResource } from '@/hooks/use-admin'
import { AnalysisReport } from '@/components/dash/analysis-report'
import { ConfirmDialog } from '@/components/dash/confirm-dialog'
import { DataTable, type Column } from '@/components/dash/data-table'
import { Dialog } from '@/components/dash/dialog'
import { FolderShelf, type FolderSpec } from '@/components/dash/folder-shelf'
import { Field, TextArea } from '@/components/dash/form'
import { EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel, StatusBadge } from '@/components/dash/kit'
import { adminPost } from '@/lib/admin-client'
import { saveCsv } from '@/lib/csv'
import { DOC_TYPES, docLabel } from '@/lib/documents'
import { formatDateShort, formatDateTime, formatNumber, timeAgo } from '@/lib/format'
import { isPendingStatus, isRejectedStatus, isVerifiedStatus, statusInfo } from '@/lib/status'
import type { AdminVerification } from '@/lib/admin-types'

type Decision = 'admin_verified' | 'rejected' | 'needs_review'

const group = (status: string) => (isVerifiedStatus(status) ? 'verified' : isPendingStatus(status) ? 'review' : isRejectedStatus(status) ? 'rejected' : 'other')

/** One document in full: what the AI read, the file itself, and the decision. */
function ReviewDialog({ id, summary, onClose, onDecided }: { id: string | null; summary?: AdminVerification; onClose: () => void; onDecided: (id: string, status: Decision, reason?: string) => void }) {
  const [detail, setDetail] = React.useState<AdminVerification | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [loadError, setLoadError] = React.useState('')
  const [rejecting, setRejecting] = React.useState(false)
  const [reason, setReason] = React.useState('')
  const [busy, setBusy] = React.useState<Decision | null>(null)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    setDetail(null)
    setLoadError('')
    setRejecting(false)
    setReason('')
    setError('')
    if (!id) return
    let alive = true
    setLoading(true)
    fetch(`/api/admin/verifications?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(body.error || 'The document could not be loaded.')
        if (alive) setDetail(body.row as AdminVerification)
      })
      .catch((err) => alive && setLoadError((err as Error).message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  const row = detail ?? summary ?? null

  const decide = async (status: Decision) => {
    if (!id) return
    if (status === 'rejected' && !reason.trim()) {
      setError('Write a reason, so the student knows what to fix.')
      return
    }
    setBusy(status)
    setError('')
    try {
      await adminPost('/api/admin/update-verification', { verificationId: id, status, reason: status === 'rejected' ? reason.trim() : undefined })
      onDecided(id, status, status === 'rejected' ? reason.trim() : undefined)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const status = row?.status ?? ''

  return (
    <Dialog open={Boolean(id)} onClose={onClose} title={row ? docLabel(row.type) : 'Document'} description={row ? `${row.student_name}${row.student_email ? `, ${row.student_email}` : ''}` : undefined} size="lg">
      {!row ? (
        loadError ? (
          <p role="alert" className="text-sm text-destructive">
            {loadError}
          </p>
        ) : (
          <div className="grid place-items-center py-8" role="status">
            <AILoader variant="bar" label="Opening the document" />
          </div>
        )
      ) : (
        <div className="space-y-5">
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { label: 'Status', value: <StatusBadge status={row.status} /> },
              { label: 'AI confidence', value: row.ai_confidence ? `${row.ai_confidence}%` : 'No AI result' },
              { label: 'Last updated', value: formatDateTime(row.updated_at) || 'Not recorded' },
              { label: 'Reviewed by an admin', value: row.admin_reviewed_at ? formatDateTime(row.admin_reviewed_at) : 'Not yet' },
            ].map((fact) => (
              <div key={fact.label} className="glass-flat min-w-0 rounded-xl px-3 py-2.5">
                <dt className="text-[11px] font-semibold text-muted-foreground">{fact.label}</dt>
                <dd className="mt-1 truncate text-sm font-bold">{fact.value}</dd>
              </div>
            ))}
          </dl>

          {row.rejection_reason && isRejectedStatus(status) ? (
            <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm">
              <span className="font-bold">Reason given to the student: </span>
              {row.rejection_reason}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {row.document_url ? (
              <a href={row.document_url} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-xs font-bold transition-colors hover:border-brand/50 hover:bg-brand/10">
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Open the document
              </a>
            ) : (
              <span className="text-xs text-muted-foreground">No file was uploaded for this document.</span>
            )}
            {row.external_link ? (
              <a href={row.external_link} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-xs font-bold transition-colors hover:border-brand/50 hover:bg-brand/10">
                <ExternalLink className="size-3.5" aria-hidden="true" />
                Open the shared link
              </a>
            ) : null}
            <Link href={`/dashboard/admin/users?q=${encodeURIComponent(row.student_email || row.student_name)}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3.5 text-xs font-bold transition-colors hover:border-brand/50 hover:bg-brand/10">
              <User className="size-3.5" aria-hidden="true" />
              Open the student
            </Link>
          </div>

          {loading && !detail ? (
            <div className="grid place-items-center py-4" role="status">
              <AILoader variant="bar" label="Loading what the AI read" />
            </div>
          ) : detail ? (
            <div>
              <h3 className="mb-3 text-sm font-extrabold">What the AI read</h3>
              <AnalysisReport type={row.type} result={detail.ai_result} confidence={row.ai_confidence} />
            </div>
          ) : loadError ? (
            <p role="alert" className="text-sm text-destructive">
              {loadError}
            </p>
          ) : null}

          <section className="glass-flat rounded-2xl p-4" aria-label="Decision">
            <h3 className="text-sm font-extrabold">Your decision</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">The student is told, their trust score updates, and the decision is written to the audit log.</p>

            {rejecting ? (
              <div className="mt-3 space-y-3">
                <Field label="Reason for rejecting" htmlFor="reject-reason" hint="The student sees this, so say what to fix." error={error && !reason.trim() ? error : undefined}>
                  <TextArea id="reject-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="For example, the photo is blurred and the name cannot be read." />
                </Field>
                <div className="flex flex-wrap items-center gap-2">
                  <SmoothButton variant="solid" color="destructive" shape="pill" size="sm" loading={busy === 'rejected'} onClick={() => decide('rejected')}>
                    <ShieldX aria-hidden="true" />
                    Confirm rejection
                  </SmoothButton>
                  <SmoothButton variant="ghost" shape="pill" size="sm" disabled={busy !== null} onClick={() => setRejecting(false)}>
                    Cancel
                  </SmoothButton>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SmoothButton variant="solid" color="green" shape="pill" size="sm" loading={busy === 'admin_verified'} disabled={busy !== null || status === 'admin_verified'} onClick={() => decide('admin_verified')}>
                  <CircleCheck aria-hidden="true" />
                  {status === 'admin_verified' ? 'Approved' : 'Approve'}
                </SmoothButton>
                <SmoothButton variant="outline" shape="pill" size="sm" loading={busy === 'needs_review'} disabled={busy !== null || status === 'needs_review'} onClick={() => decide('needs_review')}>
                  <Clock3 aria-hidden="true" />
                  Send back to review
                </SmoothButton>
                <SmoothButton variant="soft" color="destructive" shape="pill" size="sm" disabled={busy !== null || isRejectedStatus(status)} onClick={() => setRejecting(true)}>
                  <ShieldX aria-hidden="true" />
                  {isRejectedStatus(status) ? 'Rejected' : 'Reject'}
                </SmoothButton>
              </div>
            )}
            {error && (!rejecting || reason.trim()) ? (
              <p role="alert" className="mt-3 text-sm font-semibold text-destructive">
                {error}
              </p>
            ) : null}
          </section>
        </div>
      )}
    </Dialog>
  )
}

export default function AdminVerificationsPage() {
  const params = useSearchParams()
  const { data, setData, loading, error, refresh } = useAdminResource<{ rows: AdminVerification[] }>('/api/admin/verifications', { tables: ['verifications'] })
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [bulk, setBulk] = React.useState<'approve' | 'reject' | null>(null)
  const [bulkReason, setBulkReason] = React.useState('')
  const [bulkBusy, setBulkBusy] = React.useState(false)
  const [bulkError, setBulkError] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [shown, setShown] = React.useState(20)

  const rows = React.useMemo(() => data?.rows ?? [], [data])
  const wanted = params?.get('verification')
  React.useEffect(() => {
    if (wanted) setOpenId(wanted)
  }, [wanted])

  React.useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const counts = React.useMemo(() => {
    const c = { verified: 0, review: 0, rejected: 0 }
    for (const row of rows) {
      const g = group(row.status)
      if (g === 'verified') c.verified += 1
      else if (g === 'review') c.review += 1
      else if (g === 'rejected') c.rejected += 1
    }
    return c
  }, [rows])

  // The oldest first, so the document that has waited longest comes first.
  const queue = React.useMemo(() => rows.filter((row) => group(row.status) === 'review').sort((a, b) => (a.updated_at ?? '').localeCompare(b.updated_at ?? '')), [rows])
  const queueShown = queue.slice(0, shown)
  const allShownSelected = queueShown.length > 0 && queueShown.every((row) => selected.has(row.id))

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Drop ids that are no longer waiting, for example after another admin decided them.
  React.useEffect(() => {
    setSelected((prev) => {
      const waiting = new Set(queue.map((row) => row.id))
      const next = new Set(Array.from(prev).filter((id) => waiting.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [queue])

  const applyLocal = (ids: string[], status: Decision, reason?: string) =>
    setData((prev) => (prev ? { rows: prev.rows.map((row) => (ids.includes(row.id) ? { ...row, status, rejection_reason: status === 'rejected' ? reason ?? null : null, admin_reviewed_at: new Date().toISOString() } : row)) } : prev))

  const onDecided = (id: string, status: Decision, reason?: string) => {
    applyLocal([id], status, reason)
    setOpenId(null)
    setNotice(status === 'admin_verified' ? 'Document approved. The student has been told.' : status === 'rejected' ? 'Document rejected. The student has been told why.' : 'Document sent back to review.')
    void refresh()
  }

  const runBulk = async () => {
    if (!bulk) return
    const ids = Array.from(selected)
    if (bulk === 'reject' && !bulkReason.trim()) {
      setBulkError('Write a reason, so the students know what to fix.')
      return
    }
    setBulkBusy(true)
    setBulkError('')
    try {
      await adminPost('/api/admin/bulk-approve', { verificationIds: ids, action: bulk, reason: bulk === 'reject' ? bulkReason.trim() : undefined })
      applyLocal(ids, bulk === 'approve' ? 'admin_verified' : 'rejected', bulkReason.trim())
      setNotice(`${formatNumber(ids.length)} ${ids.length === 1 ? 'document' : 'documents'} ${bulk === 'approve' ? 'approved' : 'rejected'}. The students have been told.`)
      setSelected(new Set())
      setBulk(null)
      setBulkReason('')
      void refresh()
    } catch (err) {
      setBulkError((err as Error).message)
    } finally {
      setBulkBusy(false)
    }
  }

  const exportCsv = () =>
    saveCsv(`verifications_${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Student', 'Email', 'Document', 'Status', 'AI confidence', 'Last updated', 'Reviewed by an admin', 'Rejection reason'],
      ...rows.map((r) => [r.student_name, r.student_email, docLabel(r.type), statusInfo(r.status).label, r.ai_confidence ?? '', formatDateShort(r.updated_at), formatDateShort(r.admin_reviewed_at), r.rejection_reason ?? '']),
    ])

  const columns: Column<AdminVerification>[] = [
    {
      key: 'student',
      header: 'Student',
      sortValue: (r) => r.student_name,
      cell: (r) => (
        <button type="button" onClick={() => setOpenId(r.id)} className="block min-w-0 max-w-[16rem] text-left">
          <span className="block truncate text-sm font-bold">{r.student_name}</span>
          <span className="block truncate text-xs text-muted-foreground">{r.student_email}</span>
        </button>
      ),
    },
    { key: 'type', header: 'Document', sortValue: (r) => docLabel(r.type), cell: (r) => docLabel(r.type) },
    { key: 'status', header: 'Status', sortValue: (r) => statusInfo(r.status).label, cell: (r) => <StatusBadge status={r.status} /> },
    { key: 'confidence', header: 'AI confidence', align: 'right', hideOnMobile: true, sortValue: (r) => r.ai_confidence ?? 0, cell: (r) => <span className="tabular">{r.ai_confidence ? `${r.ai_confidence}%` : 'None'}</span> },
    { key: 'updated', header: 'Updated', hideOnMobile: true, sortValue: (r) => r.updated_at ?? '', cell: (r) => <span className="text-muted-foreground">{timeAgo(r.updated_at)}</span> },
  ]

  if (loading) return <PageSkeleton metrics={4} panels={2} />
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />

  const entry = (row: AdminVerification) => ({
    id: row.id,
    name: `${row.student_name}, ${docLabel(row.type)}`,
    kind: 'doc' as const,
    meta: row.ai_confidence ? `AI confidence ${row.ai_confidence}%` : 'No AI result',
    date: formatDateShort(row.updated_at),
    timestamp: row.updated_at ? new Date(row.updated_at).getTime() : 0,
    status: statusInfo(row.status),
    onOpen: () => setOpenId(row.id),
    copyValue: row.student_email || undefined,
    copyLabel: 'Student email',
  })
  const FOLDER_LIMIT = 60
  const base: Omit<FolderSpec, 'meta'>[] = [
    { id: 'review', label: 'Needs review', art: 'crimson', subtitle: 'Waiting for an admin', entries: queue.slice(0, FOLDER_LIMIT).map(entry), emptyTitle: 'Nothing is waiting', emptyHint: 'Documents that need a person appear here.' },
    { id: 'verified', label: 'Verified', art: 'obsidian', subtitle: 'Approved by the AI or by an admin', entries: rows.filter((r) => group(r.status) === 'verified').slice(0, FOLDER_LIMIT).map(entry), emptyTitle: 'No verified documents yet' },
    { id: 'rejected', label: 'Rejected', art: 'ember', subtitle: 'Sent back to the student', entries: rows.filter((r) => group(r.status) === 'rejected').slice(0, FOLDER_LIMIT).map(entry), emptyTitle: 'No rejected documents' },
  ]
  const totals: Record<string, number> = { review: counts.review, verified: counts.verified, rejected: counts.rejected }
  const folders: FolderSpec[] = base.map((f) => ({ ...f, meta: totals[f.id] === 0 ? 'Empty' : `${formatNumber(totals[f.id])} ${totals[f.id] === 1 ? 'document' : 'documents'}` }))

  const summary = openId ? rows.find((r) => r.id === openId) : undefined

  return (
    <>
      <PageHeader
        title="Verifications"
        description="Every submitted document. Review the ones that need a person, and change a decision when it was wrong."
        actions={
          <SmoothButton size="sm" variant="outline" shape="pill" onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </SmoothButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Submitted" icon={<FileText />} value={rows.length} detail="Documents on the platform" />
        <Metric index={1} title="Verified" icon={<ShieldCheck />} value={counts.verified} detail={rows.length ? `${Math.round((counts.verified / rows.length) * 100)}% of submitted` : 'Nothing yet'} />
        <Metric index={2} title="Needs review" icon={<Clock3 />} value={counts.review} detail="Waiting for an admin" />
        <Metric index={3} title="Rejected" icon={<ShieldX />} value={counts.rejected} detail="Sent back to students" />
      </div>

      {notice ? (
        <p role="status" className="mt-3 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2.5 text-sm font-semibold text-success">
          {notice}
        </p>
      ) : null}

      <div className="mt-3">
        <Panel
          index={4}
          title="Needs a decision"
          subtitle="The document that has waited longest comes first. Select several to decide them together."
          action={
            selected.size > 0 ? (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Decide the selected documents">
                <span className="tabular text-xs font-bold text-muted-foreground">{formatNumber(selected.size)} selected</span>
                <SmoothButton size="xs" variant="solid" color="green" shape="pill" onClick={() => setBulk('approve')}>
                  Approve selected
                </SmoothButton>
                <SmoothButton size="xs" variant="soft" color="destructive" shape="pill" onClick={() => setBulk('reject')}>
                  Reject selected
                </SmoothButton>
                <SmoothButton size="xs" variant="ghost" shape="pill" onClick={() => setSelected(new Set())}>
                  Clear
                </SmoothButton>
              </div>
            ) : undefined
          }
        >
          {queue.length === 0 ? (
            <EmptyState icon={<ShieldCheck />} title="Nothing is waiting for a decision" hint="Documents the AI is unsure about, and documents that always need a person, appear here." />
          ) : (
            <>
              <label className="mb-2 flex w-fit cursor-pointer items-center gap-2 text-xs font-bold text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-4 cursor-pointer accent-brand"
                  checked={allShownSelected}
                  onChange={() => setSelected((prev) => (allShownSelected ? new Set(Array.from(prev).filter((id) => !queueShown.some((r) => r.id === id))) : new Set([...Array.from(prev), ...queueShown.map((r) => r.id)])))}
                />
                Select all shown
              </label>
              <ul className="grid grid-cols-1 gap-2">
                {queueShown.map((row) => (
                  <li key={row.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <input type="checkbox" className="size-4 shrink-0 cursor-pointer accent-brand" checked={selected.has(row.id)} onChange={() => toggle(row.id)} aria-label={`Select ${row.student_name}, ${docLabel(row.type)}`} />
                    <button type="button" onClick={() => setOpenId(row.id)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-bold">{row.student_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {docLabel(row.type)}, {row.ai_confidence ? `AI confidence ${row.ai_confidence}%` : 'no AI result'}, waiting {timeAgo(row.updated_at).replace(' ago', '')}
                      </span>
                    </button>
                    <StatusBadge status={row.status} className="hidden sm:inline-flex" />
                    <SmoothButton size="xs" variant="soft" shape="pill" onClick={() => setOpenId(row.id)}>
                      Review
                    </SmoothButton>
                  </li>
                ))}
              </ul>
              {queue.length > shown ? (
                <div className="mt-3 flex justify-center">
                  <SmoothButton size="sm" variant="outline" shape="pill" onClick={() => setShown((n) => n + 20)}>
                    Show more ({formatNumber(queue.length - shown)} left)
                  </SmoothButton>
                </div>
              ) : null}
            </>
          )}
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={5} title="Document folders" subtitle="Press a folder to open the documents inside it">
          <FolderShelf folders={folders} />
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={6} title="All documents" subtitle="Search, filter and sort. Press a row to open the document.">
          <DataTable
            label="Documents"
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            searchText={(r) => `${r.student_name} ${r.student_email} ${docLabel(r.type)} ${statusInfo(r.status).label}`}
            searchPlaceholder="Search by student, email or document"
            pageSize={10}
            onRowClick={(r) => setOpenId(r.id)}
            emptyTitle="No documents have been submitted yet"
            emptyHint="Documents appear here as soon as students upload them."
            filters={[
              { id: 'type', label: 'All documents', options: DOC_TYPES.map((t) => ({ value: t, label: docLabel(t) })), predicate: (r, v) => r.type === v },
              { id: 'status', label: 'All statuses', options: [{ value: 'review', label: 'Needs review' }, { value: 'verified', label: 'Verified' }, { value: 'rejected', label: 'Rejected' }], predicate: (r, v) => group(r.status) === v },
            ]}
          />
        </Panel>
      </div>

      <ReviewDialog id={openId} summary={summary} onClose={() => setOpenId(null)} onDecided={onDecided} />

      <ConfirmDialog
        open={bulk !== null}
        onClose={() => {
          setBulk(null)
          setBulkError('')
        }}
        title={bulk === 'approve' ? `Approve ${formatNumber(selected.size)} ${selected.size === 1 ? 'document' : 'documents'}?` : `Reject ${formatNumber(selected.size)} ${selected.size === 1 ? 'document' : 'documents'}?`}
        description="Each student is told, their trust score updates and the decision is written to the audit log."
        confirmLabel={bulk === 'approve' ? 'Approve' : 'Reject'}
        destructive={bulk === 'reject'}
        busy={bulkBusy}
        error={bulkError}
        onConfirm={runBulk}
      >
        {bulk === 'approve' ? (
          <p>You have not opened every one of these. Approve only the documents you are sure about.</p>
        ) : (
          <Field label="Reason for rejecting" htmlFor="bulk-reason" hint="Every selected student sees this reason.">
            <TextArea id="bulk-reason" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)} maxLength={500} placeholder="For example, the document is not readable." />
          </Field>
        )}
      </ConfirmDialog>
    </>
  )
}

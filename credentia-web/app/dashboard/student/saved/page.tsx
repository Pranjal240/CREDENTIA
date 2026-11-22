'use client'

import * as React from 'react'
import Link from 'next/link'
import { CircleCheck, Clock3, ExternalLink, FileText, FolderOpen, XCircle } from 'lucide-react'
import { useStudentData, type VerificationRow } from '@/hooks/use-student-data'
import { AnalysisReport } from '@/components/dash/analysis-report'
import { DataTable, type Column } from '@/components/dash/data-table'
import { Dialog } from '@/components/dash/dialog'
import { ErrorState, Metric, PageHeader, PageSkeleton, Panel, StatusBadge } from '@/components/dash/kit'
import { FolderShelf } from '@/components/dash/folder-shelf'
import { buildDocFolders } from '@/components/dash/doc-folders'
import { DOC_META } from '@/components/dash/doc-meta'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { DOC_ROUTE, DOC_TYPES, docLabel, type DocType } from '@/lib/documents'
import { formatDateShort } from '@/lib/format'
import { statusInfo } from '@/lib/status'

export default function MyVerificationsPage() {
  const { verifications, counts, loading, error, refresh } = useStudentData()
  const [open, setOpen] = React.useState<VerificationRow | null>(null)
  const folders = React.useMemo(() => buildDocFolders(verifications), [verifications])

  // Documents in the order of the platform, so the list reads the same for everyone.
  const rows = React.useMemo(() => [...verifications].sort((a, b) => DOC_TYPES.indexOf(a.type as DocType) - DOC_TYPES.indexOf(b.type as DocType)), [verifications])

  const columns: Column<VerificationRow>[] = [
    {
      key: 'type',
      header: 'Document',
      sortValue: (row) => docLabel(row.type),
      cell: (row) => {
        const Icon = DOC_META[row.type as DocType]?.icon ?? FileText
        return (
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-ink">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{docLabel(row.type)}</span>
              {row.document_filename ? <span className="block truncate text-xs text-muted-foreground">{row.document_filename}</span> : null}
            </span>
          </span>
        )
      },
    },
    { key: 'status', header: 'Status', sortValue: (row) => statusInfo(row.status).label, cell: (row) => <StatusBadge status={row.status} /> },
    { key: 'confidence', header: 'Confidence', align: 'right', hideOnMobile: true, sortValue: (row) => row.ai_confidence ?? 0, cell: (row) => (row.ai_confidence ? <span className="tabular">{row.ai_confidence}%</span> : <span className="text-muted-foreground">None</span>) },
    { key: 'updated', header: 'Updated', hideOnMobile: true, sortValue: (row) => row.updated_at ?? '', cell: (row) => <span className="text-muted-foreground">{row.status === 'not_submitted' ? 'Not yet' : formatDateShort(row.updated_at)}</span> },
  ]

  if (loading) return <PageSkeleton metrics={4} panels={1} />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return (
    <>
      <PageHeader title="My verifications" description="Every document, its status and the full report of what the AI found. Press a row to open the report." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} title="Submitted" icon={<FileText />} value={counts.submitted} detail="Documents uploaded" />
        <Metric index={1} emphasis title="Verified" icon={<CircleCheck />} value={counts.verified} detail="Accepted by AI or an admin" />
        <Metric index={2} title="Waiting for review" icon={<Clock3 />} value={counts.pending} detail="An admin will decide" />
        <Metric index={3} title="Rejected" icon={<XCircle />} value={counts.rejected} detail={counts.rejected ? 'Upload a clearer file' : 'None'} />
      </div>

      <div className="mt-3">
        <Panel index={4} title="Document folders" subtitle="Your uploaded files in one place">
          <FolderShelf folders={folders} />
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={5} title="All documents" subtitle="Search, filter and sort your records">
          <DataTable
            label="Verification records"
            rows={rows}
            columns={columns}
            getRowId={(row) => row.id}
            searchText={(row) => `${docLabel(row.type)} ${statusInfo(row.status).label} ${row.document_filename ?? ''}`}
            searchPlaceholder="Search documents"
            pageSize={8}
            onRowClick={(row) => setOpen(row)}
            emptyTitle="No documents yet"
            emptyHint="Upload a resume, police certificate, Aadhaar or degree to get started."
            filters={[
              {
                id: 'status',
                label: 'All statuses',
                options: [
                  { value: 'verified', label: 'Verified' },
                  { value: 'pending', label: 'Waiting for review' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'not_submitted', label: 'Not submitted' },
                ],
                predicate: (row, value) => (value === 'verified' ? statusInfo(row.status).tone === 'success' : value === 'pending' ? ['pending', 'needs_review'].includes(row.status) : row.status === value),
              },
            ]}
          />
        </Panel>
      </div>

      <Dialog
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open ? docLabel(open.type) : ''}
        description={open && open.status !== 'not_submitted' ? `Updated ${formatDateShort(open.updated_at)}` : undefined}
        size="lg"
        footer={
          open ? (
            <>
              {open.document_url ? (
                <>
                  <Button href={open.document_url} target="_blank" rel="noreferrer" size="sm" variant="default">
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Open file
                  </Button>
                  <CopyButton value={open.document_url} />
                </>
              ) : null}
              <Button href={DOC_ROUTE[open.type as DocType] ?? '/dashboard/student'} size="sm" variant="primary" onClick={() => setOpen(null)}>
                {open.status === 'not_submitted' ? 'Upload now' : 'Replace file'}
              </Button>
            </>
          ) : null
        }
      >
        {open ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={open.status} />
              {open.admin_reviewed_at ? <span className="text-xs font-semibold text-muted-foreground">Reviewed by an admin on {formatDateShort(open.admin_reviewed_at)}</span> : null}
            </div>
            {open.status === 'rejected' && open.rejection_reason ? (
              <p role="status" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                Reason from the reviewer: {open.rejection_reason}
              </p>
            ) : null}
            {open.status === 'not_submitted' ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <FolderOpen className="size-4" aria-hidden="true" />
                This document has not been uploaded yet.
              </p>
            ) : (
              <AnalysisReport type={open.type} result={open.ai_result} confidence={open.ai_confidence} />
            )}
          </div>
        ) : null}
      </Dialog>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Questions about a result? Ask Peon from the button in the corner, or read{' '}
        <Link href="/how-it-works" className="font-semibold text-brand-ink hover:underline">
          how verification works
        </Link>
        .
      </p>
    </>
  )
}

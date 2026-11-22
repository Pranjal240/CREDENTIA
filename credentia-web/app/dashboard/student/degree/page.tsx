'use client'

import * as React from 'react'
import { DocumentFlow, type FlowConfig } from '@/components/dash/document-flow'
import { ErrorState, PageHeader, PageSkeleton, Panel, StatusBadge } from '@/components/dash/kit'
import { DOC_META } from '@/components/dash/doc-meta'
import { useStudentData } from '@/hooks/use-student-data'
import { docLabel, type DocType } from '@/lib/documents'
import { cn } from '@/lib/utils'

const SLOTS: { type: DocType; title: string; config: FlowConfig }[] = [
  {
    type: 'degree',
    title: 'Degree certificate',
    config: { uploadFolder: 'degrees/degree', analyzeUrl: '/api/verify-degree', verb: 'Verify degree' },
  },
  {
    type: 'marksheet_10th',
    title: '10th marksheet',
    config: { uploadFolder: 'degrees/10th', analyzeUrl: '/api/verify-marksheet', analyzeExtra: { marksheetType: '10th' }, documentSlot: '10th', verb: 'Read marksheet' },
  },
  {
    type: 'marksheet_12th',
    title: '12th marksheet',
    config: { uploadFolder: 'degrees/12th', analyzeUrl: '/api/verify-marksheet', analyzeExtra: { marksheetType: '12th' }, documentSlot: '12th', verb: 'Read marksheet' },
  },
  {
    type: 'passport',
    title: 'Other credential',
    config: { uploadFolder: 'degrees/other', documentSlot: 'other', verb: 'Upload credential' },
  },
]

export default function DegreePage() {
  const { userId, byType, counts, loading, error, refresh } = useStudentData()
  const [active, setActive] = React.useState<DocType>('degree')
  const slot = SLOTS.find((s) => s.type === active) ?? SLOTS[0]

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Degree and marksheets"
        description="Verify your degree certificate and add your 10th and 12th marksheets. The degree and the marksheets are read by AI. Any other credential is stored for an admin to look at. Each one counts toward your trust score."
      />

      {loading ? (
        <PageSkeleton metrics={0} panels={1} />
      ) : error ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : userId ? (
        <div className="space-y-3">
          <Panel title="Pick a document" subtitle={`${SLOTS.filter((s) => ['ai_approved', 'admin_verified', 'verified'].includes(byType[s.type]?.status ?? '')).length} of ${SLOTS.length} verified`}>
            <div role="tablist" aria-label="Documents" className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SLOTS.map((s) => {
                const Icon = DOC_META[s.type].icon
                const selected = s.type === active
                return (
                  <button
                    key={s.type}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActive(s.type)}
                    className={cn(
                      'flex min-h-[84px] flex-col items-start justify-between gap-2 rounded-2xl border p-3 text-left transition-colors',
                      selected ? 'border-brand/60 bg-brand/[0.12]' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]',
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <Icon className="size-4 text-brand-ink" aria-hidden="true" />
                      <StatusBadge status={byType[s.type]?.status} />
                    </span>
                    <span className="text-sm font-bold leading-tight">{s.title}</span>
                  </button>
                )
              })}
            </div>
          </Panel>

          {/* Keyed by slot so switching starts a fresh upload for that document. */}
          <div role="tabpanel" aria-label={docLabel(slot.type)}>
            <DocumentFlow key={slot.type} type={slot.type} current={byType[slot.type]} config={slot.config} onSaved={refresh} />
          </div>
          <p className="sr-only">{counts.verified} documents verified in total</p>
        </div>
      ) : null}
    </div>
  )
}

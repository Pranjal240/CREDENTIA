'use client'

import * as React from 'react'
import { Gauge, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { useAdminResource } from '@/hooks/use-admin'
import { BarsChart, DonutChart, Meter, SERIES, TrendChart } from '@/components/dash/charts'
import { FolderShelf, type FolderSpec } from '@/components/dash/folder-shelf'
import { EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel, Segmented } from '@/components/dash/kit'
import { saveCsv } from '@/lib/csv'
import { docLabel, docShort } from '@/lib/documents'
import { formatNumber } from '@/lib/format'
import type { AdminAnalytics } from '@/lib/admin-types'

const RANGES = { '30 days': 30, '90 days': 90, '6 months': 180, '1 year': 365 } as const
type Range = keyof typeof RANGES
const RANGE_NAMES = Object.keys(RANGES) as Range[]

export default function AdminAnalyticsPage() {
  const [range, setRange] = React.useState<Range>('90 days')
  const days = RANGES[range]
  const { data, loading, error, refresh } = useAdminResource<AdminAnalytics>(`/api/admin/analytics?days=${days}`, { tables: ['verifications'], pollMs: 120_000 })

  if (loading && !data) return <PageSkeleton metrics={4} panels={4} />
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />
  if (!data) return null

  const { totals, labels, signups, processed, statuses, pipeline, trust, ats, confidence, funnel } = data
  const per = data.bucket === 'day' ? 'day' : data.bucket === 'week' ? 'week' : 'month'
  const noDocs = totals.documents === 0
  const funnelTop = Math.max(1, funnel[0]?.value ?? 0)
  const stamp = new Date().toISOString().slice(0, 10)

  const reports: { id: string; label: string; art: FolderSpec['art']; subtitle: string; files: { name: string; meta: string; run: () => void }[] }[] = [
    {
      id: 'growth',
      label: 'Growth',
      art: 'obsidian',
      subtitle: 'How the platform is growing',
      files: [
        {
          name: `new_accounts_${stamp}.csv`,
          meta: `New accounts by ${per}, ${range}`,
          run: () => saveCsv(`new_accounts_${stamp}.csv`, [['Period', 'Students', 'Companies', 'Universities'], ...labels.map((l, i) => [l, signups.student[i], signups.company[i], signups.university[i]])]),
        },
        {
          name: `student_funnel_${stamp}.csv`,
          meta: 'Where students are in verification',
          run: () => saveCsv(`student_funnel_${stamp}.csv`, [['Step', 'Students'], ...funnel.map((f) => [f.label, f.value])]),
        },
      ],
    },
    {
      id: 'documents',
      label: 'Documents',
      art: 'crimson',
      subtitle: 'How documents are being decided',
      files: [
        {
          name: `documents_decided_${stamp}.csv`,
          meta: `Decisions by ${per}, ${range}`,
          run: () => saveCsv(`documents_decided_${stamp}.csv`, [['Period', 'Verified', 'Needs review', 'Rejected'], ...labels.map((l, i) => [l, processed.verified[i], processed.review[i], processed.rejected[i]])]),
        },
        {
          name: `documents_by_type_${stamp}.csv`,
          meta: 'Status of each kind of document',
          run: () => saveCsv(`documents_by_type_${stamp}.csv`, [['Document', 'Verified', 'Needs review', 'Rejected'], ...pipeline.map((p) => [docLabel(p.type), p.verified, p.pending, p.rejected])]),
        },
        {
          name: `ai_confidence_${stamp}.csv`,
          meta: 'Average AI confidence by document',
          run: () => saveCsv(`ai_confidence_${stamp}.csv`, [['Document', 'Average confidence (%)'], ...confidence.map((c) => [docLabel(c.type), c.value])]),
        },
      ],
    },
    {
      id: 'scores',
      label: 'Scores',
      art: 'ember',
      subtitle: 'Trust and resume scores',
      files: [
        {
          name: `trust_scores_${stamp}.csv`,
          meta: 'Students in each trust band',
          run: () => saveCsv(`trust_scores_${stamp}.csv`, [['Band', 'Students'], ...trust.map((t) => [t.label, t.value])]),
        },
        {
          name: `ats_scores_${stamp}.csv`,
          meta: 'Students in each resume score band',
          run: () => saveCsv(`ats_scores_${stamp}.csv`, [['Band', 'Students'], ...ats.map((a) => [a.label, a.value])]),
        },
      ],
    },
  ]
  const folders: FolderSpec[] = reports.map((r) => ({
    id: r.id,
    label: r.label,
    art: r.art,
    subtitle: `${r.subtitle}. Press a file to download it.`,
    meta: `${r.files.length} ${r.files.length === 1 ? 'report' : 'reports'}`,
    entries: r.files.map((f) => ({ id: f.name, name: f.name, kind: 'data' as const, meta: f.meta, onOpen: f.run })),
  }))

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Growth, verification and trust across the platform, counted from the live data."
        actions={
          <>
            <Segmented<Range> options={RANGE_NAMES} value={range} onChange={setRange} label="Time range" />
            <SmoothButton size="sm" variant="outline" shape="pill" onClick={() => void refresh()}>
              Refresh
            </SmoothButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Accounts" icon={<Users />} value={totals.users} detail={`${formatNumber(totals.students)} students`} />
        <Metric index={1} title="Documents submitted" icon={<ShieldCheck />} value={totals.documents} detail="Across every student" />
        <Metric index={2} title="Verified rate" icon={<Gauge />} value={totals.verifiedRate} format="percent" detail="Of submitted documents" />
        <Metric index={3} title="Average trust score" icon={<GraduationCap />} value={totals.avgTrust} format="decimal" detail={`Resume ${totals.avgAts || 0}, CGPA ${totals.avgCgpa || 0}`} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel index={4} title="New accounts" subtitle={`Sign ups by ${per}, last ${range}`}>
          <TrendChart
            title="New accounts"
            labels={labels}
            series={[
              { label: 'Students', color: SERIES.red, values: signups.student },
              { label: 'Companies', color: SERIES.white, values: signups.company },
              { label: 'Universities', color: SERIES.grey, values: signups.university },
            ]}
          />
        </Panel>
        <Panel index={5} title="Documents decided" subtitle={`Decisions by ${per}, last ${range}`}>
          {processed.verified.concat(processed.review, processed.rejected).every((v) => v === 0) ? (
            <EmptyState icon={<ShieldCheck />} title="No documents were decided in this range" hint="Try a longer range." />
          ) : (
            <BarsChart
              title="Documents decided"
              items={labels.map((label, i) => ({ label, values: [processed.verified[i], processed.review[i], processed.rejected[i]] }))}
              series={[
                { label: 'Verified', color: SERIES.green },
                { label: 'Needs review', color: SERIES.amber },
                { label: 'Rejected', color: SERIES.red },
              ]}
            />
          )}
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.4fr]">
        <Panel index={6} title="Document status" subtitle="Where every document stands today">
          {noDocs ? <EmptyState icon={<ShieldCheck />} title="No documents yet" /> : <DonutChart title="Document status" centerLabel="Documents" segments={[{ label: statuses[0].label, value: statuses[0].value, color: SERIES.green }, { label: statuses[1].label, value: statuses[1].value, color: SERIES.white }, { label: statuses[2].label, value: statuses[2].value, color: SERIES.amber }, { label: statuses[3].label, value: statuses[3].value, color: SERIES.red }]} />}
        </Panel>
        <Panel index={7} title="By kind of document" subtitle="Verified, waiting and rejected for each">
          {noDocs ? (
            <EmptyState icon={<ShieldCheck />} title="No documents yet" />
          ) : (
            <BarsChart
              title="Documents by kind"
              items={pipeline.map((p) => ({ label: docShort(p.type), values: [p.verified, p.pending, p.rejected] }))}
              series={[
                { label: 'Verified', color: SERIES.green },
                { label: 'Needs review', color: SERIES.amber },
                { label: 'Rejected', color: SERIES.red },
              ]}
            />
          )}
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel index={8} title="Student progress" subtitle="How far students get">
          {funnel[0]?.value === 0 ? (
            <EmptyState icon={<Users />} title="No students yet" />
          ) : (
            <ol className="space-y-3.5">
              {funnel.map((step, i) => (
                <li key={step.label}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 font-bold">{step.label}</span>
                    <span className="tabular shrink-0 text-xs font-bold text-muted-foreground">
                      {formatNumber(step.value)}
                      {i > 0 ? `, ${Math.round((step.value / funnelTop) * 100)}%` : ''}
                    </span>
                  </div>
                  <Meter value={step.value} max={funnelTop} label={`${step.label}: ${step.value} of ${funnelTop}`} color={i === funnel.length - 1 ? SERIES.green : SERIES.red} />
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel index={9} title="AI confidence" subtitle="Average confidence for each kind of document">
          {confidence.length === 0 ? (
            <EmptyState icon={<Gauge />} title="No AI results yet" />
          ) : (
            <ul className="space-y-3.5">
              {confidence.map((c) => (
                <li key={c.type}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-bold">{docLabel(c.type)}</span>
                    <span className="tabular text-xs font-bold text-muted-foreground">{c.value}%</span>
                  </div>
                  <Meter value={c.value} label={`${docLabel(c.type)} confidence ${c.value} percent`} color={c.value >= 75 ? SERIES.green : c.value >= 50 ? SERIES.amber : SERIES.red} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel index={10} title="Trust score spread" subtitle="Students in each band">
          {totals.students === 0 ? <EmptyState icon={<Users />} title="No students yet" /> : <BarsChart title="Trust score spread" height={150} items={trust.map((t) => ({ label: t.label, values: [t.value] }))} series={[{ label: 'Students', color: SERIES.red }]} />}
        </Panel>
        <Panel index={11} title="Resume score spread" subtitle="Students with a scored resume">
          {ats.every((b) => b.value === 0) ? <EmptyState icon={<Gauge />} title="No scored resumes yet" /> : <BarsChart title="Resume score spread" height={150} items={ats.map((a) => ({ label: a.label, values: [a.value] }))} series={[{ label: 'Students', color: SERIES.white }]} />}
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={12} title="Reports" subtitle="Press a folder, then a file, to download the numbers on this page">
          <FolderShelf folders={folders} />
        </Panel>
      </div>
    </>
  )
}

'use client'

import { BookOpen, FileText, GraduationCap, Mail, Shield, Link2, Home, Users, CheckCircle2, Clock3, TriangleAlert, Upload } from 'lucide-react'
import { DashboardProvider } from '@/components/dash/dashboard-context'
import { DashboardShell } from '@/components/shell/dashboard-shell'
import { BarsChart, DonutChart, Legend, Meter, SERIES, TrendChart } from '@/components/dash/charts'
import { DataTable, type Column } from '@/components/dash/data-table'
import { Metric, PageHeader, Panel, Segmented, StatusBadge } from '@/components/dash/kit'
import { FolderShelf } from '@/components/dash/folder-shelf'
import { PinShelf } from '@/components/dash/pin-shelf'
import { QuickAccess } from '@/components/dash/quick-access'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

// Fixture data for review only.
const FIXTURE = {
  userId: 'fixture-user',
  email: 'student@example.test',
  role: 'student' as const,
  displayName: 'Fixture Student',
  profile: { id: 'fixture-user', full_name: 'Fixture Student', email: 'student@example.test', role: 'student' as const },
}

const ROWS = [
  { id: '1', name: 'Resume final.pdf', type: 'Resume', status: 'verified', score: 82, updated: '12 Nov 2026' },
  { id: '2', name: 'Police certificate.pdf', type: 'Police', status: 'pending', score: 64, updated: '09 Nov 2026' },
  { id: '3', name: 'Aadhaar front.jpg', type: 'Aadhaar', status: 'rejected', score: 31, updated: '02 Nov 2026' },
  { id: '4', name: 'Degree.pdf', type: 'Degree', status: 'needs_review', score: 71, updated: '28 Oct 2026' },
]

const COLUMNS: Column<(typeof ROWS)[number]>[] = [
  { key: 'name', header: 'Document', cell: (r) => <span className="font-semibold">{r.name}</span>, sortValue: (r) => r.name },
  { key: 'type', header: 'Type', cell: (r) => r.type, hideOnMobile: true, sortValue: (r) => r.type },
  { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} />, sortValue: (r) => r.status },
  { key: 'score', header: 'Score', cell: (r) => <span className="tabular">{r.score}</span>, align: 'right', sortValue: (r) => r.score },
]

const PERIODS = ['7 days', '30 days', '90 days'] as const
type Period = (typeof PERIODS)[number]

function Content() {
  const [period, setPeriod] = useState<Period>('30 days')
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Fixture data for reviewing the shell, panels, charts, folders, pins and dock."
        actions={
          <>
            <Segmented<Period> label="Reporting period" options={PERIODS} value={period} onChange={setPeriod} />
            <Button size="sm" variant="primary">Export CSV</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Trust score" icon={<Shield />} value={72} format="percent" detail="3 of 4 documents" />
        <Metric index={1} title="ATS score" icon={<FileText />} value={82} change={{ label: '4 points', direction: 'up' }} detail="since last upload" />
        <Metric index={2} title="Profile views" icon={<Users />} value={1284} change={{ label: '12%', direction: 'down', tone: 'bad' }} detail="this month" />
        <Metric index={3} title="Documents" icon={<CheckCircle2 />} value={4} detail="uploaded in total" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Panel index={4} title="Verification activity" subtitle={`Documents verified per day, ${period}`}>
          <BarsChart
            title="Verifications by day"
            series={[{ label: 'Verified', color: SERIES.white }, { label: 'Needs review', color: SERIES.red }]}
            items={Array.from({ length: 12 }).map((_, i) => ({ label: `${i + 1} Nov`, values: [3 + ((i * 7) % 9), (i * 5) % 4] }))}
          />
        </Panel>
        <Panel index={5} title="By document">
          <DonutChart
            title="Documents by status"
            centerLabel="Documents"
            segments={[
              { label: 'Verified', value: 2, color: SERIES.green },
              { label: 'Pending', value: 1, color: SERIES.amber },
              { label: 'Rejected', value: 1, color: SERIES.red },
            ]}
          />
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel index={6} title="Trend" subtitle="ATS and trust score over six months">
          <TrendChart
            title="Scores over time"
            labels={['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']}
            series={[
              { label: 'ATS', color: SERIES.red, values: [48, 55, 61, 70, 78, 82] },
              { label: 'Trust', color: SERIES.white, values: [25, 25, 50, 50, 75, 75] },
            ]}
          />
        </Panel>
        <Panel index={7} title="Profile completion" subtitle="Four documents make a complete profile">
          <div className="space-y-4">
            {['Resume', 'Police', 'Aadhaar', 'Degree'].map((label, i) => (
              <div key={label}>
                <div className="mb-1.5 flex justify-between text-xs font-semibold"><span>{label}</span><span className="tabular text-muted-foreground">{[100, 60, 30, 100][i]}%</span></div>
                <Meter label={label} value={[100, 60, 30, 100][i]} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={8} title="Document folders" subtitle="Press a folder to open its files">
          <FolderShelf
            folders={[
              { id: 'resume', label: 'Resume', art: 'crimson', meta: '1 file', entries: [{ id: 'r1', name: 'Resume final.pdf', kind: 'pdf', meta: 'PDF, 1.2 MB', date: '12 Nov 2026', timestamp: 3, status: { label: 'Verified', tone: 'success' }, copyValue: 'ATS 82' }], actions: <Button size="sm" variant="primary"><Upload className="size-4" />Upload</Button> },
              { id: 'police', label: 'Police', art: 'obsidian', meta: '1 file', entries: [{ id: 'p1', name: 'Police certificate.pdf', kind: 'pdf', meta: 'PDF, 640 KB', date: '09 Nov 2026', timestamp: 2, status: { label: 'Pending', tone: 'warning' } }] },
              { id: 'degree', label: 'Degree', art: 'ember', meta: 'Empty', entries: [] },
            ]}
          />
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <PinShelf
          index={9}
          storageKey="credentia:dev:pins"
          title="Pinned documents"
          subtitle="Pin the ones you open most"
          label="Documents"
          max={3}
          items={ROWS.map((r) => ({ id: r.id, title: r.name, meta: `${r.type}, updated ${r.updated}`, icon: <FileText className="size-4" />, href: '/dashboard/student/saved' }))}
        />
        <QuickAccess
          index={10}
          title="Quick access"
          subtitle="Documents and pages you use most"
          items={[
            { title: 'Home', icon: Home, morph: 'home', href: '/dashboard/student' },
            { title: 'Resume', icon: FileText, href: '/dashboard/student/resume' },
            { title: 'Police', icon: Shield, href: '/dashboard/student/police' },
            { title: 'Degree', icon: GraduationCap, href: '/dashboard/student/degree' },
            { title: 'My link', icon: Link2, href: '/dashboard/student/my-link' },
            { title: 'Support', icon: Mail, morph: 'email', href: '/contact' },
            { title: 'Guide', icon: BookOpen, morph: 'blog', href: '/how-it-works' },
          ]}
        />
      </div>

      <div className="mt-3">
        <Panel index={11} title="Records" subtitle="Search, filter, sort and page through your documents">
          <DataTable
            label="Documents"
            rows={ROWS}
            columns={COLUMNS}
            getRowId={(r) => r.id}
            searchText={(r) => `${r.name} ${r.type} ${r.status}`}
            searchPlaceholder="Search documents"
            pageSize={3}
            filters={[{ id: 'status', label: 'All statuses', options: [{ value: 'verified', label: 'Verified' }, { value: 'pending', label: 'Pending' }, { value: 'rejected', label: 'Rejected' }], predicate: (r, v) => r.status === v }]}
          />
        </Panel>
      </div>
    </>
  )
}

export default function DashboardPreview() {
  return (
    <DashboardProvider fixture={FIXTURE}>
      <DashboardShell>
        <Content />
      </DashboardShell>
    </DashboardProvider>
  )
}

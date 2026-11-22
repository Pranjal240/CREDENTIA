'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Activity, Clock3, ScrollText, ShieldCheck, Users } from 'lucide-react'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { CopyButton } from '@/components/ui/copy-button'
import { useAdminResource } from '@/hooks/use-admin'
import { BarsChart, SERIES } from '@/components/dash/charts'
import { DataTable, type Column } from '@/components/dash/data-table'
import { Dialog } from '@/components/dash/dialog'
import { FolderShelf, type FolderSpec } from '@/components/dash/folder-shelf'
import { EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel } from '@/components/dash/kit'
import { describeAction } from '@/lib/admin-client'
import { saveCsv } from '@/lib/csv'
import { dayLabel, formatDateTime, formatNumber, timeAgo } from '@/lib/format'
import type { AdminAudit } from '@/lib/admin-types'

type Category = 'documents' | 'accounts' | 'platform'
const CATEGORY_LABEL: Record<Category, string> = { documents: 'Documents', accounts: 'Accounts and access', platform: 'Platform and support' }

/** Groups an action by what it touched, so the log can be browsed by topic. */
function categoryOf(action: string): Category {
  if (/verification|bulk_|police|cgpa/.test(action)) return 'documents'
  if (/role|user|student|company|university|access|candidate/.test(action)) return 'accounts'
  return 'platform'
}

const show = (value: unknown): string => (value === null || value === undefined ? 'None' : typeof value === 'object' ? JSON.stringify(value, null, 1) : String(value))

function DetailDialog({ row, onClose }: { row: AdminAudit | null; onClose: () => void }) {
  const entries = row?.details && typeof row.details === 'object' ? Object.entries(row.details) : []
  return (
    <Dialog open={Boolean(row)} onClose={onClose} title={row ? describeAction(row.action) : 'Entry'} description={row ? formatDateTime(row.created_at) : undefined} size="md">
      {row ? (
        <div className="space-y-4">
          <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[
              { label: 'Action', value: row.action },
              { label: 'Done by', value: row.actor_email || 'System' },
              { label: 'Touched', value: row.target_type ? row.target_type.replace(/_/g, ' ') : 'Not recorded' },
            ].map((fact) => (
              <div key={fact.label} className="glass-flat min-w-0 rounded-xl px-3 py-2.5">
                <dt className="text-[11px] font-semibold text-muted-foreground">{fact.label}</dt>
                <dd className="mt-0.5 break-words text-sm font-bold">{fact.value}</dd>
              </div>
            ))}
            <div className="glass-flat min-w-0 rounded-xl px-3 py-2.5">
              <dt className="text-[11px] font-semibold text-muted-foreground">Id of what was touched</dt>
              <dd className="mt-1 flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{row.target_id || 'Not recorded'}</span>
                {row.target_id ? <CopyButton value={row.target_id} /> : null}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="mb-2 text-sm font-extrabold">What changed</h3>
            {entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No further details were recorded.</p>
            ) : (
              <dl className="divide-y divide-white/[0.06] rounded-xl border border-white/10 bg-white/[0.03]">
                {entries.map(([key, value]) => (
                  <div key={key} className="grid grid-cols-1 gap-1 px-3 py-2.5 sm:grid-cols-[10rem_1fr]">
                    <dt className="text-xs font-bold text-muted-foreground">{key.replace(/_/g, ' ')}</dt>
                    <dd className="min-w-0">
                      {typeof value === 'object' && value !== null ? (
                        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed scrollbar-thin">{show(value)}</pre>
                      ) : (
                        <span className="break-words text-sm font-semibold">{show(value)}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}

export default function AdminAuditPage() {
  const params = useSearchParams()
  const { data, loading, error, refresh } = useAdminResource<{ rows: AdminAudit[]; limit: number }>('/api/admin/audit?limit=500', { tables: ['audit_logs'] })
  const [open, setOpen] = React.useState<AdminAudit | null>(null)
  const rows = React.useMemo(() => data?.rows ?? [], [data])
  const query = params?.get('q') ?? ''

  const stats = React.useMemo(() => {
    const dayAgo = Date.now() - 86_400_000
    const actors = new Set(rows.map((r) => r.actor_email).filter(Boolean))
    const tally = new Map<string, number>()
    for (const r of rows) tally.set(r.action, (tally.get(r.action) ?? 0) + 1)
    const top = Array.from(tally.entries()).sort((a, b) => b[1] - a[1])[0]
    return { today: rows.filter((r) => new Date(r.created_at).getTime() >= dayAgo).length, actors: actors.size, kinds: tally.size, top: top ? describeAction(top[0]) : 'None yet' }
  }, [rows])

  const days = React.useMemo(() => {
    const out: { label: string; values: number[] }[] = []
    for (let i = 13; i >= 0; i -= 1) {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      start.setDate(start.getDate() - i)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      out.push({ label: dayLabel(start), values: [rows.filter((r) => { const t = new Date(r.created_at).getTime(); return t >= start.getTime() && t < end.getTime() }).length] })
    }
    return out
  }, [rows])

  const exportCsv = () =>
    saveCsv(`audit_log_${new Date().toISOString().slice(0, 10)}.csv`, [
      ['When', 'Action', 'Done by', 'Touched', 'Id', 'Details'],
      ...rows.map((r) => [formatDateTime(r.created_at), r.action, r.actor_email ?? '', r.target_type ?? '', r.target_id ?? '', r.details ? JSON.stringify(r.details) : '']),
    ])

  const actors = React.useMemo(() => Array.from(new Set(rows.map((r) => r.actor_email).filter((e): e is string => Boolean(e)))).sort(), [rows])
  const targets = React.useMemo(() => Array.from(new Set(rows.map((r) => r.target_type).filter((t): t is string => Boolean(t)))).sort(), [rows])

  const columns: Column<AdminAudit>[] = [
    {
      key: 'when',
      header: 'When',
      sortValue: (r) => r.created_at,
      cell: (r) => (
        <button type="button" onClick={() => setOpen(r)} className="block text-left">
          <span className="block text-sm font-bold">{timeAgo(r.created_at)}</span>
          <span className="block text-xs text-muted-foreground">{formatDateTime(r.created_at)}</span>
        </button>
      ),
    },
    { key: 'action', header: 'Action', sortValue: (r) => describeAction(r.action), cell: (r) => <span className="font-semibold">{describeAction(r.action)}</span> },
    { key: 'actor', header: 'Done by', hideOnMobile: true, sortValue: (r) => r.actor_email ?? '', cell: (r) => <span className="block max-w-[14rem] truncate text-muted-foreground">{r.actor_email || 'System'}</span> },
    { key: 'target', header: 'Touched', hideOnMobile: true, sortValue: (r) => r.target_type ?? '', cell: (r) => <span className="text-muted-foreground">{r.target_type ? r.target_type.replace(/_/g, ' ') : 'Not recorded'}</span> },
  ]

  if (loading) return <PageSkeleton metrics={4} panels={2} />
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />

  const FOLDER_LIMIT = 60
  const entry = (r: AdminAudit) => ({
    id: r.id,
    name: describeAction(r.action),
    kind: 'data' as const,
    meta: r.actor_email || 'System',
    date: timeAgo(r.created_at),
    timestamp: new Date(r.created_at).getTime(),
    onOpen: () => setOpen(r),
    copyValue: r.target_id || undefined,
    copyLabel: 'Target id',
  })
  const order: Category[] = ['documents', 'accounts', 'platform']
  const art: Record<Category, FolderSpec['art']> = { documents: 'crimson', accounts: 'obsidian', platform: 'ember' }
  const sub: Record<Category, string> = { documents: 'Decisions on documents and marks', accounts: 'Roles, profiles and who can see what', platform: 'Settings and support' }
  const folders: FolderSpec[] = order.map((c) => {
    const list = rows.filter((r) => categoryOf(r.action) === c)
    return { id: c, label: CATEGORY_LABEL[c], art: art[c], subtitle: sub[c], meta: list.length === 0 ? 'Empty' : `${formatNumber(list.length)} ${list.length === 1 ? 'entry' : 'entries'}`, entries: list.slice(0, FOLDER_LIMIT).map(entry), emptyTitle: 'Nothing recorded here yet' }
  })

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every admin action on the platform, with who did it and what changed. Entries cannot be edited here."
        actions={
          <SmoothButton size="sm" variant="outline" shape="pill" onClick={exportCsv} disabled={rows.length === 0}>
            Export CSV
          </SmoothButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Entries loaded" icon={<ScrollText />} value={rows.length} detail={`The latest ${formatNumber(data?.limit ?? 0)} at most`} />
        <Metric index={1} title="Last 24 hours" icon={<Clock3 />} value={stats.today} detail="Actions taken today" />
        <Metric index={2} title="People acting" icon={<Users />} value={stats.actors} detail="Distinct admins and users" />
        <Metric index={3} title="Kinds of action" icon={<Activity />} value={stats.kinds} detail={`Most common: ${stats.top}`} />
      </div>

      <div className="mt-3">
        <Panel index={4} title="Activity, last 14 days" subtitle="Actions recorded each day">
          {rows.length === 0 ? <EmptyState icon={<ShieldCheck />} title="Nothing has been recorded yet" hint="Decisions and changes made by admins appear here." /> : <BarsChart title="Audit entries per day" items={days} series={[{ label: 'Entries', color: SERIES.red }]} height={170} />}
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={5} title="Browse by topic" subtitle="Press a folder to open its entries">
          <FolderShelf folders={folders} />
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={6} title="All entries" subtitle="Search, filter and sort. Press a row to see exactly what changed.">
          <DataTable
            label="Audit entries"
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            searchText={(r) => `${r.action} ${describeAction(r.action)} ${r.actor_email ?? ''} ${r.target_type ?? ''} ${r.target_id ?? ''} ${r.details ? JSON.stringify(r.details) : ''}`}
            searchPlaceholder="Search by action, person or id"
            pageSize={12}
            onRowClick={(r) => setOpen(r)}
            initialQuery={query}
            emptyTitle="Nothing has been recorded yet"
            filters={[
              { id: 'topic', label: 'All topics', options: order.map((c) => ({ value: c, label: CATEGORY_LABEL[c] })), predicate: (r, v) => categoryOf(r.action) === v },
              { id: 'actor', label: 'Anyone', options: actors.map((a) => ({ value: a, label: a })), predicate: (r, v) => r.actor_email === v },
              { id: 'target', label: 'Anything', options: targets.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })), predicate: (r, v) => r.target_type === v },
            ]}
          />
        </Panel>
      </div>

      <DetailDialog row={open} onClose={() => setOpen(null)} />
    </>
  )
}

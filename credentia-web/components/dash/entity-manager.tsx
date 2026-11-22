'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Briefcase, Building2, CircleCheck, Clock3, UserX } from 'lucide-react'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { useAdminResource } from '@/hooks/use-admin'
import { ConfirmDialog } from '@/components/dash/confirm-dialog'
import { Meter, SERIES } from '@/components/dash/charts'
import { DataTable, type Column } from '@/components/dash/data-table'
import { Dialog } from '@/components/dash/dialog'
import { FolderShelf, type FolderSpec } from '@/components/dash/folder-shelf'
import { Field, Switch, TextArea, TextInput } from '@/components/dash/form'
import { Badge, EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel } from '@/components/dash/kit'
import { adminPost } from '@/lib/admin-client'
import { saveCsv } from '@/lib/csv'
import { formatDateShort, formatNumber, timeAgo } from '@/lib/format'
import type { AdminEntity } from '@/lib/admin-types'

type Kind = 'university' | 'company'

const COPY: Record<Kind, { title: string; label: string; description: string; noun: string; nouns: string; count: string; approveHint: string; icon: React.ReactNode; empty: string }> = {
  university: {
    title: 'Universities',
    label: 'University',
    description: 'Every registered university. Approve an institution so it can see the students linked to it.',
    noun: 'university',
    nouns: 'universities',
    count: 'Students linked',
    approveHint: 'Until it is approved, a university cannot see its students.',
    icon: <Building2 />,
    empty: 'Universities appear here as soon as they register.',
  },
  company: {
    title: 'Companies',
    label: 'Company',
    description: 'Every registered company. Approve a company so students see it marked as approved.',
    noun: 'company',
    nouns: 'companies',
    count: 'Applications received',
    approveHint: 'Students see approved companies marked as approved.',
    icon: <Briefcase />,
    empty: 'Companies appear here as soon as they register.',
  },
}

const FIELDS: Record<Kind, { key: keyof AdminEntity; apiKey: string; label: string; wide?: boolean; multiline?: boolean }[]> = {
  university: [
    { key: 'name', apiKey: 'university_name', label: 'University name', wide: true },
    { key: 'city', apiKey: 'city', label: 'City' },
    { key: 'state', apiKey: 'state', label: 'State' },
    { key: 'ugc_id', apiKey: 'ugc_id', label: 'UGC id' },
    { key: 'naac_grade', apiKey: 'naac_grade', label: 'NAAC grade' },
  ],
  company: [
    { key: 'name', apiKey: 'company_name', label: 'Company name', wide: true },
    { key: 'industry', apiKey: 'industry', label: 'Industry' },
    { key: 'company_size', apiKey: 'company_size', label: 'Company size' },
    { key: 'website', apiKey: 'website', label: 'Website' },
    { key: 'state', apiKey: 'state', label: 'State' },
    { key: 'description', apiKey: 'description', label: 'About the company', wide: true, multiline: true },
  ],
}

const placeOf = (kind: Kind, e: AdminEntity) => (kind === 'university' ? [e.city, e.state] : [e.industry, e.state]).filter(Boolean).join(', ')

function EntityDialog({ kind, entity: current, onClose, onChanged }: { kind: Kind; entity: AdminEntity | null; onClose: () => void; onChanged: () => void }) {
  const copy = COPY[kind]
  // Keep the last organisation on screen while the dialog fades out.
  const last = React.useRef<AdminEntity | null>(null)
  if (current) last.current = current
  const entity = current ?? last.current
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [notice, setNotice] = React.useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [switching, setSwitching] = React.useState<'approve' | 'active' | null>(null)
  const [confirm, setConfirm] = React.useState<'withdraw' | 'off' | null>(null)
  const [confirmError, setConfirmError] = React.useState('')

  const id = current?.id ?? null
  React.useEffect(() => {
    setNotice(null)
    setConfirm(null)
    setConfirmError('')
    if (!current) return
    setValues(Object.fromEntries(FIELDS[kind].map((f) => [f.apiKey, String(current[f.key] ?? '')])))
    // Only reset the form when a different organisation is opened, not on every refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, kind])

  if (!entity) return null

  const approvalChange = async (approved: boolean) => {
    setSwitching('approve')
    setConfirmError('')
    try {
      await adminPost('/api/admin/update-entity', { id: entity.id, role: kind, entityUpdates: { is_verified: approved } })
      setConfirm(null)
      setNotice({ tone: 'success', text: approved ? `The ${copy.noun} is approved and has been told.` : 'Approval withdrawn. They have been told.' })
      onChanged()
    } catch (err) {
      setConfirmError((err as Error).message)
      setNotice({ tone: 'error', text: (err as Error).message })
    } finally {
      setSwitching(null)
    }
  }

  const activeChange = async (active: boolean) => {
    setSwitching('active')
    setConfirmError('')
    try {
      await adminPost('/api/admin/update-entity', { id: entity.id, role: kind, profileUpdates: { is_active: active } })
      setConfirm(null)
      setNotice({ tone: 'success', text: active ? 'The account is switched on.' : 'The account is switched off.' })
      onChanged()
    } catch (err) {
      setConfirmError((err as Error).message)
      setNotice({ tone: 'error', text: (err as Error).message })
    } finally {
      setSwitching(null)
    }
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    const nameKey = FIELDS[kind][0].apiKey
    if (!values[nameKey]?.trim()) {
      setNotice({ tone: 'error', text: 'The name cannot be empty.' })
      return
    }
    setSaving(true)
    setNotice(null)
    try {
      await adminPost('/api/admin/update-entity', { id: entity.id, role: kind, entityUpdates: values })
      setNotice({ tone: 'success', text: 'Details saved.' })
      onChanged()
    } catch (err) {
      setNotice({ tone: 'error', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={Boolean(current)} onClose={onClose} title={entity.name} description={`${copy.label}, registered ${formatDateShort(entity.created_at) || 'on an unknown date'}`} size="lg" footer={entity.email ? <CopyButton value={entity.email} /> : null}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {entity.is_verified ? <Badge tone="success">Approved</Badge> : <Badge tone="warning">Awaiting approval</Badge>}
            {entity.is_active ? <Badge tone="success">Account on</Badge> : <Badge tone="danger">Switched off</Badge>}
            <span className="text-xs text-muted-foreground">
              {copy.count}: <strong className="tabular text-foreground">{formatNumber(entity.count)}</strong>
            </span>
          </div>

          {notice ? (
            <p role={notice.tone === 'error' ? 'alert' : 'status'} className={notice.tone === 'error' ? 'text-sm font-semibold text-destructive' : 'text-sm font-semibold text-success'}>
              {notice.text}
            </p>
          ) : null}

          <section className="glass-flat rounded-2xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold">{entity.is_verified ? 'Approved' : 'Approve this ' + copy.noun}</h4>
                <p className="mt-0.5 text-xs text-muted-foreground">{copy.approveHint}</p>
              </div>
              <Switch checked={entity.is_verified} disabled={switching !== null} label={entity.is_verified ? 'Withdraw approval' : `Approve this ${copy.noun}`} onChange={(value) => (value ? void approvalChange(true) : setConfirm('withdraw'))} />
            </div>
          </section>

          <section className="glass-flat rounded-2xl p-4">
            <h4 className="text-sm font-extrabold">Details</h4>
            <p className="mt-0.5 text-xs text-muted-foreground">{entity.has_record ? 'Correct what is wrong. Every change is written to the audit log.' : 'This account never saved its details. Saving here creates them.'}</p>
            <form onSubmit={save} className="mt-3 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {FIELDS[kind].map((field) => (
                  <Field key={field.apiKey} label={field.label} htmlFor={`ent-${field.apiKey}`} className={field.wide ? 'sm:col-span-2' : undefined}>
                    {field.multiline ? (
                      <TextArea id={`ent-${field.apiKey}`} value={values[field.apiKey] ?? ''} onChange={(e) => setValues({ ...values, [field.apiKey]: e.target.value })} maxLength={1200} />
                    ) : (
                      <TextInput id={`ent-${field.apiKey}`} value={values[field.apiKey] ?? ''} onChange={(e) => setValues({ ...values, [field.apiKey]: e.target.value })} maxLength={160} autoComplete="off" />
                    )}
                  </Field>
                ))}
              </div>
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                {saving ? 'Saving' : 'Save details'}
              </Button>
            </form>
          </section>

          <section className="glass-flat rounded-2xl p-4">
            <h4 className="text-sm font-extrabold">Account</h4>
            <dl className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[
                { label: 'Contact person', value: entity.contact },
                { label: 'Email', value: entity.email },
                { label: 'Phone', value: entity.phone },
                { label: 'Last signed in', value: entity.last_login_at ? timeAgo(entity.last_login_at) : 'Never' },
              ].map((fact) => (
                <div key={fact.label} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <dt className="text-[11px] font-semibold text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-0.5 break-words text-sm font-bold">{fact.value || <span className="font-medium text-muted-foreground">Not added</span>}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div className="min-w-0">
                <p className="text-sm font-bold">{entity.is_active ? 'Account is on' : 'Account is switched off'}</p>
                <p className="text-xs text-muted-foreground">{entity.is_active ? 'Switching it off stops them using the platform. Nothing is deleted.' : 'Switch it on to let them back in.'}</p>
              </div>
              <Switch checked={entity.is_active} disabled={switching !== null} label={entity.is_active ? 'Switch the account off' : 'Switch the account on'} onChange={(value) => (value ? void activeChange(true) : setConfirm('off'))} />
            </div>
            <div className="mt-3">
              <Link href={`/dashboard/admin/users?q=${encodeURIComponent(entity.email || entity.name)}`} className="text-xs font-bold text-brand-ink hover:underline">
                Open the full account
              </Link>
            </div>
          </section>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirm === 'withdraw'}
        onClose={() => setConfirm(null)}
        title="Withdraw approval?"
        description={entity.name}
        confirmLabel="Withdraw approval"
        destructive
        busy={switching === 'approve'}
        error={confirmError}
        onConfirm={() => void approvalChange(false)}
      >
        <p>{kind === 'university' ? 'The university will no longer be able to see its students until you approve it again.' : 'Students will no longer see this company marked as approved.'} They are told.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm === 'off'}
        onClose={() => setConfirm(null)}
        title="Switch this account off?"
        description={entity.name}
        confirmLabel="Switch off"
        destructive
        busy={switching === 'active'}
        error={confirmError}
        onConfirm={() => void activeChange(false)}
      >
        <p>They will not be able to use the platform until you switch the account back on. Their data stays as it is.</p>
      </ConfirmDialog>
    </>
  )
}

/** The page for one kind of organisation. The Universities and Companies pages are this with a different kind. */
export function EntityManager({ kind }: { kind: Kind }) {
  const copy = COPY[kind]
  const params = useSearchParams()
  const { data, loading, error, refresh } = useAdminResource<{ universities: AdminEntity[]; companies: AdminEntity[] }>('/api/admin/entities', { tables: ['profiles', 'companies', 'universities'] })
  const [openId, setOpenId] = React.useState<string | null>(null)
  const list = React.useMemo(() => (kind === 'university' ? data?.universities : data?.companies) ?? [], [data, kind])
  const query = params?.get('q') ?? ''

  // A link from search carries a name. When it matches one organisation, open it.
  const opened = React.useRef('')
  React.useEffect(() => {
    if (!query || opened.current === query || list.length === 0) return
    const q = query.toLowerCase()
    const exact = list.filter((e) => e.name.toLowerCase() === q || e.email?.toLowerCase() === q)
    opened.current = query
    if (exact.length === 1) setOpenId(exact[0].id)
  }, [query, list])

  const stats = React.useMemo(() => ({ approved: list.filter((e) => e.is_verified).length, waiting: list.filter((e) => !e.is_verified).length, off: list.filter((e) => !e.is_active).length }), [list])
  const top = React.useMemo(() => [...list].filter((e) => e.count > 0).sort((a, b) => b.count - a.count).slice(0, 6), [list])
  const states = React.useMemo(() => Array.from(new Set(list.map((e) => e.state).filter((s): s is string => Boolean(s)))).sort(), [list])

  const exportCsv = () =>
    saveCsv(`${copy.nouns}_${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Name', 'Email', 'Contact', 'Phone', 'Place', 'Approved', 'Account', copy.count, 'Registered'],
      ...list.map((e) => [e.name, e.email ?? '', e.contact ?? '', e.phone ?? '', placeOf(kind, e), e.is_verified ? 'Yes' : 'No', e.is_active ? 'On' : 'Switched off', e.count, formatDateShort(e.created_at)]),
    ])

  const columns: Column<AdminEntity>[] = [
    {
      key: 'name',
      header: kind === 'university' ? 'University' : 'Company',
      sortValue: (e) => e.name,
      cell: (e) => (
        <button type="button" onClick={() => setOpenId(e.id)} className="block min-w-0 max-w-[18rem] text-left">
          <span className="block truncate text-sm font-bold">{e.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{e.email}</span>
        </button>
      ),
    },
    { key: 'place', header: kind === 'university' ? 'Location' : 'Industry', hideOnMobile: true, sortValue: (e) => placeOf(kind, e), cell: (e) => <span className="text-muted-foreground">{placeOf(kind, e) || 'Not added'}</span> },
    { key: 'count', header: copy.count, align: 'right', hideOnMobile: true, sortValue: (e) => e.count, cell: (e) => <span className="tabular font-bold">{formatNumber(e.count)}</span> },
    { key: 'approved', header: 'Approval', sortValue: (e) => (e.is_verified ? 1 : 0), cell: (e) => (e.is_verified ? <Badge tone="success">Approved</Badge> : <Badge tone="warning">Awaiting</Badge>) },
    { key: 'status', header: 'Account', hideOnMobile: true, sortValue: (e) => (e.is_active ? 1 : 0), cell: (e) => (e.is_active ? <Badge tone="success">On</Badge> : <Badge tone="danger">Switched off</Badge>) },
    { key: 'joined', header: 'Registered', hideOnMobile: true, sortValue: (e) => e.created_at ?? '', cell: (e) => <span className="text-muted-foreground">{formatDateShort(e.created_at)}</span> },
  ]

  if (loading) return <PageSkeleton metrics={4} panels={2} />
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />

  const FOLDER_LIMIT = 60
  const entry = (e: AdminEntity) => ({
    id: e.id,
    name: e.name,
    kind: 'folder' as const,
    meta: [placeOf(kind, e), e.email].filter(Boolean).join(', '),
    date: formatDateShort(e.created_at),
    timestamp: e.created_at ? new Date(e.created_at).getTime() : 0,
    status: e.is_verified ? { label: 'Approved', tone: 'success' as const } : { label: 'Awaiting approval', tone: 'warning' as const },
    onOpen: () => setOpenId(e.id),
    copyValue: e.email || undefined,
    copyLabel: 'Email',
    details: [{ label: copy.count, value: formatNumber(e.count) }],
  })
  const base: Omit<FolderSpec, 'meta'>[] = [
    { id: 'waiting', label: 'Awaiting approval', art: 'crimson', subtitle: `Registered ${copy.nouns} that are not approved yet`, entries: list.filter((e) => !e.is_verified).slice(0, FOLDER_LIMIT).map(entry), emptyTitle: 'Everyone is approved', emptyHint: `New ${copy.nouns} that need approval appear here.` },
    { id: 'approved', label: 'Approved', art: 'obsidian', subtitle: `Approved ${copy.nouns}`, entries: list.filter((e) => e.is_verified).slice(0, FOLDER_LIMIT).map(entry), emptyTitle: `No approved ${copy.nouns} yet` },
    { id: 'off', label: 'Switched off', art: 'ember', subtitle: 'Accounts that cannot use the platform', entries: list.filter((e) => !e.is_active).slice(0, FOLDER_LIMIT).map(entry), emptyTitle: 'No account is switched off' },
  ]
  const totals: Record<string, number> = { waiting: stats.waiting, approved: stats.approved, off: stats.off }
  const folders: FolderSpec[] = base.map((f) => ({ ...f, meta: totals[f.id] === 0 ? 'Empty' : `${formatNumber(totals[f.id])} ${totals[f.id] === 1 ? copy.noun : copy.nouns}` }))

  const opened_ = openId ? list.find((e) => e.id === openId) ?? null : null
  const topMax = top[0]?.count ?? 1

  return (
    <>
      <PageHeader
        title={copy.title}
        description={copy.description}
        actions={
          <SmoothButton size="sm" variant="outline" shape="pill" onClick={exportCsv} disabled={list.length === 0}>
            Export CSV
          </SmoothButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Registered" icon={copy.icon} value={list.length} detail={`All ${copy.nouns}`} />
        <Metric index={1} title="Approved" icon={<CircleCheck />} value={stats.approved} detail={list.length ? `${Math.round((stats.approved / list.length) * 100)}% of ${copy.nouns}` : 'None yet'} />
        <Metric index={2} title="Awaiting approval" icon={<Clock3 />} value={stats.waiting} detail={stats.waiting === 0 ? 'Nothing to approve' : 'Need a decision'} />
        <Metric index={3} title="Switched off" icon={<UserX />} value={stats.off} detail={stats.off === 0 ? 'Every account is on' : 'Cannot use the platform'} />
      </div>

      <div className="mt-3">
        <Panel index={4} title="Folders" subtitle="Press a folder to open the list inside it">
          {list.length === 0 ? <EmptyState icon={copy.icon} title={`No ${copy.nouns} yet`} hint={copy.empty} /> : <FolderShelf folders={folders} />}
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={5} title={kind === 'university' ? 'Most students linked' : 'Most applications'} subtitle="The busiest six">
          {top.length === 0 ? (
            <EmptyState icon={copy.icon} title="Nothing to rank yet" hint={kind === 'university' ? 'Students link their account to a university from their Settings.' : 'Applications appear once students apply to a company.'} />
          ) : (
            <ol className="grid grid-cols-1 gap-x-10 gap-y-3.5 sm:grid-cols-2">
              {top.map((e) => (
                <li key={e.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <button type="button" onClick={() => setOpenId(e.id)} className="min-w-0 truncate text-left font-bold hover:underline">
                      {e.name}
                    </button>
                    <span className="tabular shrink-0 text-xs font-bold text-muted-foreground">{formatNumber(e.count)}</span>
                  </div>
                  <Meter value={e.count} max={topMax} label={`${e.name}: ${e.count}`} color={SERIES.red} />
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={6} title={`All ${copy.nouns}`} subtitle="Search, filter and sort. Press a row to open it.">
          <DataTable
            label={copy.title}
            rows={list}
            columns={columns}
            getRowId={(e) => e.id}
            searchText={(e) => `${e.name} ${e.email ?? ''} ${e.contact ?? ''} ${e.city ?? ''} ${e.state ?? ''} ${e.industry ?? ''}`}
            searchPlaceholder={`Search ${copy.nouns} by name or email`}
            pageSize={10}
            onRowClick={(e) => setOpenId(e.id)}
            initialQuery={query}
            emptyTitle={`No ${copy.nouns} yet`}
            emptyHint={copy.empty}
            filters={[
              { id: 'approval', label: 'Any approval', options: [{ value: 'approved', label: 'Approved' }, { value: 'waiting', label: 'Awaiting approval' }], predicate: (e, v) => (v === 'approved' ? e.is_verified : !e.is_verified) },
              { id: 'account', label: 'Any account', options: [{ value: 'on', label: 'On' }, { value: 'off', label: 'Switched off' }], predicate: (e, v) => (v === 'on' ? e.is_active : !e.is_active) },
              ...(states.length > 0 ? [{ id: 'state', label: 'All states', options: states.map((s) => ({ value: s, label: s })), predicate: (e: AdminEntity, v: string) => e.state === v }] : []),
            ]}
          />
        </Panel>
      </div>

      <EntityDialog kind={kind} entity={opened_} onClose={() => setOpenId(null)} onChanged={() => void refresh()} />
    </>
  )
}

export default EntityManager

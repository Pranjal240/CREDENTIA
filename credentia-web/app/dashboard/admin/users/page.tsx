'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Building2, ShieldCheck, UserX, Users } from 'lucide-react'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { useAdminResource } from '@/hooks/use-admin'
import { ScoreRing } from '@/components/dash/analysis-report'
import { ConfirmDialog } from '@/components/dash/confirm-dialog'
import { useDash } from '@/components/dash/dashboard-context'
import { DataTable, type Column } from '@/components/dash/data-table'
import { Dialog } from '@/components/dash/dialog'
import { FolderShelf, type FolderSpec } from '@/components/dash/folder-shelf'
import { Field, SelectInput, Switch, TextInput } from '@/components/dash/form'
import { Badge, EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel, StatusBadge } from '@/components/dash/kit'
import { ProfileAvatar } from '@/components/dash/profile-avatar'
import { RoleBadge } from '@/components/dash/role-badge'
import { adminPost, ROLE_LABEL } from '@/lib/admin-client'
import { saveCsv } from '@/lib/csv'
import { DOC_TYPES, docLabel } from '@/lib/documents'
import { formatDateShort, formatNumber, timeAgo } from '@/lib/format'
import type { AdminUser, AdminUserDetail } from '@/lib/admin-types'

const ROLES = ['student', 'company', 'university', 'admin'] as const
const isActive = (user: AdminUser) => user.is_active !== false

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="glass-flat rounded-2xl p-4">
      <h4 className="text-sm font-extrabold">{title}</h4>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Notice({ tone, text }: { tone: 'success' | 'error'; text: string }) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={tone === 'error' ? 'text-sm font-semibold text-destructive' : 'text-sm font-semibold text-success'}>
      {text}
    </p>
  )
}

function Facts({ items }: { items: { label: string; value?: string | number | null }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {items.map((fact) => (
        <div key={fact.label} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <dt className="text-[11px] font-semibold text-muted-foreground">{fact.label}</dt>
          <dd className="mt-0.5 break-words text-sm font-bold">{fact.value || fact.value === 0 ? fact.value : <span className="font-medium text-muted-foreground">Not added</span>}</dd>
        </div>
      ))}
    </dl>
  )
}

type Changed = (message: string) => void

function AccountSection({ detail, isSelf, onChanged }: { detail: AdminUserDetail; isSelf: boolean; onChanged: Changed }) {
  const { user } = detail
  const [name, setName] = React.useState(user.full_name ?? '')
  const [phone, setPhone] = React.useState(user.phone ?? '')
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [confirmOff, setConfirmOff] = React.useState(false)
  const [switching, setSwitching] = React.useState(false)
  const [switchError, setSwitchError] = React.useState('')
  const active = isActive(user)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setNotice(null)
    try {
      await adminPost('/api/admin/update-profile', { userId: user.id, updates: { full_name: name, phone } })
      setNotice({ tone: 'success', text: 'Account details saved.' })
      onChanged('Account details saved.')
    } catch (err) {
      setNotice({ tone: 'error', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const setActive = async (value: boolean) => {
    setSwitching(true)
    setSwitchError('')
    try {
      await adminPost('/api/admin/update-profile', { userId: user.id, updates: { is_active: value } })
      setConfirmOff(false)
      onChanged(value ? 'The account is switched on.' : 'The account is switched off. They can no longer sign in to use the platform.')
    } catch (err) {
      setSwitchError((err as Error).message)
    } finally {
      setSwitching(false)
    }
  }

  return (
    <>
      <Section title="Account" hint="The name and phone number on the account.">
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Full name" htmlFor="acct-name">
              <TextInput id="acct-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="off" />
            </Field>
            <Field label="Phone" htmlFor="acct-phone">
              <TextInput id="acct-phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} inputMode="tel" autoComplete="off" />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" size="sm" disabled={busy}>
              {busy ? 'Saving' : 'Save details'}
            </Button>
            {notice ? <Notice {...notice} /> : null}
          </div>
        </form>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <div className="min-w-0">
            <p className="text-sm font-bold">{active ? 'Account is on' : 'Account is switched off'}</p>
            <p className="text-xs text-muted-foreground">{isSelf ? 'You cannot switch off your own account.' : active ? 'Switching it off stops this person using the platform. Nothing is deleted.' : 'Switch it on to let this person back in.'}</p>
          </div>
          <Switch checked={active} disabled={isSelf || switching} label={active ? 'Switch the account off' : 'Switch the account on'} onChange={(value) => (value ? void setActive(true) : setConfirmOff(true))} />
        </div>
      </Section>

      <ConfirmDialog
        open={confirmOff}
        onClose={() => {
          setConfirmOff(false)
          setSwitchError('')
        }}
        title="Switch this account off?"
        description={user.full_name || user.email || undefined}
        confirmLabel="Switch off"
        destructive
        busy={switching}
        error={switchError}
        onConfirm={() => void setActive(false)}
      >
        <p>They will not be able to use the platform until you switch the account back on. Their data stays as it is.</p>
      </ConfirmDialog>
    </>
  )
}

function RoleSection({ detail, isSelf, onChanged }: { detail: AdminUserDetail; isSelf: boolean; onChanged: Changed }) {
  const [role, setRole] = React.useState<string>(detail.user.role)
  const [confirm, setConfirm] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')

  const change = async () => {
    setBusy(true)
    setError('')
    try {
      await adminPost('/api/admin/update-role', { userId: detail.user.id, newRole: role })
      setConfirm(false)
      onChanged(`Role changed to ${ROLE_LABEL[role].toLowerCase()}.`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Section title="Role" hint={isSelf ? 'You cannot change your own role.' : 'The role decides which dashboard this person sees and what they can do.'}>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Role" htmlFor="acct-role" className="w-52">
            <SelectInput id="acct-role" value={role} onChange={(e) => setRole(e.target.value)} disabled={isSelf}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <SmoothButton variant="outline" shape="pill" disabled={isSelf || role === detail.user.role} onClick={() => setConfirm(true)}>
            Change role
          </SmoothButton>
        </div>
      </Section>

      <ConfirmDialog open={confirm} onClose={() => { setConfirm(false); setError('') }} title={`Change the role to ${ROLE_LABEL[role]?.toLowerCase()}?`} description={detail.user.full_name || detail.user.email || undefined} confirmLabel="Change role" destructive busy={busy} error={error} onConfirm={() => void change()}>
        <p>This person will see the {ROLE_LABEL[role]?.toLowerCase()} dashboard from now on. Records they created under the old role are not moved.</p>
      </ConfirmDialog>
    </>
  )
}

function StudentSection({ detail, onChanged }: { detail: AdminUserDetail; onChanged: Changed }) {
  const student = detail.student
  const [form, setForm] = React.useState({
    name: student?.name ?? '',
    course: student?.course ?? '',
    cgpa: student?.cgpa != null ? String(student.cgpa) : '',
    p10: student?.percentage_10th != null ? String(student.percentage_10th) : '',
    p12: student?.percentage_12th != null ? String(student.percentage_12th) : '',
  })
  const [busy, setBusy] = React.useState(false)
  const [notice, setNotice] = React.useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [visible, setVisible] = React.useState(student?.profile_is_public === true)
  const [toggling, setToggling] = React.useState(false)
  const [toggleError, setToggleError] = React.useState('')

  if (!student) {
    return (
      <Section title="Student record">
        <p className="text-sm text-muted-foreground">This student has not set up their record yet, so there is nothing more to show.</p>
      </Section>
    )
  }

  const num = (value: string) => (value.trim() === '' ? null : Number(value))
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setNotice(null)
    try {
      await adminPost('/api/admin/update-student', { id: student.id, name: form.name, course: form.course, cgpa: num(form.cgpa), percentage_10th: num(form.p10), percentage_12th: num(form.p12) })
      setNotice({ tone: 'success', text: 'Academic record saved.' })
      onChanged('Academic record saved.')
    } catch (err) {
      setNotice({ tone: 'error', text: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const toggleVisible = async (value: boolean) => {
    setToggling(true)
    setToggleError('')
    try {
      await adminPost('/api/admin/toggle-company-access', { studentId: student.id, isPublic: value })
      setVisible(value)
      onChanged(value ? 'Companies can now see this student.' : 'This student is hidden from companies.')
    } catch (err) {
      setToggleError((err as Error).message)
    } finally {
      setToggling(false)
    }
  }

  const docs = DOC_TYPES.map((type) => ({ type, doc: detail.docs.find((d) => d.type === type) }))

  return (
    <>
      <Section title="Scores">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <ScoreRing value={student.trust_score ?? 0} label="Trust score" size={76} />
            <div>
              <p className="text-sm font-extrabold">Trust score</p>
              <p className="text-xs text-muted-foreground">{student.verified_docs_count ?? 0} documents verified</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ScoreRing value={student.ats_score ?? 0} label="ATS score" size={76} />
            <div>
              <p className="text-sm font-extrabold">ATS score</p>
              <p className="text-xs text-muted-foreground">From the resume</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Academic record" hint="Correct what is wrong. Every change is written to the audit log.">
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Name on the student record" htmlFor="stu-name">
              <TextInput id="stu-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} />
            </Field>
            <Field label="Course" htmlFor="stu-course">
              <TextInput id="stu-course" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} maxLength={80} />
            </Field>
            <Field label="CGPA" htmlFor="stu-cgpa">
              <TextInput id="stu-cgpa" type="number" inputMode="decimal" step="0.01" min={0} max={10} value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="10th percentage" htmlFor="stu-p10">
                <TextInput id="stu-p10" type="number" inputMode="decimal" step="0.1" min={0} max={100} value={form.p10} onChange={(e) => setForm({ ...form, p10: e.target.value })} />
              </Field>
              <Field label="12th percentage" htmlFor="stu-p12">
                <TextInput id="stu-p12" type="number" inputMode="decimal" step="0.1" min={0} max={100} value={form.p12} onChange={(e) => setForm({ ...form, p12: e.target.value })} />
              </Field>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" size="sm" disabled={busy}>
              {busy ? 'Saving' : 'Save record'}
            </Button>
            {notice ? <Notice {...notice} /> : null}
          </div>
        </form>
        <div className="mt-4">
          <Facts
            items={[
              { label: 'Branch', value: student.branch },
              { label: 'Graduation year', value: student.graduation_year },
              { label: 'Roll number', value: student.roll_number },
              { label: 'City', value: student.city },
              { label: 'State', value: student.state },
              { label: 'Linked university', value: detail.linkedUniversity },
            ]}
          />
        </div>
      </Section>

      <Section title="Visible to companies" hint="Companies only see students whose profile is open. A student controls this in their own Settings, and an admin can override it.">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold">{visible ? 'Companies can see this student' : 'Hidden from companies'}</p>
          <Switch checked={visible} disabled={toggling} label={visible ? 'Hide this student from companies' : 'Show this student to companies'} onChange={(value) => void toggleVisible(value)} />
        </div>
        {toggleError ? (
          <div className="mt-2">
            <Notice tone="error" text={toggleError} />
          </div>
        ) : null}
      </Section>

      <Section title="Documents" hint="Press Review to open a document in the verification screen.">
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {docs.map(({ type, doc }) => (
            <li key={type} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <span className="min-w-0 truncate text-sm font-semibold">{docLabel(type)}</span>
              <span className="flex shrink-0 items-center gap-2">
                <StatusBadge status={doc?.status ?? 'not_submitted'} />
                {doc && doc.status !== 'not_submitted' ? (
                  <Link href={`/dashboard/admin/verifications?verification=${doc.id}`} className="text-xs font-bold text-brand-ink hover:underline">
                    Review
                  </Link>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </>
  )
}

function OrganisationSection({ detail }: { detail: AdminUserDetail }) {
  const { company, university, counts, user } = detail
  if (user.role === 'company') {
    return (
      <Section title="Company" hint="Approval and details are managed on the Companies page.">
        <Facts
          items={[
            { label: 'Company', value: company?.company_name },
            { label: 'Industry', value: company?.industry },
            { label: 'Size', value: company?.company_size },
            { label: 'Website', value: company?.website },
            { label: 'State', value: company?.state },
            { label: 'GST number', value: company?.gst_number },
            { label: 'Approved', value: company ? (company.is_verified ? 'Yes' : 'Not yet') : 'No company record' },
            { label: 'Applications received', value: counts.applications ?? 0 },
            { label: 'Candidates saved', value: counts.saved ?? 0 },
          ]}
        />
        <div className="mt-3">
          <Link href={`/dashboard/admin/companies?q=${encodeURIComponent(company?.company_name || user.email || '')}`} className="text-xs font-bold text-brand-ink hover:underline">
            Open on the Companies page
          </Link>
        </div>
      </Section>
    )
  }
  if (user.role === 'university') {
    return (
      <Section title="University" hint="Approval and details are managed on the Universities page.">
        <Facts
          items={[
            { label: 'University', value: university?.university_name },
            { label: 'City', value: university?.city },
            { label: 'State', value: university?.state },
            { label: 'UGC id', value: university?.ugc_id },
            { label: 'NAAC grade', value: university?.naac_grade },
            { label: 'Approved', value: university ? (university.is_verified ? 'Yes' : 'Not yet') : 'No university record' },
            { label: 'Students linked', value: counts.students ?? 0 },
          ]}
        />
        <div className="mt-3">
          <Link href={`/dashboard/admin/outreach?q=${encodeURIComponent(university?.university_name || user.email || '')}`} className="text-xs font-bold text-brand-ink hover:underline">
            Open on the Universities page
          </Link>
        </div>
      </Section>
    )
  }
  return null
}

function UserDialog({ id, adminId, onClose, onChanged }: { id: string | null; adminId: string | null; onClose: () => void; onChanged: () => void }) {
  const [detail, setDetail] = React.useState<AdminUserDetail | null>(null)
  const [error, setError] = React.useState('')
  const [notice, setNotice] = React.useState('')

  const load = React.useCallback(async () => {
    if (!id) return
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'The account could not be loaded.')
      setDetail(body as AdminUserDetail)
      setError('')
    } catch (err) {
      setError((err as Error).message)
    }
  }, [id])

  React.useEffect(() => {
    setDetail(null)
    setError('')
    setNotice('')
    void load()
  }, [load])

  const changed: Changed = (message) => {
    setNotice(message)
    void load()
    onChanged()
  }

  const user = detail?.user
  const isSelf = Boolean(user && user.id === adminId)

  return (
    <Dialog
      open={Boolean(id)}
      onClose={onClose}
      title={user ? user.full_name || user.email || 'Account' : 'Account'}
      description={user ? `${ROLE_LABEL[user.role] ?? user.role}, joined ${formatDateShort(user.created_at) || 'on an unknown date'}` : undefined}
      size="lg"
      footer={user?.email ? <CopyButton value={user.email} /> : null}
    >
      {!detail ? (
        error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : (
          <div className="space-y-3" aria-busy="true">
            <div className="skeleton h-16" />
            <div className="skeleton h-40" />
            <div className="skeleton h-28" />
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <ProfileAvatar name={detail.user.full_name} email={detail.user.email} avatarUrl={detail.user.avatar_url} size={56} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge role={detail.user.role} />
                {isActive(detail.user) ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Switched off</Badge>}
                {isSelf ? <Badge tone="neutral">This is you</Badge> : null}
              </div>
              <p className="mt-1 truncate text-sm font-semibold">{detail.user.email}</p>
              <p className="text-xs text-muted-foreground">{detail.user.last_login_at ? `Last signed in ${timeAgo(detail.user.last_login_at)}` : 'Has not signed in yet'}</p>
            </div>
          </div>

          {notice ? <Notice tone="success" text={notice} /> : null}

          {detail.user.role === 'student' ? <StudentSection key={`s-${detail.user.id}`} detail={detail} onChanged={changed} /> : <OrganisationSection detail={detail} />}
          <AccountSection key={`a-${detail.user.id}`} detail={detail} isSelf={isSelf} onChanged={changed} />
          <RoleSection key={`r-${detail.user.id}`} detail={detail} isSelf={isSelf} onChanged={changed} />
        </div>
      )}
    </Dialog>
  )
}

export default function AdminUsersPage() {
  const params = useSearchParams()
  const { userId } = useDash()
  const { data, loading, error, refresh } = useAdminResource<{ users: AdminUser[] }>('/api/admin/users', { tables: ['profiles'] })
  const [openId, setOpenId] = React.useState<string | null>(null)
  const users = React.useMemo(() => data?.users ?? [], [data])
  const query = params?.get('q') ?? ''

  // A link from search carries an email. When it matches one account, open that account.
  const opened = React.useRef('')
  React.useEffect(() => {
    if (!query || opened.current === query || users.length === 0) return
    const exact = users.filter((u) => u.email?.toLowerCase() === query.toLowerCase())
    opened.current = query
    if (exact.length === 1) setOpenId(exact[0].id)
  }, [query, users])

  const counts = React.useMemo(
    () => ({
      students: users.filter((u) => u.role === 'student').length,
      organisations: users.filter((u) => u.role === 'company' || u.role === 'university').length,
      admins: users.filter((u) => u.role === 'admin').length,
      off: users.filter((u) => !isActive(u)).length,
    }),
    [users],
  )

  const exportCsv = () =>
    saveCsv(`accounts_${new Date().toISOString().slice(0, 10)}.csv`, [
      ['Name', 'Email', 'Role', 'Phone', 'Status', 'Joined', 'Last sign in'],
      ...users.map((u) => [u.full_name ?? '', u.email ?? '', ROLE_LABEL[u.role] ?? u.role, u.phone ?? '', isActive(u) ? 'Active' : 'Switched off', formatDateShort(u.created_at), formatDateShort(u.last_login_at)]),
    ])

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Account',
      sortValue: (u) => u.full_name || u.email || '',
      cell: (u) => (
        <button type="button" onClick={() => setOpenId(u.id)} className="flex min-w-0 max-w-[18rem] items-center gap-3 text-left">
          <ProfileAvatar name={u.full_name} email={u.email} avatarUrl={u.avatar_url} size={34} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{u.full_name || 'No name'}</span>
            <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
          </span>
        </button>
      ),
    },
    { key: 'role', header: 'Role', sortValue: (u) => u.role, cell: (u) => <RoleBadge role={u.role} /> },
    { key: 'status', header: 'Status', hideOnMobile: true, sortValue: (u) => (isActive(u) ? 1 : 0), cell: (u) => (isActive(u) ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Switched off</Badge>) },
    { key: 'joined', header: 'Joined', hideOnMobile: true, sortValue: (u) => u.created_at ?? '', cell: (u) => <span className="text-muted-foreground">{formatDateShort(u.created_at)}</span> },
    { key: 'login', header: 'Last sign in', hideOnMobile: true, sortValue: (u) => u.last_login_at ?? '', cell: (u) => <span className="text-muted-foreground">{u.last_login_at ? timeAgo(u.last_login_at) : 'Never'}</span> },
  ]

  if (loading) return <PageSkeleton metrics={4} panels={2} />
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />

  const FOLDER_LIMIT = 60
  const entry = (u: AdminUser) => ({
    id: u.id,
    name: u.full_name || u.email || 'Account',
    kind: 'person' as const,
    meta: [ROLE_LABEL[u.role] ?? u.role, u.email].filter(Boolean).join(', '),
    date: formatDateShort(u.created_at),
    timestamp: u.created_at ? new Date(u.created_at).getTime() : 0,
    status: isActive(u) ? undefined : { label: 'Switched off', tone: 'danger' as const },
    onOpen: () => setOpenId(u.id),
    copyValue: u.email || undefined,
    copyLabel: 'Email',
  })
  const base: Omit<FolderSpec, 'meta'>[] = [
    { id: 'students', label: 'Students', art: 'obsidian', subtitle: 'Every student account', entries: users.filter((u) => u.role === 'student').slice(0, FOLDER_LIMIT).map(entry), emptyTitle: 'No students yet' },
    { id: 'orgs', label: 'Organisations', art: 'ember', subtitle: 'Company and university accounts', entries: users.filter((u) => u.role === 'company' || u.role === 'university').slice(0, FOLDER_LIMIT).map(entry), emptyTitle: 'No organisations yet' },
    { id: 'admins', label: 'Admins', art: 'crimson', subtitle: 'People who run the platform', entries: users.filter((u) => u.role === 'admin').slice(0, FOLDER_LIMIT).map(entry), emptyTitle: 'No admins' },
  ]
  const totals: Record<string, number> = { students: counts.students, orgs: counts.organisations, admins: counts.admins }
  const folders: FolderSpec[] = base.map((f) => ({ ...f, meta: totals[f.id] === 0 ? 'Empty' : `${formatNumber(totals[f.id])} ${totals[f.id] === 1 ? 'account' : 'accounts'}` }))

  return (
    <>
      <PageHeader
        title="All users"
        description="Every account on the platform. Open one to edit details, change a role, switch it off, or manage a student."
        actions={
          <SmoothButton size="sm" variant="outline" shape="pill" onClick={exportCsv} disabled={users.length === 0}>
            Export CSV
          </SmoothButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Accounts" icon={<Users />} value={users.length} detail="Across every role" />
        <Metric index={1} title="Students" icon={<ShieldCheck />} value={counts.students} detail="Building a verified profile" />
        <Metric index={2} title="Organisations" icon={<Building2 />} value={counts.organisations} detail="Companies and universities" />
        <Metric index={3} title="Switched off" icon={<UserX />} value={counts.off} detail={counts.off === 0 ? 'Everyone can sign in' : 'Cannot use the platform'} />
      </div>

      <div className="mt-3">
        <Panel index={4} title="Account folders" subtitle="Press a folder to open the accounts inside it">
          {users.length === 0 ? <EmptyState icon={<Users />} title="No accounts yet" /> : <FolderShelf folders={folders} />}
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={5} title="Accounts" subtitle="Search, filter and sort. Press a row to open the account.">
          <DataTable
            label="Accounts"
            rows={users}
            columns={columns}
            getRowId={(u) => u.id}
            searchText={(u) => `${u.full_name ?? ''} ${u.email ?? ''} ${u.phone ?? ''} ${ROLE_LABEL[u.role] ?? u.role}`}
            searchPlaceholder="Search by name, email or phone"
            pageSize={10}
            onRowClick={(u) => setOpenId(u.id)}
            initialQuery={query}
            emptyTitle="No accounts yet"
            filters={[
              { id: 'role', label: 'All roles', options: ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] })), predicate: (u, v) => u.role === v },
              { id: 'status', label: 'Any status', options: [{ value: 'active', label: 'Active' }, { value: 'off', label: 'Switched off' }], predicate: (u, v) => (v === 'active' ? isActive(u) : !isActive(u)) },
            ]}
          />
        </Panel>
      </div>

      <UserDialog id={openId} adminId={userId} onClose={() => setOpenId(null)} onChanged={() => void refresh()} />
    </>
  )
}

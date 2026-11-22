'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { CircleCheck, Clock3, Users, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDash } from '@/components/dash/dashboard-context'
import { DataTable, type Column } from '@/components/dash/data-table'
import { Dialog } from '@/components/dash/dialog'
import { EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel, StatusBadge } from '@/components/dash/kit'
import { ProfileAvatar } from '@/components/dash/profile-avatar'
import { ScoreRing } from '@/components/dash/analysis-report'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { saveCsv } from '@/lib/csv'
import { formatDateShort } from '@/lib/format'

interface Applicant {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  trust_score: number
  ats_score: number
  verified_documents: number
  course: string
  branch: string
  city: string
  state: string
  graduation_year: number | null
  cgpa: number | null
  skills: string[]
}

interface Application {
  id: string
  student_id: string
  job_title: string | null
  status: string | null
  company_notes: string | null
  created_at: string
  applicant: Applicant
}

export default function ApplicantsPage() {
  const params = useSearchParams()
  const { userId } = useDash()
  const [applications, setApplications] = React.useState<Application[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [open, setOpen] = React.useState<Application | null>(null)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/company/applications', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Applications could not be loaded.')
      setApplications(data.applications ?? [])
      setError('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (!userId) return
    void load()
    const channel = supabase
      .channel(`applicants_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications', filter: `company_id=eq.${userId}` }, () => void load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, load])

  const wanted = params?.get('application')
  React.useEffect(() => {
    if (!wanted) return
    const found = applications.find((a) => a.id === wanted)
    if (found) setOpen(found)
  }, [wanted, applications])

  const setStatus = async (application: Application, status: 'pending' | 'accepted' | 'rejected') => {
    const before = applications
    setNotice('')
    setApplications((prev) => prev.map((a) => (a.id === application.id ? { ...a, status } : a)))
    setOpen((prev) => (prev && prev.id === application.id ? { ...prev, status } : prev))
    try {
      const res = await fetch('/api/company/applications/update-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId: application.id, status }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'The status could not be changed.')
    } catch (err) {
      setApplications(before)
      setOpen((prev) => (prev && prev.id === application.id ? { ...prev, status: application.status } : prev))
      setNotice((err as Error).message)
    }
  }

  const count = (status: string) => applications.filter((a) => (a.status || 'pending') === status).length

  const actions = (application: Application) => (
    <span className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
      <SmoothButton size="xs" variant="outline" shape="pill" disabled={application.status === 'accepted'} onClick={() => void setStatus(application, 'accepted')} aria-label={`Accept ${application.applicant.full_name}`}>
        Accept
      </SmoothButton>
      <SmoothButton size="xs" variant="ghost" shape="pill" disabled={application.status === 'rejected'} onClick={() => void setStatus(application, 'rejected')} aria-label={`Reject ${application.applicant.full_name}`}>
        Reject
      </SmoothButton>
    </span>
  )

  const columns: Column<Application>[] = [
    {
      key: 'applicant',
      header: 'Applicant',
      sortValue: (a) => a.applicant.full_name,
      cell: (a) => (
        <span className="flex min-w-0 items-center gap-3">
          <ProfileAvatar name={a.applicant.full_name} avatarUrl={a.applicant.avatar_url} size={36} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold">{a.applicant.full_name}</span>
            <span className="block truncate text-xs text-muted-foreground">{a.applicant.email}</span>
          </span>
        </span>
      ),
    },
    { key: 'role', header: 'Applied for', sortValue: (a) => a.job_title ?? '', cell: (a) => <span className="font-semibold">{a.job_title}</span> },
    { key: 'course', header: 'Course', hideOnMobile: true, sortValue: (a) => a.applicant.course, cell: (a) => <span className="text-muted-foreground">{[a.applicant.course, a.applicant.branch].filter(Boolean).join(' ') || 'Not added'}</span> },
    { key: 'trust', header: 'Trust', align: 'right', hideOnMobile: true, sortValue: (a) => a.applicant.trust_score, cell: (a) => <span className="tabular font-bold">{a.applicant.trust_score}</span> },
    { key: 'date', header: 'Applied', hideOnMobile: true, sortValue: (a) => a.created_at, cell: (a) => <span className="text-muted-foreground">{formatDateShort(a.created_at)}</span> },
    { key: 'status', header: 'Status', sortValue: (a) => a.status ?? 'pending', cell: (a) => <StatusBadge status={a.status || 'pending'} /> },
    { key: 'actions', header: 'Decision', align: 'right', cell: actions },
  ]

  const exportCsv = () =>
    saveCsv('applicants.csv', [
      ['Name', 'Email', 'Applied for', 'Status', 'Course', 'Branch', 'Graduation year', 'CGPA', 'ATS score', 'Trust score', 'Verified documents', 'Applied on'],
      ...applications.map((a) => [a.applicant.full_name, a.applicant.email, a.job_title, a.status || 'pending', a.applicant.course, a.applicant.branch, a.applicant.graduation_year, a.applicant.cgpa, a.applicant.ats_score, a.applicant.trust_score, a.applicant.verified_documents, formatDateShort(a.created_at)]),
    ])

  if (loading) return <PageSkeleton metrics={4} panels={1} />
  if (error) return <ErrorState message={error} onRetry={load} />

  const person = open?.applicant

  return (
    <>
      <PageHeader
        title="Applicants"
        description="Students who applied to your company. Accept or decline each application, and the student is told."
        actions={
          <SmoothButton size="sm" variant="outline" shape="pill" onClick={exportCsv} disabled={applications.length === 0}>
            Export CSV
          </SmoothButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Applications" icon={<Users />} value={applications.length} detail="All time" />
        <Metric index={1} title="Pending" icon={<Clock3 />} value={count('pending')} detail="Waiting for you" />
        <Metric index={2} title="Accepted" icon={<CircleCheck />} value={count('accepted')} detail="Told by notification" />
        <Metric index={3} title="Declined" icon={<XCircle />} value={count('rejected')} detail="Told by notification" />
      </div>

      <div className="mt-3">
        <Panel index={4} title="All applications" subtitle="Press a row for the full profile">
          {notice ? (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {notice}
            </p>
          ) : null}
          {applications.length === 0 ? (
            <EmptyState icon={<Users />} title="No applications yet" hint="Students apply from their dashboard. Keep your company profile complete so they can find you." action={<Button href="/dashboard/company/settings" variant="default" size="sm">Complete your profile</Button>} />
          ) : (
            <DataTable
              label="Applications"
              rows={applications}
              columns={columns}
              getRowId={(a) => a.id}
              searchText={(a) => `${a.applicant.full_name} ${a.job_title ?? ''} ${a.applicant.course} ${a.applicant.email}`}
              searchPlaceholder="Search applicants or roles"
              pageSize={8}
              onRowClick={(a) => setOpen(a)}
              filters={[
                {
                  id: 'status',
                  label: 'All statuses',
                  options: [
                    { value: 'pending', label: 'Pending' },
                    { value: 'accepted', label: 'Accepted' },
                    { value: 'rejected', label: 'Declined' },
                  ],
                  predicate: (a, value) => (a.status || 'pending') === value,
                },
              ]}
            />
          )}
        </Panel>
      </div>

      <Dialog
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={person?.full_name ?? ''}
        description={open ? `Applied for ${open.job_title} on ${formatDateShort(open.created_at)}` : undefined}
        size="lg"
        footer={
          open ? (
            <>
              <Button size="sm" variant="primary" disabled={open.status === 'accepted'} onClick={() => void setStatus(open, 'accepted')}>
                Accept
              </Button>
              <Button size="sm" variant="destructive" disabled={open.status === 'rejected'} onClick={() => void setStatus(open, 'rejected')}>
                Decline
              </Button>
              {open.status !== 'pending' ? (
                <SmoothButton size="sm" variant="ghost" shape="pill" onClick={() => void setStatus(open, 'pending')}>
                  Move back to pending
                </SmoothButton>
              ) : null}
              {person?.email ? <CopyButton value={person.email} /> : null}
            </>
          ) : null
        }
      >
        {open && person ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-5">
              <ScoreRing value={person.ats_score} label="ATS score" />
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={open.status || 'pending'} />
                  <span className="text-xs font-semibold text-muted-foreground">{person.verified_documents} documents verified</span>
                </p>
                <p className="text-muted-foreground">Trust score {person.trust_score} out of 100</p>
                {person.email ? <p className="truncate font-semibold">{person.email}</p> : null}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { label: 'Course', value: [person.course, person.branch].filter(Boolean).join(' ') },
                { label: 'Graduation year', value: person.graduation_year },
                { label: 'CGPA', value: person.cgpa },
                { label: 'Place', value: [person.city, person.state].filter(Boolean).join(', ') },
              ].map((fact) => (
                <div key={fact.label} className="glass-flat min-w-0 rounded-xl px-3 py-2.5">
                  <dt className="text-[11px] font-semibold text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-0.5 truncate text-sm font-bold">{fact.value || <span className="font-medium text-muted-foreground">Not added</span>}</dd>
                </div>
              ))}
            </dl>
            {person.skills.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="Skills">
                {person.skills.map((skill) => (
                  <li key={skill} className="rounded-lg border border-brand/40 bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-ink">
                    {skill}
                  </li>
                ))}
              </ul>
            ) : null}
            {open.company_notes ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <h4 className="text-xs font-extrabold text-foreground/80">Note from the student</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{open.company_notes}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </>
  )
}

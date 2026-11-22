'use client'

import * as React from 'react'
import Link from 'next/link'
import { BookOpen, CircleCheck, CreditCard, Eye, FileText, GraduationCap, Headphones, Home, Link2, Shield, TrendingUp } from 'lucide-react'
import { useDash } from '@/components/dash/dashboard-context'
import { useStudentData } from '@/hooks/use-student-data'
import { DonutChart, Meter, SERIES } from '@/components/dash/charts'
import { ErrorState, EmptyState, Metric, PageHeader, PageSkeleton, Panel, StatusBadge } from '@/components/dash/kit'
import { FolderShelf } from '@/components/dash/folder-shelf'
import { PinShelf } from '@/components/dash/pin-shelf'
import { QuickAccess } from '@/components/dash/quick-access'
import { buildDocFolders } from '@/components/dash/doc-folders'
import { DOC_META } from '@/components/dash/doc-meta'
import { usePeonPanel } from '@/components/peon/peon-provider'
import { Button } from '@/components/ui/button'
import { CORE_DOC_TYPES, DOC_ROUTE, docLabel, type DocType } from '@/lib/documents'
import { formatDateShort, timeAgo } from '@/lib/format'
import { isVerifiedStatus, statusInfo } from '@/lib/status'

export default function StudentDashboardPage() {
  const { displayName } = useDash()
  const peon = usePeonPanel()
  const { userId, student, verifications, byType, counts, loading, error, refresh } = useStudentData()

  const folders = React.useMemo(() => buildDocFolders(verifications), [verifications])
  const uploaded = verifications.filter((v) => v.status !== 'not_submitted')
  const activity = [...uploaded].sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime()).slice(0, 6)
  const ats = Number(byType.resume?.ai_result?.ats_score ?? student?.ats_score ?? 0) || 0
  const trust = student?.trust_score ?? 0
  const next = CORE_DOC_TYPES.find((type) => !isVerifiedStatus(byType[type]?.status))
  const firstName = displayName.split(/\s+/)[0]

  // The details that count toward completion, in the same order the score uses them.
  const missing = [
    { label: 'Your name', value: student?.name, href: '/dashboard/student/settings' },
    { label: 'Course', value: student?.course, href: '/dashboard/student/settings' },
    { label: 'Branch', value: student?.branch, href: '/dashboard/student/settings' },
    { label: 'City', value: student?.city, href: '/dashboard/student/settings' },
    { label: 'CGPA', value: student?.cgpa, href: '/dashboard/student/settings' },
    { label: 'Graduation year', value: student?.graduation_year, href: '/dashboard/student/settings' },
    { label: 'Your resume', value: byType.resume && byType.resume.status !== 'not_submitted' ? 'yes' : '', href: '/dashboard/student/resume' },
  ].filter((item) => !item.value)

  if (loading) return <PageSkeleton metrics={4} panels={2} />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return (
    <>
      <PageHeader
        title={`Hi ${firstName}`}
        description="Your verification progress and trust score, updated as results come in."
        actions={
          next ? (
            <Button href={DOC_ROUTE[next]} variant="primary" size="sm">
              Verify your {docLabel(next).toLowerCase()}
            </Button>
          ) : (
            <Button href="/dashboard/student/my-link" variant="primary" size="sm">
              Share your profile
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Trust score" icon={<Shield />} value={trust} suffix="out of 100" detail={`${counts.verified} of ${verifications.length || 7} documents verified`} />
        <Metric index={1} title="ATS score" icon={<FileText />} value={ats} suffix="out of 100" detail={ats ? 'From your latest resume' : 'Upload a resume to get one'} />
        <Metric index={2} title="Documents verified" icon={<CircleCheck />} value={counts.verified} suffix={`of ${verifications.length || 7}`} detail={counts.pending ? `${counts.pending} waiting for review` : 'Nothing waiting'} />
        <Metric index={3} title="Profile views" icon={<Eye />} value={student?.profile_views ?? 0} detail={student?.profile_is_public ? 'Your profile is public' : 'Your profile is private'} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Panel index={4} title="Verification progress" subtitle="The four documents that make up your trust score">
          <ul className="divide-y divide-white/10">
            {CORE_DOC_TYPES.map((type) => {
              const Icon = DOC_META[type].icon
              const row = byType[type]
              return (
                <li key={type}>
                  <Link href={DOC_ROUTE[type]} className="flex min-h-[60px] items-center gap-3 rounded-xl px-1 py-2.5 transition-colors hover:bg-white/[0.04]">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-ink">
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{docLabel(type)}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {row && row.status !== 'not_submitted' ? `Updated ${timeAgo(row.updated_at)}` : DOC_META[type].description}
                      </span>
                    </span>
                    <StatusBadge status={row?.status} />
                  </Link>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel index={5} title="Documents by status" subtitle="All of your documents">
          <DonutChart
            title="Documents by status"
            centerLabel="Documents"
            segments={[
              { label: 'Verified', value: counts.verified, color: SERIES.green },
              { label: 'Waiting for review', value: counts.pending, color: SERIES.amber },
              { label: 'Rejected', value: counts.rejected, color: SERIES.red },
              { label: 'Not submitted', value: counts.notSubmitted, color: SERIES.white },
            ]}
          />
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel index={6} title="Profile completion" subtitle="Filled details and verified documents">
          <div className="flex items-end justify-between gap-3">
            <span className="text-3xl font-extrabold tracking-tight">{student?.profile_complete_pct ?? 0}%</span>
            <Link href="/dashboard/student/settings" className="text-xs font-semibold text-brand-ink hover:underline">
              Edit your details
            </Link>
          </div>
          <Meter className="mt-3" label="Profile completion" value={student?.profile_complete_pct ?? 0} />
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-extrabold text-foreground/80">{missing.length ? 'Still missing' : 'Everything is filled in'}</h3>
            {missing.length ? (
              <ul className="space-y-1.5">
                {missing.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="flex min-h-9 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm transition-colors hover:bg-white/[0.07]">
                      <span className="font-semibold">{item.label}</span>
                      <span className="text-xs font-semibold text-brand-ink">Add</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Your details are complete. Verify every document to reach 100.</p>
            )}
          </div>
        </Panel>

        <Panel index={7} title="Recent activity" subtitle="Your latest document results">
          {activity.length === 0 ? (
            <EmptyState icon={<TrendingUp />} title="No activity yet" hint="Upload your first document to start building your profile." action={<Button href="/dashboard/student/resume" variant="primary" size="sm">Upload a resume</Button>} />
          ) : (
            <ol className="space-y-3">
              {activity.map((row) => {
                const info = statusInfo(row.status)
                return (
                  <li key={row.id} className="flex items-start gap-3">
                    <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${info.tone === 'success' ? 'bg-success' : info.tone === 'warning' ? 'bg-warning' : info.tone === 'danger' ? 'bg-danger' : 'bg-white/30'}`} />
                    <span className="min-w-0 text-sm">
                      <span className="font-bold">{docLabel(row.type)}</span>, {info.label}
                      <span className="block text-xs text-muted-foreground">{timeAgo(row.updated_at) || formatDateShort(row.updated_at)}</span>
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={8} title="Your documents" subtitle="Press a folder to open the files inside it">
          <FolderShelf folders={folders} />
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {uploaded.length > 0 && userId ? (
          <PinShelf
            index={9}
            storageKey={`credentia:pins:student:${userId}`}
            title="Pinned documents"
            subtitle="Pin the ones you open most"
            label="Documents"
            max={3}
            items={uploaded.map((row) => {
              const Icon = DOC_META[row.type as DocType]?.icon ?? FileText
              return {
                id: row.id,
                title: docLabel(row.type),
                meta: `${statusInfo(row.status).label}, updated ${formatDateShort(row.updated_at)}`,
                icon: <Icon className="size-4" />,
                href: DOC_ROUTE[row.type as DocType] ?? '/dashboard/student/saved',
              }
            })}
          />
        ) : (
          <Panel index={9} title="Pinned documents" subtitle="Pin the ones you open most">
            <EmptyState icon={<FileText />} title="Nothing to pin yet" hint="Documents you upload will appear here, ready to pin." />
          </Panel>
        )}

        <QuickAccess
          index={10}
          title="Quick access"
          subtitle="Pages you use most"
          items={[
            { title: 'Home', icon: Home, morph: 'home', href: '/dashboard/student' },
            { title: 'Resume', icon: FileText, href: '/dashboard/student/resume' },
            { title: 'Police', icon: Shield, href: '/dashboard/student/police' },
            { title: 'Aadhaar', icon: CreditCard, href: '/dashboard/student/aadhaar' },
            { title: 'Degree', icon: GraduationCap, href: '/dashboard/student/degree' },
            { title: 'My link', icon: Link2, href: '/dashboard/student/my-link' },
            { title: 'Ask Peon', icon: Headphones, onClick: () => peon.open() },
            { title: 'Guide', icon: BookOpen, morph: 'blog', href: '/how-it-works' },
          ]}
        />
      </div>
    </>
  )
}

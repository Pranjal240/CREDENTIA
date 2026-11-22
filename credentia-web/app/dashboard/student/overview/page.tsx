'use client'

import * as React from 'react'
import Link from 'next/link'
import { Eye, EyeOff, GraduationCap, Shield, TrendingUp, Users } from 'lucide-react'
import { useStudentData } from '@/hooks/use-student-data'
import { Meter } from '@/components/dash/charts'
import { ErrorState, Metric, PageHeader, PageSkeleton, Panel, StatusBadge } from '@/components/dash/kit'
import { DOC_META } from '@/components/dash/doc-meta'
import { Button } from '@/components/ui/button'
import { DOC_ROUTE, DOC_TYPES, docLabel } from '@/lib/documents'

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/10 py-2.5 last:border-b-0">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm font-bold">{value || <span className="font-medium text-muted-foreground">Not added</span>}</dd>
    </div>
  )
}

export default function StudentOverviewPage() {
  const { student, byType, counts, loading, error, refresh } = useStudentData()
  const [university, setUniversity] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!student?.university_id) {
      setUniversity(null)
      return
    }
    let alive = true
    fetch('/api/student/universities', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (alive) setUniversity(data?.universities?.find((u: { id: string; name: string }) => u.id === student.university_id)?.name ?? null)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [student?.university_id])

  if (loading) return <PageSkeleton metrics={4} panels={2} />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const ats = Number(byType.resume?.ai_result?.ats_score ?? student?.ats_score ?? 0) || 0
  const isPublic = student?.profile_is_public === true

  return (
    <>
      <PageHeader
        title="Overview"
        description="The details and scores read from your documents. This is the information your profile is built from."
        actions={
          <Button href="/dashboard/student/settings" variant="default" size="sm">
            Edit details
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Trust score" icon={<Shield />} value={student?.trust_score ?? 0} suffix="out of 100" detail={`${counts.verified} documents verified`} />
        <Metric index={1} title="ATS score" icon={<TrendingUp />} value={ats} suffix="out of 100" detail={ats ? 'From your resume' : 'No resume yet'} />
        <Metric index={2} title="CGPA" icon={<GraduationCap />} value={Number(student?.cgpa ?? 0)} format="decimal" detail={student?.cgpa ? 'Out of 10' : 'Not added'} />
        <Metric index={3} title="Profile views" icon={<Users />} value={student?.profile_views ?? 0} detail="People who opened your link" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel index={4} title="Academic details" subtitle="Filled from your documents, editable in Settings">
          <dl>
            <Row label="Course" value={student?.course} />
            <Row label="Branch" value={student?.branch} />
            <Row label="Graduation year" value={student?.graduation_year} />
            <Row label="CGPA" value={student?.cgpa} />
            <Row label="10th percentage" value={student?.percentage_10th ? `${student.percentage_10th}%` : null} />
            <Row label="12th percentage" value={student?.percentage_12th ? `${student.percentage_12th}%` : null} />
            <Row label="City" value={student?.city} />
            <Row label="State" value={student?.state} />
            <Row label="University" value={university} />
          </dl>
        </Panel>

        <div className="space-y-3">
          <Panel index={5} title="Scores">
            <div className="space-y-4">
              {[
                { label: 'Trust score', value: student?.trust_score ?? 0 },
                { label: 'ATS score', value: ats },
                { label: 'Profile completion', value: student?.profile_complete_pct ?? 0 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex justify-between text-xs font-semibold">
                    <span>{item.label}</span>
                    <span className="tabular text-muted-foreground">{item.value} out of 100</span>
                  </div>
                  <Meter label={item.label} value={item.value} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel index={6} title="What companies can see">
            <div className="flex items-start gap-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl border ${isPublic ? 'border-success/40 bg-success/10 text-success' : 'border-white/15 bg-white/[0.05] text-muted-foreground'}`}>
                {isPublic ? <Eye className="size-[18px]" aria-hidden="true" /> : <EyeOff className="size-[18px]" aria-hidden="true" />}
              </span>
              <div className="min-w-0 text-sm">
                <p className="font-bold">{isPublic ? 'Your profile is public' : 'Your profile is private'}</p>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  {isPublic
                    ? 'Companies can find you in talent search and see your name, course, scores and which documents are verified. Your public link works too.'
                    : 'Companies cannot find you and your public link is switched off. Turn it on when you are ready to be found.'}
                </p>
                <Link href="/dashboard/student/my-link" className="mt-2 inline-block text-xs font-semibold text-brand-ink hover:underline">
                  Change this on My Link
                </Link>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="mt-3">
        <Panel index={7} title="Document checklist" subtitle="Every document and where it stands">
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {DOC_TYPES.map((type) => {
              const Icon = DOC_META[type].icon
              return (
                <li key={type}>
                  <Link href={DOC_ROUTE[type]} className="flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.07]">
                    <Icon className="size-[18px] shrink-0 text-brand-ink" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">{docLabel(type)}</span>
                    <StatusBadge status={byType[type]?.status} />
                  </Link>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>
    </>
  )
}

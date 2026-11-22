'use client'

import * as React from 'react'
import { BookmarkCheck, CircleCheck, Shield, TrendingUp, Users } from 'lucide-react'
import { useTalent } from '@/hooks/use-talent'
import { BarsChart, DonutChart, Meter, SERIES } from '@/components/dash/charts'
import { EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel } from '@/components/dash/kit'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { Button } from '@/components/ui/button'
import { saveCsv } from '@/lib/csv'
import { docLabel, type DocType } from '@/lib/documents'
import { isVerifiedStatus } from '@/lib/status'

const BINS = [
  { label: '0 to 30', test: (n: number) => n <= 30 },
  { label: '31 to 50', test: (n: number) => n > 30 && n <= 50 },
  { label: '51 to 70', test: (n: number) => n > 50 && n <= 70 },
  { label: '71 to 90', test: (n: number) => n > 70 && n <= 90 },
  { label: '91 to 100', test: (n: number) => n > 90 },
]

const COVERAGE: DocType[] = ['resume', 'police', 'aadhaar', 'degree', 'marksheet_10th', 'marksheet_12th']

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

export default function CompanyAnalyticsPage() {
  const { talent, savedIds, loading, error, refresh } = useTalent()
  const [applications, setApplications] = React.useState<{ status: string | null }[]>([])

  React.useEffect(() => {
    fetch('/api/company/applications', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { applications: [] }))
      .then((data) => setApplications(data.applications ?? []))
      .catch(() => undefined)
  }, [])

  const stats = React.useMemo(() => {
    const total = talent.length
    const fully = talent.filter((t) => t.police_verified && t.aadhaar_verified && t.degree_verified).length
    const high = talent.filter((t) => t.ats_score >= 70).length
    const avgTrust = total ? Math.round(talent.reduce((s, t) => s + t.trust_score, 0) / total) : 0
    const avgAts = total ? Math.round(talent.reduce((s, t) => s + t.ats_score, 0) / total) : 0

    const courses = new Map<string, number>()
    const years = new Map<number, number>()
    for (const t of talent) {
      if (t.course) courses.set(t.course, (courses.get(t.course) ?? 0) + 1)
      if (t.graduation_year) years.set(t.graduation_year, (years.get(t.graduation_year) ?? 0) + 1)
    }

    return {
      total,
      fully,
      high,
      avgTrust,
      avgAts,
      bins: BINS.map((b) => ({ label: b.label, values: [talent.filter((t) => b.test(t.ats_score)).length] })),
      coverage: COVERAGE.map((type) => ({ type, count: talent.filter((t) => t.docs.some((d) => d.type === type && isVerifiedStatus(d.status))).length })),
      topCourses: Array.from(courses.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, count]) => ({ label, values: [count] })),
      years: Array.from(years.entries()).sort((a, b) => a[0] - b[0]).map(([label, count]) => ({ label: String(label), values: [count] })),
    }
  }, [talent])

  const appCount = (status: string) => applications.filter((a) => (a.status || 'pending') === status).length

  const exportCsv = () =>
    saveCsv('talent_pool.csv', [
      ['Name', 'Course', 'Branch', 'Graduation year', 'CGPA', 'ATS score', 'Trust score', 'Police verified', 'Aadhaar verified', 'Degree verified', 'Verified documents'],
      ...talent.map((t) => [t.name, t.course, t.branch, t.graduation_year, t.cgpa, t.ats_score, t.trust_score, t.police_verified ? 'Yes' : 'No', t.aadhaar_verified ? 'Yes' : 'No', t.degree_verified ? 'Yes' : 'No', t.verified_docs_count]),
    ])

  if (loading) return <PageSkeleton metrics={4} panels={2} />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return (
    <>
      <PageHeader
        title="Analytics"
        description="The talent pool as it stands today, counted from the verified records."
        actions={
          <SmoothButton size="sm" variant="outline" shape="pill" onClick={exportCsv} disabled={talent.length === 0}>
            Export CSV
          </SmoothButton>
        }
      />

      {stats.total === 0 ? (
        <Panel>
          <EmptyState icon={<Users />} title="No public profiles yet" hint="Charts appear once students make their profile public." action={<Button href="/dashboard/company" variant="default" size="sm">Open talent search</Button>} />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric index={0} emphasis title="Talent pool" icon={<Users />} value={stats.total} detail="Public profiles" />
            <Metric index={1} title="Fully verified" icon={<CircleCheck />} value={pct(stats.fully, stats.total)} format="percent" detail={`${stats.fully} students`} />
            <Metric index={2} title="ATS 70 or above" icon={<TrendingUp />} value={pct(stats.high, stats.total)} format="percent" detail={`${stats.high} students`} />
            <Metric index={3} title="Saved by you" icon={<BookmarkCheck />} value={savedIds.size} detail={`Average trust ${stats.avgTrust}`} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr]">
            <Panel index={4} title="ATS score spread" subtitle={`Average ${stats.avgAts} out of 100`}>
              <BarsChart title="Students by ATS score band" series={[{ label: 'Students', color: SERIES.red }]} items={stats.bins} />
            </Panel>
            <Panel index={5} title="Applications" subtitle="Where your applicants stand">
              {applications.length === 0 ? (
                <EmptyState icon={<Users />} title="No applications yet" hint="Applications from students appear here." />
              ) : (
                <DonutChart
                  title="Applications by status"
                  centerLabel="Applications"
                  segments={[
                    { label: 'Pending', value: appCount('pending'), color: SERIES.amber },
                    { label: 'Accepted', value: appCount('accepted'), color: SERIES.green },
                    { label: 'Declined', value: appCount('rejected'), color: SERIES.red },
                  ]}
                />
              )}
            </Panel>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Panel index={6} title="Document coverage" subtitle="Share of the pool with each document verified">
              <ul className="space-y-3.5">
                {stats.coverage.map((item) => (
                  <li key={item.type}>
                    <div className="mb-1.5 flex justify-between text-xs font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <Shield className="size-3.5 text-brand-ink" aria-hidden="true" />
                        {docLabel(item.type)}
                      </span>
                      <span className="tabular text-muted-foreground">
                        {pct(item.count, stats.total)}%, {item.count} of {stats.total}
                      </span>
                    </div>
                    <Meter label={`${docLabel(item.type)} coverage`} value={pct(item.count, stats.total)} />
                  </li>
                ))}
              </ul>
            </Panel>

            <div className="space-y-3">
              <Panel index={7} title="Top courses" subtitle="Where candidates are studying">
                {stats.topCourses.length === 0 ? (
                  <EmptyState title="No courses added yet" hint="Students add their course in Settings or through a verified degree." />
                ) : (
                  <BarsChart title="Students by course" series={[{ label: 'Students', color: SERIES.white }]} items={stats.topCourses} height={150} />
                )}
              </Panel>
              <Panel index={8} title="Graduation years">
                {stats.years.length === 0 ? <EmptyState title="No years added yet" /> : <BarsChart title="Students by graduation year" series={[{ label: 'Students', color: SERIES.red }]} items={stats.years} height={130} />}
              </Panel>
            </div>
          </div>
        </>
      )}
    </>
  )
}

'use client'

import * as React from 'react'
import { CircleCheck, GraduationCap, TrendingUp, Users } from 'lucide-react'
import { useRegistry } from '@/hooks/use-registry'
import { BarsChart, DonutChart, Meter, SERIES } from '@/components/dash/charts'
import { EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel } from '@/components/dash/kit'
import { PendingApproval } from '@/components/dash/pending-approval'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { saveCsv } from '@/lib/csv'
import { docLabel, type DocType } from '@/lib/documents'
import { isVerifiedStatus } from '@/lib/status'

const COVERAGE: DocType[] = ['resume', 'police', 'aadhaar', 'degree', 'marksheet_10th', 'marksheet_12th']
const CGPA_BANDS = [
  { label: 'Below 6', test: (c: number) => c < 6 },
  { label: '6 to 7', test: (c: number) => c >= 6 && c < 7 },
  { label: '7 to 8', test: (c: number) => c >= 7 && c < 8 },
  { label: '8 to 9', test: (c: number) => c >= 8 && c < 9 },
  { label: '9 and above', test: (c: number) => c >= 9 },
]

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

export default function UniversityAnalyticsPage() {
  const { approved, university, students, loading, error, refresh } = useRegistry()

  const stats = React.useMemo(() => {
    const total = students.length
    const fully = students.filter((s) => s.degree_verified && s.police_verified && s.aadhaar_verified).length
    const started = students.filter((s) => s.verified_docs_count > 0).length
    const withCgpa = students.filter((s) => s.cgpa)
    const avgCgpa = withCgpa.length ? withCgpa.reduce((sum, s) => sum + (s.cgpa ?? 0), 0) / withCgpa.length : 0
    const avgAts = total ? Math.round(students.reduce((sum, s) => sum + s.ats_score, 0) / total) : 0

    const courses = new Map<string, number>()
    const years = new Map<number, number>()
    for (const s of students) {
      if (s.course) courses.set(s.course, (courses.get(s.course) ?? 0) + 1)
      if (s.graduation_year) years.set(s.graduation_year, (years.get(s.graduation_year) ?? 0) + 1)
    }
    const sorted = Array.from(courses.entries()).sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 5)
    const rest = sorted.slice(5).reduce((sum, [, n]) => sum + n, 0)

    return {
      total,
      fully,
      started,
      avgCgpa,
      avgAts,
      cgpaBands: CGPA_BANDS.map((b) => ({ label: b.label, values: [withCgpa.filter((s) => b.test(s.cgpa ?? 0)).length] })),
      coverage: COVERAGE.map((type) => ({ type, count: students.filter((s) => s.docs.some((d) => d.type === type && isVerifiedStatus(d.status))).length })),
      courseSegments: [...top.map(([label, value]) => ({ label, value })), ...(rest ? [{ label: 'Other courses', value: rest }] : [])],
      years: Array.from(years.entries()).sort((a, b) => a[0] - b[0]).map(([label, count]) => ({ label: String(label), values: [count] })),
    }
  }, [students])

  const exportCsv = () =>
    saveCsv('university_verification_summary.csv', [
      ['Measure', 'Value'],
      ['Students', stats.total],
      ['Fully verified', stats.fully],
      ['Started verification', stats.started],
      ['Average CGPA', stats.avgCgpa.toFixed(2)],
      ['Average ATS score', stats.avgAts],
      ...stats.coverage.map((c) => [`${docLabel(c.type)} verified`, c.count]),
    ])

  if (loading) return <PageSkeleton metrics={4} panels={2} />
  if (error) return <ErrorState message={error} onRetry={refresh} />
  if (approved === false) return <PendingApproval name={university?.name} />

  const palette = [SERIES.red, SERIES.white, SERIES.amber, SERIES.green, SERIES.deep, SERIES.grey]

  return (
    <>
      <PageHeader
        title="Analytics"
        description="How far your students have got with verification, counted from their records."
        actions={
          <SmoothButton size="sm" variant="outline" shape="pill" onClick={exportCsv} disabled={stats.total === 0}>
            Export summary
          </SmoothButton>
        }
      />

      {stats.total === 0 ? (
        <Panel>
          <EmptyState icon={<Users />} title="No students are linked to you yet" hint="Charts appear once students link their account to your institution in Settings." />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric index={0} emphasis title="Students" icon={<Users />} value={stats.total} detail="Linked to you" />
            <Metric index={1} title="Fully verified" icon={<CircleCheck />} value={pct(stats.fully, stats.total)} format="percent" detail={`${stats.fully} students`} />
            <Metric index={2} title="Started verifying" icon={<GraduationCap />} value={pct(stats.started, stats.total)} format="percent" detail={`${stats.started} students`} />
            <Metric index={3} title="Average CGPA" icon={<TrendingUp />} value={Number(stats.avgCgpa.toFixed(1))} format="decimal" detail={`Average ATS ${stats.avgAts}`} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr]">
            <Panel index={4} title="CGPA spread" subtitle="Students with a CGPA on record">
              <BarsChart title="Students by CGPA band" series={[{ label: 'Students', color: SERIES.red }]} items={stats.cgpaBands} />
            </Panel>
            <Panel index={5} title="Verification progress" subtitle="All of your students">
              <DonutChart
                title="Students by verification progress"
                centerLabel="Students"
                segments={[
                  { label: 'Fully verified', value: stats.fully, color: SERIES.green },
                  { label: 'In progress', value: stats.started - stats.fully, color: SERIES.amber },
                  { label: 'Not started', value: stats.total - stats.started, color: SERIES.white },
                ]}
              />
            </Panel>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            <Panel index={6} title="Document coverage" subtitle="Share of students with each document verified">
              <ul className="space-y-3.5">
                {stats.coverage.map((item) => (
                  <li key={item.type}>
                    <div className="mb-1.5 flex justify-between text-xs font-semibold">
                      <span>{docLabel(item.type)}</span>
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
              <Panel index={7} title="Courses">
                {stats.courseSegments.length === 0 ? (
                  <EmptyState title="No courses added yet" />
                ) : (
                  <DonutChart title="Students by course" centerLabel="Students" segments={stats.courseSegments.map((s, i) => ({ ...s, color: palette[i % palette.length] }))} />
                )}
              </Panel>
              <Panel index={8} title="Graduation years">
                {stats.years.length === 0 ? <EmptyState title="No years added yet" /> : <BarsChart title="Students by graduation year" series={[{ label: 'Students', color: SERIES.white }]} items={stats.years} height={130} />}
              </Panel>
            </div>
          </div>
        </>
      )}
    </>
  )
}

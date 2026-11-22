'use client'

import * as React from 'react'
import { DashboardProvider } from '@/components/dash/dashboard-context'
import { DashboardShell } from '@/components/shell/dashboard-shell'
import type { DashRole } from '@/lib/dashboard-nav'

// Every dashboard page that can be previewed, keyed by its route under /dashboard.
const VIEWS: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  student: () => import('@/app/dashboard/student/page'),
  'student/overview': () => import('@/app/dashboard/student/overview/page'),
  'student/resume': () => import('@/app/dashboard/student/resume/page'),
  'student/police': () => import('@/app/dashboard/student/police/page'),
  'student/aadhaar': () => import('@/app/dashboard/student/aadhaar/page'),
  'student/degree': () => import('@/app/dashboard/student/degree/page'),
  'student/apply': () => import('@/app/dashboard/student/apply/page'),
  'student/saved': () => import('@/app/dashboard/student/saved/page'),
  'student/my-link': () => import('@/app/dashboard/student/my-link/page'),
  'student/settings': () => import('@/app/dashboard/student/settings/page'),
  company: () => import('@/app/dashboard/company/page'),
  'company/applicants': () => import('@/app/dashboard/company/applicants/page'),
  'company/saved': () => import('@/app/dashboard/company/saved/page'),
  'company/analytics': () => import('@/app/dashboard/company/analytics/page'),
  'company/settings': () => import('@/app/dashboard/company/settings/page'),
  university: () => import('@/app/dashboard/university/page'),
  'university/analytics': () => import('@/app/dashboard/university/analytics/page'),
  'university/settings': () => import('@/app/dashboard/university/settings/page'),
  admin: () => import('@/app/dashboard/admin/page'),
  'admin/analytics': () => import('@/app/dashboard/admin/analytics/page'),
  'admin/users': () => import('@/app/dashboard/admin/users/page'),
  'admin/verifications': () => import('@/app/dashboard/admin/verifications/page'),
  'admin/audit': () => import('@/app/dashboard/admin/audit/page'),
  'admin/outreach': () => import('@/app/dashboard/admin/outreach/page'),
  'admin/companies': () => import('@/app/dashboard/admin/companies/page'),
  'admin/support': () => import('@/app/dashboard/admin/support/page'),
  'admin/settings': () => import('@/app/dashboard/admin/settings/page'),
}

const NAMES: Record<DashRole, string> = { student: 'Aarav Sharma', company: 'Northwind Labs', university: 'Fixture University', admin: 'Platform Admin' }

export function PreviewHarness({ slug }: { slug: string }) {
  const role = (slug.split('/')[0] as DashRole) || 'student'
  const View = React.useMemo(() => {
    const loader = VIEWS[slug]
    return loader ? React.lazy(loader) : null
  }, [slug])

  const fixture = {
    userId: 'fixture-user',
    email: `${role}@example.test`,
    role,
    displayName: NAMES[role] ?? 'Fixture',
    profile: { id: 'fixture-user', full_name: NAMES[role] ?? 'Fixture', email: `${role}@example.test`, role },
  }

  return (
    <DashboardProvider fixture={fixture}>
      <DashboardShell>
        {View ? (
          <React.Suspense fallback={<p className="text-sm text-muted-foreground">Loading</p>}>
            <View />
          </React.Suspense>
        ) : (
          <p className="text-sm text-muted-foreground">No preview is registered for {slug}.</p>
        )}
      </DashboardShell>
    </DashboardProvider>
  )
}

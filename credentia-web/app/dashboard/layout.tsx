import { DashboardProvider } from '@/components/dash/dashboard-context'
import { DashboardShell } from '@/components/shell/dashboard-shell'

/**
 * Shared frame for every dashboard route. The session, profile and role load
 * once here, and each role's pages render inside the glass stage.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  )
}

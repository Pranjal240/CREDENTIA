import { redirect } from 'next/navigation'
import { getCaller } from '@/lib/api-auth'
import { roleHome } from '@/lib/dashboard-nav'

export const dynamic = 'force-dynamic'

/** /dashboard sends each person to the dashboard for their own role. */
export default async function DashboardRoot() {
  const caller = await getCaller()
  if (!caller) redirect('/login/student')
  redirect(roleHome(caller.role))
}

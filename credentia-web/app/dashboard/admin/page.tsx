import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export default async function AdminDashboard() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value } } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login/admin')

  // Check admin role
  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard/student')

  // Fetch all data
  const [
    { data: allProfiles },
    { data: allStudents },
    { data: allVerifications },
    { data: recentAudit },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('students').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('verifications').select('*').order('updated_at', { ascending: false }),
    supabaseAdmin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20),
  ])

  return (
    <AdminClient
      profiles={allProfiles || []}
      students={allStudents || []}
      verifications={allVerifications || []}
      recentAudit={recentAudit || []}
      currentUserId={user.id}
    />
  )
}

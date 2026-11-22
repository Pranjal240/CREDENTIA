import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { audit, requireAdmin } from '@/lib/admin'
import { asId } from '@/lib/admin-data'

export const dynamic = 'force-dynamic'

/**
 * Lets an admin open or close a student's profile to companies, whatever the
 * student chose themselves. The student is told, and the change is logged.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const studentId = asId(body?.studentId)
  if (!studentId || typeof body?.isPublic !== 'boolean') return NextResponse.json({ error: 'Choose a student and whether companies can see them.' }, { status: 400 })
  const isPublic: boolean = body.isPublic

  try {
    const { error } = await supabaseAdmin
      .from('students')
      .update({ profile_is_public: isPublic, police_share_with_companies: isPublic, updated_at: new Date().toISOString() })
      .eq('id', studentId)
    if (error) throw error

    await audit(admin, isPublic ? 'enable_company_access' : 'disable_company_access', 'student', studentId, { profile_is_public: isPublic })
    await supabaseAdmin.from('notifications').insert({
      user_id: studentId,
      title: isPublic ? 'Companies can now see your profile' : 'Your profile is hidden from companies',
      message: isPublic ? 'An admin made your verified profile visible to companies.' : 'An admin hid your profile from companies. You can change this in Settings.',
      type: 'profile',
      action_url: '/dashboard/student/settings',
      is_read: false,
    })
    return NextResponse.json({ success: true, isPublic })
  } catch (error) {
    console.error('[admin/toggle-company-access] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The change could not be saved.' }, { status: 500 })
  }
}

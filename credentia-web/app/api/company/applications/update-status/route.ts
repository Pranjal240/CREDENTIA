import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCallerWithRole } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

const ALLOWED = ['pending', 'accepted', 'rejected'] as const

/** Moves one of the company's own applications to a new status and tells the student. */
export async function POST(req: Request) {
  const caller = await getCallerWithRole(['company'])
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const applicationId = typeof body?.applicationId === 'string' ? body.applicationId : ''
  const status = typeof body?.status === 'string' ? body.status : ''
  if (!applicationId || !(ALLOWED as readonly string[]).includes(status)) return NextResponse.json({ error: 'Missing application or status.' }, { status: 400 })

  try {
    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .eq('company_id', caller.userId)
      .select('id, student_id, job_title, status')
      .maybeSingle()
    if (error) throw error
    if (!application) return NextResponse.json({ error: 'That application was not found.' }, { status: 404 })

    if (status !== 'pending') {
      const { data: company } = await supabaseAdmin.from('companies').select('company_name').eq('id', caller.userId).maybeSingle()
      await supabaseAdmin.from('notifications').insert({
        user_id: application.student_id,
        title: status === 'accepted' ? 'Application accepted' : 'Application update',
        message: `${(company?.company_name as string) || 'A company'} ${status === 'accepted' ? 'accepted' : 'declined'} your application for ${application.job_title}.`,
        type: 'application',
        action_url: '/dashboard/student/apply',
        is_read: false,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[company/update-status] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The status could not be changed.' }, { status: 500 })
  }
}

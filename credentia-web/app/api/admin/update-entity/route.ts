import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { audit, cleanText, requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

/**
 * Approves or edits a company or a university, and can switch its account on
 * or off. Only known fields are accepted, and the access key of a university is
 * never touched here.
 */
export async function POST(req: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : ''
  const role = body?.role === 'company' ? 'company' : body?.role === 'university' ? 'university' : ''
  if (!id || !role) return NextResponse.json({ error: 'Choose a company or a university.' }, { status: 400 })

  const profileIn = (body.profileUpdates ?? {}) as Record<string, unknown>
  const entityIn = (body.entityUpdates ?? {}) as Record<string, unknown>

  const profilePatch: Record<string, unknown> = {}
  if ('is_active' in profileIn) profilePatch.is_active = Boolean(profileIn.is_active)
  if ('full_name' in profileIn) profilePatch.full_name = cleanText(profileIn.full_name, 160)
  if ('phone' in profileIn) profilePatch.phone = cleanText(profileIn.phone, 20) || null

  const entityPatch: Record<string, unknown> = {}
  if ('is_verified' in entityIn) entityPatch.is_verified = Boolean(entityIn.is_verified)
  if (role === 'company') {
    for (const key of ['company_name', 'industry', 'website', 'description', 'state', 'company_size'] as const) if (key in entityIn) entityPatch[key] = cleanText(entityIn[key], key === 'description' ? 1200 : 160) || null
  } else {
    for (const key of ['university_name', 'city', 'state', 'ugc_id', 'naac_grade'] as const) if (key in entityIn) entityPatch[key] = cleanText(entityIn[key], 160) || null
  }

  try {
    if (Object.keys(profilePatch).length > 0) {
      const { error } = await supabaseAdmin.from('profiles').update({ ...profilePatch, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    }
    if (Object.keys(entityPatch).length > 0) {
      // The name column is required, so a row created here borrows the profile name when none is given.
      const nameKey = role === 'company' ? 'company_name' : 'university_name'
      if (!entityPatch[nameKey]) {
        const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', id).maybeSingle()
        const { data: existing } = await supabaseAdmin.from(role === 'company' ? 'companies' : 'universities').select(nameKey).eq('id', id).maybeSingle()
        if (!existing) entityPatch[nameKey] = profile?.full_name || (role === 'company' ? 'Unnamed company' : 'Unnamed university')
      }
      const { error } = await supabaseAdmin.from(role === 'company' ? 'companies' : 'universities').upsert({ id, ...entityPatch }, { onConflict: 'id' })
      if (error) throw error
    }

    await audit(admin, `admin_updated_${role}`, role, id, { profile: profilePatch, entity: entityPatch })

    // Approval changes what the organisation can do, so they are told.
    if ('is_verified' in entityPatch) {
      const approved = entityPatch.is_verified === true
      await supabaseAdmin.from('notifications').insert({
        user_id: id,
        title: approved ? 'Your organisation is approved' : 'Your approval was withdrawn',
        message: approved
          ? role === 'university'
            ? 'Your students can now be seen in your registry.'
            : 'Students now see your company marked as approved.'
          : 'An admin withdrew your approval. Contact support if you think this is a mistake.',
        type: 'approval',
        action_url: `/dashboard/${role}`,
        is_read: false,
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/update-entity] failed:', (error as Error).message)
    return NextResponse.json({ error: 'That could not be saved.' }, { status: 500 })
  }
}

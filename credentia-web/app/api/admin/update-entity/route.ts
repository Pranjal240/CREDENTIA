import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (callerProfile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { id, role, profileUpdates, entityUpdates } = body
    if (!id || !role) return NextResponse.json({ error: 'Missing id or role' }, { status: 400 })

    if (profileUpdates && Object.keys(profileUpdates).length > 0) {
      const { error } = await supabaseAdmin.from('profiles').update(profileUpdates).eq('id', id)
      if (error) throw error
    }

    if (entityUpdates && Object.keys(entityUpdates).length > 0) {
      const table = role === 'company' ? 'companies' : 'universities'
      
      // ALWAYS fetch the profile name to ensure the NOT NULL name column is populated
      const { data: prof } = await supabaseAdmin.from('profiles').select('full_name').eq('id', id).single()
      const fallbackName = prof?.full_name || (role === 'company' ? 'Unknown Company' : 'Unknown University')
      
      // Build the upsert payload — always include the required name column
      const upsertPayload: any = { id, ...entityUpdates }
      if (table === 'universities' && !upsertPayload.university_name) {
        upsertPayload.university_name = fallbackName
      }
      if (table === 'companies' && !upsertPayload.company_name) {
        upsertPayload.company_name = fallbackName
      }
      
      const { error } = await supabaseAdmin.from(table).upsert(upsertPayload, { onConflict: 'id' })
      if (error) throw error
    }

    // Log the action (non-blocking)
    try {
      await supabaseAdmin.from('audit_logs').insert({
        admin_id: user.id,
        action: `admin_updated_${role}`,
        target_id: id,
        target_type: role,
        details: { profileUpdates, entityUpdates }
      })
    } catch (auditErr) {
      console.warn('[update-entity] Audit log failed:', auditErr)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[update-entity] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

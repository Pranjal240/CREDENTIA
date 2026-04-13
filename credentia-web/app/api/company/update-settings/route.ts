import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    // Use the proper server client that handles session refresh (get/set/remove)
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[company/update-settings] No authenticated user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a company
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'company') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { company_name, phone, description, industry, website } = await req.json()

    // 1. Update profiles table (phone and full_name)
    const { error: profErr } = await supabaseAdmin.from('profiles').update({
      full_name: company_name || null,
      phone: phone || null,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)

    if (profErr) {
      console.error('[company/update-settings] profiles update error:', profErr.message)
      throw profErr
    }

    // 2. Upsert companies table (company_name + details)
    const { error: compErr } = await supabaseAdmin.from('companies').upsert({
      id: user.id,
      company_name: company_name,
      description: description || null,
      industry: industry || null,
      website: website || null,
    }, { onConflict: 'id' })

    if (compErr) {
      console.error('[company/update-settings] companies upsert error:', compErr.message)
      throw compErr
    }

    console.log(`[company/update-settings] Successfully updated company name to "${company_name}" for user ${user.id}`)
    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[company/update-settings] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

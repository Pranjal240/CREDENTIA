import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    // Use the proper server client that handles session refresh (get/set/remove)
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[university/update-settings] No authenticated user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a university
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'university') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { university_name } = await req.json()

    // 1. Update profiles table — sync full_name + updated_at so every portal sees the new name
    const { error: profErr } = await supabaseAdmin.from('profiles').update({
      full_name: university_name,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)

    if (profErr) {
      console.error('[university/update-settings] profiles update error:', profErr.message)
      throw profErr
    }

    // 2. Also update universities table (university_name) for cross-panel sync
    const { error: uniErr } = await supabaseAdmin.from('universities').upsert({
      id: user.id,
      university_name: university_name,
    }, { onConflict: 'id' })

    if (uniErr) {
      console.error('[university/update-settings] universities upsert error:', uniErr.message)
      // Non-fatal: the universities row may not exist yet for some accounts
    }

    console.log(`[university/update-settings] Successfully updated university name to "${university_name}" for user ${user.id}`)

    // 3. Revalidate all portal paths so server-rendered pages pick up the new name
    revalidatePath('/dashboard/university')
    revalidatePath('/dashboard/university/settings')
    revalidatePath('/dashboard/student')
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/company')

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('[university/update-settings] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

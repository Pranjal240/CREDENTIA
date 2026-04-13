import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Ensures that a user has both a `profiles` row and the appropriate
 * role-specific row (students, companies, universities).
 * 
 * This is a safety-net for users who register with email/password
 * and skip the auth callback (e.g., direct signInWithPassword after
 * confirming email, or when auto-confirm is enabled).
 * 
 * Called from the dashboard layout on initial load when no profile is found.
 */
export async function POST(request: Request) {
  try {
    const { userId, portal } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const safePortal = ['student', 'company', 'university'].includes(portal) ? portal : 'student'

    // 1. Fetch user info from auth
    const { data: { user }, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userErr || !user) {
      return NextResponse.json({ error: 'User not found in auth' }, { status: 404 })
    }

    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
    const email = user.email || ''

    // 2. Ensure profiles row exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle()

    if (!existingProfile) {
      const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email,
        full_name: fullName,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        role: safePortal,
        login_portal: safePortal,
        last_login_at: new Date().toISOString(),
        last_login_portal: safePortal,
        is_active: true,
      }, { onConflict: 'id' })

      if (profileErr) {
        console.error('[ensure-profile] profiles upsert error:', profileErr)
        return NextResponse.json({ error: profileErr.message }, { status: 500 })
      }
    }

    const finalRole = existingProfile?.role || safePortal

    // 3. Ensure role-specific row exists
    if (finalRole === 'student') {
      const { data: existingStudent } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (!existingStudent) {
        const { error: studentErr } = await supabaseAdmin.from('students').upsert({
          id: userId,
          name: fullName,
          email,
          profile_is_public: true,
          profile_views: 0,
        }, { onConflict: 'id' })

        if (studentErr) {
          console.error('[ensure-profile] students upsert error:', studentErr)
          return NextResponse.json({ error: studentErr.message }, { status: 500 })
        }
      }
    } else if (finalRole === 'company') {
      const { data: existingCompany } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (!existingCompany) {
        await supabaseAdmin.from('companies').upsert({
          id: userId,
          company_name: fullName,
        }, { onConflict: 'id' })
      }
    } else if (finalRole === 'university') {
      const { data: existingUni } = await supabaseAdmin
        .from('universities')
        .select('id')
        .eq('id', userId)
        .maybeSingle()

      if (!existingUni) {
        await supabaseAdmin.from('universities').upsert({
          id: userId,
          university_name: fullName,
        }, { onConflict: 'id' })
      }
    }

    // 4. Return the profile (re-fetch to get the fresh data)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    return NextResponse.json({ success: true, profile })
  } catch (error: any) {
    console.error('[ensure-profile] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

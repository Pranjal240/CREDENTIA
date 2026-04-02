import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // Verify the caller is admin
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    if (callerProfile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    const { verificationId, action } = await request.json()

    if (!verificationId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
    }

    const newStatus = action === 'approve' ? 'admin_verified' : 'rejected'

    // Update verification status
    const { data: verification, error: verErr } = await supabaseAdmin
      .from('verifications')
      .update({
        status: newStatus,
        admin_reviewed_by: user.id,
        admin_reviewed_at: new Date().toISOString(),
      })
      .eq('id', verificationId)
      .select('student_id, type')
      .single()

    if (verErr) throw verErr

    // If approved, update the appropriate student verified flag
    if (action === 'approve' && verification?.student_id) {
      const updateData: any = { updated_at: new Date().toISOString() }

      // Map verification type to the correct student field
      if (verification.type === 'police') updateData.police_verified = true
      else if (verification.type === 'degree') updateData.degree_verified = true
      else if (verification.type === 'aadhaar') updateData.aadhaar_verified = true
      // marksheet_10th, marksheet_12th, passport — no specific flag, but trust score updates via save-verification

      if (Object.keys(updateData).length > 1) { // more than just updated_at
        await supabaseAdmin.from('students')
          .update(updateData)
          .eq('id', verification.student_id)
      }
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error: any) {
    console.error('Admin verification action error:', error)
    return NextResponse.json({ success: false, error: error.message || 'Action failed' }, { status: 500 })
  }
}

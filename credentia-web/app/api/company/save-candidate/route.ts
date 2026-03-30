import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { companyId, studentId, action } = await req.json()
    if (!companyId || !studentId) return NextResponse.json({ error: 'Missing IDs' }, { status: 400 })

    if (action === 'save') {
      const { error } = await supabaseAdmin.from('saved_candidates').upsert(
        { company_id: companyId, student_id: studentId },
        { onConflict: 'company_id,student_id' }
      )
      if (error) throw error
    } else {
      const { error } = await supabaseAdmin.from('saved_candidates').delete().eq('company_id', companyId).eq('student_id', studentId)
      if (error) throw error
    }

    // Log audit
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: companyId,
      action: action === 'save' ? 'save_candidate' : 'unsave_candidate',
      target_type: 'student',
      target_id: studentId,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

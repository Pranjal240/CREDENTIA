import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function POST(req: Request) {
  try {
    const { universityId, studentId, cgpa } = await req.json()
    if (!universityId || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the student is linked to this university
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('university_id')
      .eq('id', studentId)
      .single()

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Also check profiles.linked_university_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('linked_university_id')
      .eq('id', studentId)
      .single()

    const linkedUniId = student.university_id || profile?.linked_university_id
    if (linkedUniId !== universityId) {
      return NextResponse.json({ error: 'Student is not linked to your university' }, { status: 403 })
    }

    const { error } = await supabaseAdmin.from('students').update({
      cgpa: cgpa?.toString() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', studentId)

    if (error) throw error

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      admin_id: universityId,
      action: 'university_edit_cgpa',
      target_id: studentId,
      target_type: 'student',
      metadata: { cgpa }
    })

    // Revalidate all portals that display student CGPA
    revalidatePath('/dashboard/student', 'layout')
    revalidatePath('/dashboard/company', 'page')
    revalidatePath('/dashboard/admin', 'page')
    revalidatePath('/dashboard/university', 'page')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

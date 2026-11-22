import { NextResponse } from 'next/server'
import { getUniversityAccess } from '@/lib/university-access'
import { loadTalent } from '@/lib/company-talent'

export const dynamic = 'force-dynamic'

/**
 * The students linked to the signed in university, with their scores and
 * document statuses. Before the institution is approved this returns nothing.
 */
export async function GET() {
  const access = await getUniversityAccess()
  if (!access) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!access.approved) return NextResponse.json({ approved: false, university: access.university, students: [] })

  try {
    const students = await loadTalent({ universityId: access.caller.userId })
    return NextResponse.json({ approved: true, university: access.university, students })
  } catch (error) {
    console.error('[university/students] failed:', (error as Error).message)
    return NextResponse.json({ error: 'The registry could not be loaded.' }, { status: 500 })
  }
}

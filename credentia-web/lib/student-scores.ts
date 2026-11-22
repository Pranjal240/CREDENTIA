import { supabaseAdmin } from '@/lib/supabase'
import { CORE_DOC_TYPES } from '@/lib/documents'
import { isVerifiedStatus } from '@/lib/status'

const BONUS_TYPES = ['marksheet_10th', 'marksheet_12th', 'passport']

/**
 * Brings a student's summary fields back in line with their documents: the
 * three verified flags, the trust score, the verified count and the profile
 * completion. Saving a document does this already. Admin decisions call it too,
 * so approving a document in the review queue moves the trust score as well.
 *
 * Trust score: each of the four core documents is worth 21.25 points (85 in
 * all) and each bonus document 5, capped at 15 in total.
 */
export async function recalcStudent(studentId: string) {
  const [{ data: rows }, { data: student }] = await Promise.all([
    supabaseAdmin.from('verifications').select('type, status').eq('student_id', studentId),
    supabaseAdmin.from('students').select('name, course, branch, city, cgpa, graduation_year, resume_url').eq('id', studentId).maybeSingle(),
  ])
  if (!student) return

  const verified = (type: string) => (rows ?? []).some((row) => row.type === type && isVerifiedStatus(row.status))
  const core = CORE_DOC_TYPES.filter(verified).length
  const bonus = BONUS_TYPES.filter(verified).length
  const trust = Math.min(Math.round((core / 4) * 85) + Math.min(bonus * 5, 15), 100)

  const details = [student.name, student.course, student.branch, student.city, student.cgpa, student.graduation_year, student.resume_url]
  const filled = details.filter((value) => value !== null && value !== undefined && value !== '').length
  const coreThree = [verified('degree'), verified('police'), verified('aadhaar')].filter(Boolean).length

  await supabaseAdmin
    .from('students')
    .update({
      police_verified: verified('police'),
      aadhaar_verified: verified('aadhaar'),
      degree_verified: verified('degree'),
      trust_score: trust,
      verified_docs_count: (rows ?? []).filter((row) => isVerifiedStatus(row.status)).length,
      profile_complete_pct: Math.min(Math.round((filled / details.length) * 60 + (coreThree / 3) * 40), 100),
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId)
}

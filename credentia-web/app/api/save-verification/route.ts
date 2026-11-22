import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'
import { getCallerWithRole } from '@/lib/api-auth'
import { rateLimit } from '@/lib/rate-limit'
import { DOC_ROUTE, docLabel, isDocType, type DocType } from '@/lib/documents'
import { displayNameFromKey, isOwnKey, keyFromFileUrl, publicUrlForKey } from '@/lib/doc-files'
import { headFromR2 } from '@/lib/r2'
import { openSeal } from '@/lib/doc-seal'
import { studentPatchFromAnalysis } from '@/lib/doc-analysis'
import { recalcStudent } from '@/lib/student-scores'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const fail = (status: number, error: string) => NextResponse.json({ success: false, error }, { status })

/** The only statuses a result can carry here. Only an admin can verify a document. */
const SAVABLE = ['ai_approved', 'needs_review', 'rejected']

/**
 * Saves a document to the signed in student's profile.
 *
 * Nothing about who, what or how good comes from the browser. The student is
 * the session. For a document the AI reads, the only thing believed is the
 * sealed result the read route issued (see lib/doc-seal.ts): the analysis, the
 * decision and the file are all inside it and cannot be changed. A document
 * stored without the AI is recorded as pending, with the record built here.
 * No status is ever taken from the request, and the file address is built from
 * the checked storage key.
 */
export async function POST(request: Request) {
  const caller = await getCallerWithRole(['student'])
  if (!caller) return fail(401, 'Please sign in again to continue.')
  if (!rateLimit(`doc-save:${caller.userId}`, 40, 60 * 60_000)) {
    return fail(429, 'You are saving very quickly. Please wait a little and try again.')
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'That request could not be understood.')
  const input = body as Record<string, unknown>
  const type = input.type
  if (!isDocType(type)) return fail(400, 'That kind of document is not recognised.')

  try {
    let key: string
    let analysis: Record<string, unknown>
    let status: string

    if (type === 'passport') {
      // Stored without the AI. The file must be this student's and must exist, and the record is built here.
      const checked = keyFromFileUrl(input.fileUrl, caller.userId)
      if (checked.ok === false) {
        return checked.reason === 'not_yours'
          ? fail(403, 'That file does not belong to your account. Please upload it again.')
          : fail(400, 'Use a file you uploaded here. Links to other sites are not accepted.')
      }
      let head: { size: number } | null
      try {
        head = await headFromR2(checked.key)
      } catch {
        return fail(502, 'The file could not be checked right now. Please try again in a moment.')
      }
      if (!head) return fail(400, 'That file could not be found. Please upload it again.')
      key = checked.key
      analysis = { document_type: docLabel('passport'), file_name: displayNameFromKey(key), file_size_mb: (head.size / 1048576).toFixed(2), status: 'uploaded', confidence: 0 }
      status = 'pending'
    } else {
      // A document the AI reads. The sealed result is the only thing believed.
      const sealed = openSeal(input.seal)
      if (!sealed) return fail(400, 'This result has expired or is not valid. Please read the document again.')
      if (sealed.sub !== caller.userId || !isOwnKey(sealed.key, caller.userId)) return fail(403, 'That result does not belong to your account.')
      if (sealed.type !== type) return fail(400, 'That result is for a different document. Please read the document again.')
      if (!SAVABLE.includes(sealed.status)) return fail(400, 'This result is not valid. Please read the document again.')
      key = sealed.key
      analysis = sealed.analysis
      status = sealed.status
    }

    const now = new Date().toISOString()
    const url = publicUrlForKey(key)
    const score = Number(type === 'resume' ? analysis.ats_score : analysis.confidence) || 0
    const confidence = Math.round(Math.min(Math.max(score, 0), 100))

    // The verification below points at the students row, so make sure one exists. It is made from the session.
    const { data: studentRow } = await supabaseAdmin.from('students').select('id').eq('id', caller.userId).maybeSingle()
    if (!studentRow) {
      const { error } = await supabaseAdmin
        .from('students')
        .upsert({ id: caller.userId, name: caller.name, email: caller.email, profile_is_public: true, profile_views: 0 }, { onConflict: 'id' })
      if (error) throw error
    }

    // A new file starts a new review, so any earlier admin decision on this slot is cleared with it.
    const record = {
      status,
      ai_result: analysis,
      ai_confidence: confidence,
      document_url: url,
      admin_reviewed_by: null,
      admin_reviewed_at: null,
      rejection_reason: null,
      updated_at: now,
    }
    const { data: existing, error: lookupError } = await supabaseAdmin.from('verifications').select('id').eq('student_id', caller.userId).eq('type', type).maybeSingle()
    if (lookupError) throw lookupError
    const { error: writeError } = existing
      ? await supabaseAdmin.from('verifications').update(record).eq('id', existing.id)
      : await supabaseAdmin.from('verifications').insert({ student_id: caller.userId, type, ...record })
    if (writeError) throw writeError

    // What the document filled in. A failure here is reported on the server and does not undo the saved record.
    const patch = studentPatchFromAnalysis(type, analysis, url, now)
    if (patch.student) {
      const { error } = await supabaseAdmin.from('students').upsert({ id: caller.userId, ...patch.student }, { onConflict: 'id' })
      if (error) console.error('[save-verification] the student details could not be updated:', error.message)
    }
    if (patch.profile) {
      const { error } = await supabaseAdmin.from('profiles').update(patch.profile).eq('id', caller.userId)
      if (error) console.error('[save-verification] the profile could not be updated:', error.message)
    }

    // The verified flags, the trust score and the counts all follow from the saved records.
    await recalcStudent(caller.userId)

    revalidatePath('/dashboard/student', 'layout')
    revalidatePath(DOC_ROUTE[type as DocType] ?? '/dashboard/student/saved', 'page')
    revalidatePath('/dashboard/student/saved', 'page')
    revalidatePath('/dashboard/admin', 'page')
    revalidatePath('/dashboard/admin/analytics', 'page')
    revalidatePath('/dashboard/university', 'page')
    revalidatePath('/dashboard/university/analytics', 'page')
    revalidatePath('/dashboard/company', 'page')

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error(`[save-verification] ${type} failed:`, (error as Error).message)
    return fail(500, 'Your document could not be saved. Please try again.')
  }
}

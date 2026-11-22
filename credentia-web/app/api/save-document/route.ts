import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCallerWithRole } from '@/lib/api-auth'
import { rateLimit } from '@/lib/rate-limit'
import { MAX_UPLOAD_BYTES } from '@/lib/documents'
import { displayNameFromKey, keyFromFileUrl, publicUrlForKey } from '@/lib/doc-files'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const fail = (status: number, error: string) => NextResponse.json({ success: false, error }, { status })

/** The three places the older `documents` table keeps a student's file. */
const SLOTS = ['10th', '12th', 'other']
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g

/**
 * Records a student's marksheet or other credential in the older `documents`
 * table, as the marksheet pages always did. The row belongs to the signed in
 * student, its status is always pending, and the file must be one that student
 * uploaded here. The file address is built from the checked storage key.
 */
export async function POST(request: Request) {
  const caller = await getCallerWithRole(['student'])
  if (!caller) return fail(401, 'Please sign in again to continue.')
  if (!rateLimit(`doc-record:${caller.userId}`, 40, 60 * 60_000)) {
    return fail(429, 'You are saving very quickly. Please wait a little and try again.')
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'That request could not be understood.')
  const input = body as Record<string, unknown>

  const slot = input.documentType
  if (typeof slot !== 'string' || !SLOTS.includes(slot)) return fail(400, 'That kind of document is not recognised.')

  const checked = keyFromFileUrl(input.fileUrl, caller.userId)
  if (checked.ok === false) {
    return checked.reason === 'not_yours'
      ? fail(403, 'That file does not belong to your account. Please upload it again.')
      : fail(400, 'Use a file you uploaded here. Links to other sites are not accepted.')
  }

  const name = typeof input.fileName === 'string' ? input.fileName.replace(CONTROL, '').trim().slice(0, 200) : ''
  const size = typeof input.fileSize === 'number' && Number.isInteger(input.fileSize) && input.fileSize > 0 && input.fileSize <= MAX_UPLOAD_BYTES ? input.fileSize : null

  try {
    const { error } = await supabaseAdmin.from('documents').upsert(
      {
        user_id: caller.userId,
        document_type: slot,
        file_url: publicUrlForKey(checked.key),
        file_name: name || displayNameFromKey(checked.key),
        file_size: size,
        status: 'pending',
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,document_type' },
    )
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[save-document] failed:', (error as Error).message)
    return fail(500, 'Your document could not be recorded. Please try again.')
  }
}

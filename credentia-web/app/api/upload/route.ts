import { NextResponse } from 'next/server'
import { getCallerWithRole } from '@/lib/api-auth'
import { rateLimit } from '@/lib/rate-limit'
import { sniffFile } from '@/lib/doc-files'
import { uploadStudentFile } from '@/lib/r2'
import { MAX_UPLOAD_BYTES, UPLOAD_FOLDERS } from '@/lib/documents'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const fail = (status: number, error: string) => NextResponse.json({ success: false, error }, { status })

/**
 * Stores one document for the signed in student. The account comes from the
 * session, the folder must be one of the listed ones, the file must really be
 * a PDF, JPG or PNG (judged by its bytes, not by what the browser says) and
 * under 10 MB. The key is built from the account id, so a student can only
 * ever write inside their own folder.
 */
export async function POST(request: Request) {
  const caller = await getCallerWithRole(['student'])
  if (!caller) return fail(401, 'Please sign in again to continue.')
  if (!rateLimit(`doc-upload:${caller.userId}`, 30, 60 * 60_000)) {
    return fail(429, 'You are uploading very quickly. Please wait a little and try again.')
  }

  if (!(request.headers.get('content-type') || '').includes('multipart/form-data')) return fail(400, 'Send the file as a form upload.')
  // An honest oversized request is refused before it is read. The real limit is checked on the file below.
  if (Number(request.headers.get('content-length') ?? 0) > MAX_UPLOAD_BYTES + 1024 * 1024) return fail(413, 'That file is too large. The limit is 10 MB.')

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return fail(400, 'The upload could not be read. Please try again.')
  }

  const folder = form.get('folder')
  if (typeof folder !== 'string' || !(UPLOAD_FOLDERS as readonly string[]).includes(folder)) return fail(400, 'That kind of document is not recognised.')

  const file = form.get('file')
  if (!(file instanceof Blob)) return fail(400, 'Choose a file to upload.')
  if (file.size === 0) return fail(400, 'That file is empty.')
  if (file.size > MAX_UPLOAD_BYTES) return fail(413, 'That file is too large. The limit is 10 MB.')

  const bytes = Buffer.from(await file.arrayBuffer())
  const kind = sniffFile(bytes)
  if (!kind) return fail(400, 'Only PDF, JPG or PNG files can be uploaded.')

  if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || !process.env.CLOUDFLARE_R2_BUCKET_NAME || !process.env.CLOUDFLARE_R2_PUBLIC_URL) {
    console.error('[upload] file storage is not configured')
    return fail(500, 'File storage is not available right now. Please try again later.')
  }

  try {
    const stored = await uploadStudentFile(caller.userId, folder, bytes, (file as File).name || 'document', kind)
    return NextResponse.json({ success: true, ...stored })
  } catch (error) {
    console.error('[upload] failed:', (error as Error).message)
    return fail(500, 'The upload failed. Please try again.')
  }
}

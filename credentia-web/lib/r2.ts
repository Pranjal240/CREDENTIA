import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { buildStudentKey, publicUrlForKey, type FileKind } from '@/lib/doc-files'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

const bucket = () => process.env.CLOUDFLARE_R2_BUCKET_NAME!

/**
 * Stores a student's file under their own prefix. The key is built from the
 * signed in account and the type comes from the bytes of the file, so nothing
 * the browser says can move a file or change how it is served.
 */
export async function uploadStudentFile(userId: string, folder: string, file: Buffer, originalName: string, kind: FileKind) {
  const key = buildStudentKey(userId, folder, originalName, kind)
  await r2.send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: file,
      ContentType: kind.mime,
      CacheControl: 'max-age=31536000',
    }),
  )
  return { url: publicUrlForKey(key), key, filename: originalName, bytes: file.length }
}

export async function deleteFromR2(key: string) {
  await r2.send(new DeleteObjectCommand({
    Bucket: bucket(),
    Key: key,
  }))
}

/** Why a read failed. `missing` means there is no such file, `too_large` that it is over the limit. */
export class R2ReadError extends Error {
  constructor(public code: 'missing' | 'too_large' | 'failed', message?: string) {
    super(message ?? code)
    this.name = 'R2ReadError'
  }
}

const isMissing = (error: any) => error?.name === 'NoSuchKey' || error?.name === 'NotFound' || error?.$metadata?.httpStatusCode === 404

/**
 * The public address of a key, fetched only when the storage API itself refuses
 * (for example a token that cannot read). The address is built here from our own
 * base and a key that has already been checked, never taken from the browser,
 * and a redirect to anywhere else is an error.
 */
async function viaPublicUrl(key: string, method: 'GET' | 'HEAD'): Promise<Response> {
  let response: Response
  try {
    response = await fetch(publicUrlForKey(key), { method, signal: AbortSignal.timeout(15_000), redirect: 'error' })
  } catch {
    throw new R2ReadError('failed')
  }
  if (response.status === 404) throw new R2ReadError('missing')
  if (!response.ok) throw new R2ReadError('failed')
  return response
}

/**
 * Reads one file by its key, never by an address someone supplied. Anything
 * over `maxBytes` is refused, before it is downloaded when its size is known.
 */
export async function readFromR2(key: string, maxBytes: number): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    const result = await r2.send(new GetObjectCommand({ Bucket: bucket(), Key: key }))
    if (typeof result.ContentLength === 'number' && result.ContentLength > maxBytes) throw new R2ReadError('too_large')
    const bytes = await result.Body?.transformToByteArray()
    if (!bytes) throw new R2ReadError('failed')
    if (bytes.length > maxBytes) throw new R2ReadError('too_large')
    return { buffer: Buffer.from(bytes), contentType: result.ContentType || '' }
  } catch (error) {
    if (error instanceof R2ReadError) throw error
    if (isMissing(error)) throw new R2ReadError('missing')
    console.error('[r2] reading through the storage API failed, trying the public address:', (error as Error)?.name)
  }

  const response = await viaPublicUrl(key, 'GET')
  if (Number(response.headers.get('content-length') ?? 0) > maxBytes) throw new R2ReadError('too_large')
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length > maxBytes) throw new R2ReadError('too_large')
  return { buffer, contentType: response.headers.get('content-type') || '' }
}

/** The size of a file, or null when there is no such file. Used to confirm an upload before it is recorded. */
export async function headFromR2(key: string): Promise<{ size: number } | null> {
  try {
    const result = await r2.send(new HeadObjectCommand({ Bucket: bucket(), Key: key }))
    return { size: result.ContentLength ?? 0 }
  } catch (error) {
    if (isMissing(error)) return null
    console.error('[r2] checking through the storage API failed, trying the public address:', (error as Error)?.name)
  }

  try {
    const response = await viaPublicUrl(key, 'HEAD')
    return { size: Number(response.headers.get('content-length') ?? 0) }
  } catch (error) {
    if (error instanceof R2ReadError && error.code === 'missing') return null
    throw error
  }
}

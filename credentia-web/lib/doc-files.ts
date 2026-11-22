import { randomBytes } from 'node:crypto'
import { UPLOAD_FOLDERS } from '@/lib/documents'

/**
 * Rules for a student's files in object storage. Everything here is pure, so it
 * can be checked without a network.
 *
 * Every file lives at `credentia/students/<account id>/<folder>/<name>`. The
 * account id always comes from the session, so a student can only ever write
 * to, and read from, their own prefix.
 */

export interface FileKind {
  mime: 'application/pdf' | 'image/jpeg' | 'image/png'
  ext: 'pdf' | 'jpg' | 'png'
}

const PDF: FileKind = { mime: 'application/pdf', ext: 'pdf' }
const JPG: FileKind = { mime: 'image/jpeg', ext: 'jpg' }
const PNG: FileKind = { mime: 'image/png', ext: 'png' }
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** What a file really is, read from its first bytes. The type the browser claims is never used. */
export function sniffFile(bytes: Uint8Array): FileKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return JPG
  if (bytes.length >= PNG_SIGNATURE.length && PNG_SIGNATURE.every((value, index) => bytes[index] === value)) return PNG
  // PDF readers accept a little junk before the header, so look in the first kilobyte.
  if (Buffer.from(bytes.subarray(0, 1024)).toString('latin1').includes('%PDF-')) return PDF
  return null
}

const ID_SHAPE = /^[A-Za-z0-9-]{8,64}$/
const FILE_SHAPE = /^[A-Za-z0-9._-]{1,160}$/
const FOLDERS: readonly string[] = UPLOAD_FOLDERS

/** The part of the file name that is kept: letters, digits, underscore and hyphen. */
function cleanBaseName(original: string): string {
  const withoutExtension = original.replace(/\.[^./\\]*$/, '')
  const base = withoutExtension
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60)
  return base || 'document'
}

/** The key for a new upload. Throws for a folder that is not on the list or an id that is not an account id. */
export function buildStudentKey(userId: string, folder: string, originalName: string, kind: FileKind, now: number = Date.now(), random: string = randomBytes(4).toString('hex')): string {
  if (!ID_SHAPE.test(userId)) throw new Error('That is not a valid account id')
  if (!FOLDERS.includes(folder)) throw new Error('That folder is not allowed')
  return `credentia/students/${userId}/${folder}/${now}-${random}-${cleanBaseName(originalName)}.${kind.ext}`
}

/** True only for a key in the exact shape upload produces, under this account. */
export function isOwnKey(key: string, userId: string): boolean {
  if (typeof key !== 'string' || typeof userId !== 'string' || !ID_SHAPE.test(userId)) return false
  const prefix = `credentia/students/${userId}/`
  if (!key.startsWith(prefix)) return false
  const parts = key.slice(prefix.length).split('/')
  const file = parts.pop() ?? ''
  return FOLDERS.includes(parts.join('/')) && FILE_SHAPE.test(file) && !file.startsWith('.') && !file.includes('..')
}

export type UrlCheck = { ok: true; key: string } | { ok: false; reason: 'invalid' | 'foreign' | 'not_yours' }

const refuse = (reason: 'invalid' | 'foreign' | 'not_yours'): UrlCheck => ({ ok: false, reason })

/**
 * Turns an address sent by the browser into a storage key, or refuses it. The
 * address must be on our own public storage host and under the caller's own
 * prefix. Nothing is ever fetched from an address that fails this check, which
 * is what closes server side request forgery.
 *
 *   foreign    not our storage host (another site, a private address, user info)
 *   not_yours  our host, but not a file this account uploaded
 *   invalid    not a plain file address at all
 */
export function keyFromFileUrl(fileUrl: unknown, userId: string): UrlCheck {
  if (typeof fileUrl !== 'string' || fileUrl.length === 0 || fileUrl.length > 1000) return refuse('invalid')
  const configured = process.env.CLOUDFLARE_R2_PUBLIC_URL
  if (!configured) return refuse('invalid')

  let url: URL
  let base: URL
  try {
    url = new URL(fileUrl)
    base = new URL(configured)
  } catch {
    return refuse('invalid')
  }

  if (url.protocol !== base.protocol || url.host !== base.host || url.username || url.password) return refuse('foreign')
  if (url.search || url.hash || /[?#]/.test(fileUrl)) return refuse('invalid')

  // The URL parser has already resolved any dot segments, so a walk into another
  // student's folder shows up here as that student's key.
  const basePath = base.pathname.replace(/\/+$/, '')
  if (!url.pathname.startsWith(`${basePath}/`)) return refuse('foreign')
  const key = url.pathname.slice(basePath.length + 1)
  if (key.includes('%')) return refuse('invalid')
  return isOwnKey(key, userId) ? { ok: true, key } : refuse('not_yours')
}

/** The public address of a key, built from the configured base and never from anything the browser sent. */
export function publicUrlForKey(key: string): string {
  return `${(process.env.CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/+$/, '')}/${key}`
}

/** The cleaned file name of a key, without the time and random parts. */
export function displayNameFromKey(key: string): string {
  const name = key.split('/').pop() ?? key
  return name.replace(/^\d+-[a-f0-9]+-/, '')
}

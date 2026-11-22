import { NextResponse } from 'next/server'
import { getCallerWithRole } from '@/lib/api-auth'
import { rateLimit } from '@/lib/rate-limit'
import { MAX_UPLOAD_BYTES } from '@/lib/documents'
import { keyFromFileUrl, sniffFile, type FileKind } from '@/lib/doc-files'
import { readFromR2 } from '@/lib/r2'
import { cleanAnalysis } from '@/lib/doc-analysis'
import { decideStatus, loadPolicy, type AiDocType } from '@/lib/doc-policy'
import { sealResult } from '@/lib/doc-seal'

/**
 * The one place a student's document is read by the AI. The five routes that
 * read documents (resume, police, Aadhaar, degree, marksheet) all call this.
 *
 *   1. The person is the signed in student, never an id from the request.
 *   2. The file must be one this student uploaded here. It is read from storage
 *      by its key. Nothing is fetched from an address the browser sent.
 *   3. The AI reads it, and the server decides what that means.
 *   4. The result is sealed, so the student can look at it and save it but
 *      cannot change it on the way back.
 */

export interface ReadConfig {
  /** The document this route reads. A route may pick it from the body, for example the marksheet class. */
  type: AiDocType | ((body: Record<string, unknown>) => AiDocType)
  analyze: (content: string, isImage: boolean, type: AiDocType) => Promise<unknown>
}

const fail = (status: number, error: string) => NextResponse.json({ success: false, error }, { status })

const AI_FAILURE_NOTE = 'The AI could not read this document. You can still save it and an admin will take a look.'

/** What the student sees when the AI could not read the document. It is never approved. */
function fallbackAnalysis(type: AiDocType): Record<string, unknown> {
  if (type === 'resume') {
    return {
      ats_score: 0,
      authenticity_score: 0,
      summary: 'The AI could not analyze this resume. You can still save it and an admin will take a look.',
      strengths: [],
      improvements: ['Please upload it again if this keeps happening'],
      keywords_found: [],
      keywords_missing: [],
      top_skills: [],
      issues: [AI_FAILURE_NOTE],
    }
  }
  if (type === 'police') return { is_police_certificate: false, confidence: 0, issues: [AI_FAILURE_NOTE] }
  return { verified: false, confidence: 0, issues: [AI_FAILURE_NOTE] }
}

/**
 * Best effort text for a PDF. A failure or a slow read is fine, the image reader
 * takes over. The timer is always cleared so it never outlives the request.
 */
async function tryExtractPdfText(buffer: Buffer): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), 4000)
  })
  try {
    return await Promise.race([
      (async () => {
        const { extractText, getDocumentProxy } = await import('unpdf')
        const pdf = await getDocumentProxy(new Uint8Array(buffer))
        const { text } = await extractText(pdf, { mergePages: true })
        return text && text.trim().length > 20 ? text : null
      })(),
      timeout,
    ])
  } catch (error) {
    console.warn('[doc-read] reading the PDF text failed, using the image reader:', (error as Error).message)
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Small PDFs go as text, which is cheaper. Everything else goes to the AI as the file itself. */
export async function prepareContent(buffer: Buffer, kind: FileKind): Promise<{ content: string; isImage: boolean }> {
  if (kind.mime === 'application/pdf' && buffer.length < 2 * 1024 * 1024) {
    const text = await tryExtractPdfText(buffer)
    if (text) return { content: text, isImage: false }
  }
  return { content: `data:${kind.mime};base64,${buffer.toString('base64')}`, isImage: true }
}

export async function readDocument(request: Request, config: ReadConfig): Promise<Response> {
  const caller = await getCallerWithRole(['student'])
  if (!caller) return fail(401, 'Please sign in again to continue.')
  if (!rateLimit(`doc-read:${caller.userId}`, 20, 60 * 60_000)) {
    return fail(429, 'You are checking documents very quickly. Please wait a little and try again.')
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'That request could not be understood.')
  const input = body as Record<string, unknown>
  const type = typeof config.type === 'function' ? config.type(input) : config.type

  // Only our own storage, and only this student's own folder. Anything else is refused before any request is made.
  const checked = keyFromFileUrl(input.fileUrl, caller.userId)
  // Compared with === false because this project does not run strict null checks, which narrowing on the flag needs.
  if (checked.ok === false) {
    return checked.reason === 'not_yours'
      ? fail(403, 'That file does not belong to your account. Please upload it again.')
      : fail(400, 'Use a file you uploaded here. Links to other sites are not accepted.')
  }

  try {
    let file: { buffer: Buffer }
    try {
      file = await readFromR2(checked.key, MAX_UPLOAD_BYTES)
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === 'missing') return fail(400, 'That file could not be found. Please upload it again.')
      if (code === 'too_large') return fail(400, 'That file is too large to read. The limit is 10 MB.')
      console.error('[doc-read] the file could not be loaded:', (error as Error).message)
      return fail(502, 'The file could not be loaded right now. Please try again in a moment.')
    }

    const kind = sniffFile(file.buffer)
    if (!kind) return fail(400, 'Only PDF, JPG or PNG files can be read.')

    const { content, isImage } = await prepareContent(file.buffer, kind)

    let analysis: Record<string, unknown>
    let aiFailed = false
    try {
      const answer = await config.analyze(content, isImage, type)
      if (!answer || typeof answer !== 'object' || Array.isArray(answer)) throw new Error('The AI answer was not an object')
      analysis = cleanAnalysis(answer)
    } catch (error) {
      console.error(`[doc-read] ${type} could not be analysed:`, (error as Error).message)
      aiFailed = true
      analysis = fallbackAnalysis(type)
    }

    const status = aiFailed ? 'needs_review' : decideStatus(type, analysis, await loadPolicy())
    const seal = sealResult({ sub: caller.userId, type, key: checked.key, analysis, status })
    return NextResponse.json({ success: true, analysis, status, seal })
  } catch (error) {
    console.error(`[doc-read] ${type} failed:`, (error as Error).message)
    return fail(500, 'The document could not be checked right now. Please try again.')
  }
}

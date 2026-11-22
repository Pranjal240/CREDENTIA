import { analyzePoliceDoc } from '@/lib/groq'
import { readDocument } from '@/lib/doc-read'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

/** Reads the signed in student's police certificate. The student, the file and the decision are all worked out on the server. */
export async function POST(request: Request) {
  return readDocument(request, { type: 'police', analyze: (content, isImage) => analyzePoliceDoc(content, isImage) })
}

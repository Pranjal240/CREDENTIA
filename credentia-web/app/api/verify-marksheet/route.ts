import { analyzeMarksheet } from '@/lib/groq'
import { readDocument } from '@/lib/doc-read'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

/**
 * Reads the signed in student's 10th or 12th marksheet. The class comes from the
 * body and picks one of the two document types, nothing else in the body is used.
 */
export async function POST(request: Request) {
  return readDocument(request, {
    type: (body) => (body.marksheetType === '12th' ? 'marksheet_12th' : 'marksheet_10th'),
    analyze: (content, isImage, type) => analyzeMarksheet(content, isImage, type === 'marksheet_12th' ? '12th' : '10th'),
  })
}

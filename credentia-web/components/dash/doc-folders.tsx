import { Button } from '@/components/ui/button'
import type { FolderEntry } from '@/components/shell/folder-window'
import type { FolderSpec } from '@/components/dash/folder-shelf'
import { statusMeta } from '@/components/dash/kit'
import { DOC_ROUTE, docLabel, type DocType } from '@/lib/documents'
import { formatDateShort } from '@/lib/format'
import type { VerificationRow } from '@/hooks/use-student-data'

const GROUPS: { id: string; label: string; art: FolderSpec['art']; types: DocType[]; hint: string }[] = [
  { id: 'career', label: 'Resume', art: 'crimson', types: ['resume'], hint: 'Your resume and its ATS result' },
  { id: 'identity', label: 'Identity', art: 'obsidian', types: ['aadhaar', 'police'], hint: 'Aadhaar and police certificate' },
  { id: 'education', label: 'Education', art: 'ember', types: ['degree', 'marksheet_10th', 'marksheet_12th', 'passport'], hint: 'Degree, marksheets and other credentials' },
]

const isImage = (url?: string | null) => /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url ?? '')

/** One file in a folder window for a saved document. */
export function docEntry(row: VerificationRow): FolderEntry {
  const status = statusMeta(row.status)
  return {
    id: row.id,
    name: row.document_filename || docLabel(row.type),
    kind: isImage(row.document_url) ? 'image' : 'pdf',
    meta: [docLabel(row.type), row.ai_confidence ? `${row.ai_confidence}% confidence` : null].filter(Boolean).join(', '),
    date: formatDateShort(row.updated_at),
    timestamp: row.updated_at ? new Date(row.updated_at).getTime() : 0,
    status,
    href: row.document_url ?? undefined,
    copyValue: row.document_url ?? undefined,
    copyLabel: 'File link',
    details: [
      { label: 'Document', value: docLabel(row.type) },
      { label: 'Status', value: status.label },
      ...(row.ai_confidence ? [{ label: 'AI confidence', value: `${row.ai_confidence}%` }] : []),
      ...(row.rejection_reason ? [{ label: 'Reviewer note', value: row.rejection_reason }] : []),
    ],
  }
}

/**
 * The student's saved documents sorted into three folders. Only documents that
 * were really uploaded are listed, so an empty folder says so.
 */
export function buildDocFolders(rows: VerificationRow[]): FolderSpec[] {
  const uploaded = rows.filter((row) => row.status !== 'not_submitted' && row.document_url)
  return GROUPS.map((group) => {
    const entries = uploaded.filter((row) => (group.types as string[]).includes(row.type)).map(docEntry)
    return {
      id: group.id,
      label: group.label,
      art: group.art,
      meta: entries.length === 0 ? 'Empty' : `${entries.length} file${entries.length === 1 ? '' : 's'}`,
      subtitle: group.hint,
      entries,
      emptyTitle: 'Nothing here yet',
      emptyHint: 'Upload a document and it will appear in this folder.',
      actions: (
        <Button href={DOC_ROUTE[group.types[0]]} variant="primary" size="sm">
          Upload
        </Button>
      ),
    }
  })
}

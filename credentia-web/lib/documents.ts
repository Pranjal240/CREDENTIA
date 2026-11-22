/** The document types stored in `verifications.type`. */
export type DocType = 'resume' | 'police' | 'aadhaar' | 'degree' | 'marksheet_10th' | 'marksheet_12th' | 'passport'

export const DOC_TYPES: DocType[] = ['resume', 'police', 'aadhaar', 'degree', 'marksheet_10th', 'marksheet_12th', 'passport']

/** The four documents that make up the trust score. The rest are bonus documents. */
export const CORE_DOC_TYPES: DocType[] = ['resume', 'police', 'aadhaar', 'degree']

export const DOC_LABEL: Record<DocType, string> = {
  resume: 'Resume',
  police: 'Police certificate',
  aadhaar: 'Aadhaar',
  degree: 'Degree certificate',
  marksheet_10th: '10th marksheet',
  marksheet_12th: '12th marksheet',
  passport: 'Additional credential',
}

/** Short names for chart axes, where the full label does not fit. */
export const DOC_SHORT: Record<DocType, string> = {
  resume: 'Resume',
  police: 'Police',
  aadhaar: 'Aadhaar',
  degree: 'Degree',
  marksheet_10th: '10th',
  marksheet_12th: '12th',
  passport: 'Other',
}

/** The student page where each document is uploaded and reviewed. */
export const DOC_ROUTE: Record<DocType, string> = {
  resume: '/dashboard/student/resume',
  police: '/dashboard/student/police',
  aadhaar: '/dashboard/student/aadhaar',
  degree: '/dashboard/student/degree',
  marksheet_10th: '/dashboard/student/degree',
  marksheet_12th: '/dashboard/student/degree',
  passport: '/dashboard/student/saved',
}

/** The largest file a student can upload, in bytes. The browser and the server both enforce it. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/** The only places a student's files can go in storage, each one a folder under the student's own prefix. */
export const UPLOAD_FOLDERS = ['resumes', 'police', 'aadhaar', 'degrees/degree', 'degrees/10th', 'degrees/12th', 'degrees/other'] as const
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number]

/** What the upload box accepts. The server reads the real bytes again, so this is only a courtesy. */
export const UPLOAD_ACCEPT = { 'application/pdf': ['.pdf'], 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] }
export const UPLOAD_ACCEPT_TEXT = 'PDF, JPG or PNG, up to 10 MB'

export const isDocType = (value: unknown): value is DocType => typeof value === 'string' && (DOC_TYPES as string[]).includes(value)

export const docLabel = (type: string) => (isDocType(type) ? DOC_LABEL[type] : type.replace(/_/g, ' '))

export const docShort = (type: string) => (isDocType(type) ? DOC_SHORT[type] : type.replace(/_/g, ' '))

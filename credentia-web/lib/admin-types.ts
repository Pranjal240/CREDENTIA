/** Shapes shared by the admin API routes and the admin pages. */

export type AdminRole = 'student' | 'company' | 'university' | 'admin'

export interface AdminUser {
  id: string
  full_name: string | null
  email: string | null
  role: AdminRole
  phone: string | null
  is_active: boolean
  avatar_url: string | null
  created_at: string | null
  last_login_at: string | null
}

export interface AdminDoc {
  id: string
  type: string
  status: string
  ai_confidence: number | null
  updated_at: string | null
}

export interface AdminStudent {
  id: string
  name: string | null
  email: string | null
  course: string | null
  branch: string | null
  graduation_year: number | null
  cgpa: number | null
  percentage_10th: number | null
  percentage_12th: number | null
  trust_score: number | null
  ats_score: number | null
  verified_docs_count: number | null
  profile_is_public: boolean | null
  police_share_with_companies: boolean | null
  city: string | null
  state: string | null
  roll_number: string | null
  university_id: string | null
  degree_verified: boolean | null
  police_verified: boolean | null
  aadhaar_verified: boolean | null
}

export interface AdminCompanyRecord {
  id: string
  company_name: string | null
  industry: string | null
  company_size: string | null
  website: string | null
  state: string | null
  description: string | null
  gst_number: string | null
  is_verified: boolean | null
}

export interface AdminUniversityRecord {
  id: string
  university_name: string | null
  ugc_id: string | null
  naac_grade: string | null
  state: string | null
  city: string | null
  data_sharing_on: boolean | null
  is_verified: boolean | null
}

export interface AdminUserDetail {
  user: AdminUser
  student: AdminStudent | null
  docs: AdminDoc[]
  company: AdminCompanyRecord | null
  university: AdminUniversityRecord | null
  /** Name of the institution a student has linked to. */
  linkedUniversity: string | null
  counts: { applications?: number; saved?: number; students?: number }
}

export interface AdminVerification {
  id: string
  student_id: string
  student_name: string
  student_email: string
  type: string
  status: string
  ai_confidence: number | null
  /** Only present when a single document is opened. */
  ai_result?: Record<string, unknown> | null
  document_url: string | null
  document_filename: string | null
  external_link: string | null
  rejection_reason: string | null
  admin_reviewed_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface AdminAudit {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

/** A company or a university as the admin sees it: the account and the organisation together. */
export interface AdminEntity {
  id: string
  name: string
  email: string | null
  contact: string | null
  phone: string | null
  is_active: boolean
  is_verified: boolean
  /** False when the account exists but the organisation details were never saved. */
  has_record: boolean
  created_at: string | null
  last_login_at: string | null
  city: string | null
  state: string | null
  industry: string | null
  website: string | null
  company_size: string | null
  description: string | null
  ugc_id: string | null
  naac_grade: string | null
  /** Students linked (universities) or applications received (companies). */
  count: number
}

export interface SupportConversation {
  id: string
  user_id: string
  user_role: string
  user_name: string | null
  user_email: string | null
  status: string
  subject: string | null
  last_message_at: string | null
  created_at: string | null
  unread_count: number
  preview: string
  preview_role: string
}

export interface SupportMessage {
  id: string
  conversation_id: string
  sender_id: string | null
  sender_role: string
  content: string
  file_url: string | null
  file_name: string | null
  file_type: string | null
  is_read: boolean
  created_at: string
}

export interface PlatformSetting {
  key: string
  value: string
  label: string
  description: string
  updated_at: string | null
}

/** Whether a service the platform depends on is set up. Never carries a key or a secret. */
export interface ServiceStatus {
  name: string
  provider: string
  detail: string
  ready: boolean
}

export interface QueueItem {
  id: string
  student_id: string
  student_name: string
  type: string
  status: string
  ai_confidence: number | null
  updated_at: string | null
}

export interface ApprovalItem {
  id: string
  kind: 'university' | 'company'
  name: string
  place: string
  created_at: string | null
}

export interface AdminOverview {
  generatedAt: string
  users: { total: number; students: number; companies: number; universities: number; admins: number; inactive: number }
  documents: { total: number; verified: number; pending: number; rejected: number; byType: Record<string, { verified: number; pending: number; rejected: number }> }
  approvals: { universities: number; companies: number; items: ApprovalItem[] }
  support: { open: number; unread: number }
  queue: QueueItem[]
  recent: Pick<AdminUser, 'id' | 'full_name' | 'email' | 'role' | 'created_at'>[]
  audit: Pick<AdminAudit, 'id' | 'actor_email' | 'action' | 'target_type' | 'target_id' | 'created_at'>[]
}

export interface AdminAnalytics {
  days: number
  bucket: 'day' | 'week' | 'month'
  labels: string[]
  signups: { student: number[]; company: number[]; university: number[] }
  processed: { verified: number[]; review: number[]; rejected: number[] }
  totals: { users: number; students: number; documents: number; verifiedRate: number; avgTrust: number; avgAts: number; avgCgpa: number }
  statuses: { label: string; value: number }[]
  pipeline: { type: string; verified: number; pending: number; rejected: number }[]
  trust: { label: string; value: number }[]
  ats: { label: string; value: number }[]
  confidence: { type: string; value: number }[]
  funnel: { label: string; value: number }[]
}

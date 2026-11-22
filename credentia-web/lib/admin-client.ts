/** Sends one admin action and returns the answer, or throws the server's own message. */
export async function adminPost<T = { success: boolean }>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'That could not be saved. Please try again.')
  return data as T
}

export const ROLE_LABEL: Record<string, string> = { student: 'Student', company: 'Company', university: 'University', admin: 'Admin' }

/** Turns an audit action such as "change_role" into words: "Changed role". */
export function describeAction(action: string): string {
  const known: Record<string, string> = {
    admin_update_verification: 'Decided on a document',
    bulk_approve: 'Approved several documents',
    bulk_reject: 'Rejected several documents',
    change_role: 'Changed a role',
    admin_edit_student: 'Edited a student',
    admin_updated_user: 'Edited an account',
    admin_updated_company: 'Updated a company',
    admin_updated_university: 'Updated a university',
    enable_company_access: 'Opened a profile to companies',
    disable_company_access: 'Hid a profile from companies',
    update_settings: 'Changed platform settings',
    support_resolved: 'Resolved a support conversation',
    support_reopened: 'Reopened a support conversation',
    support_deleted: 'Deleted a support conversation',
    university_edit_cgpa: 'A university corrected a CGPA',
    save_candidate: 'A company saved a candidate',
    unsave_candidate: 'A company removed a saved candidate',
  }
  if (known[action]) return known[action]
  const words = action.replace(/_/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Action'
}

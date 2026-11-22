// Portal metadata, the single source of truth for all four portals.
// Used by the login pages and the registration page.

export type Portal = 'student' | 'university' | 'company' | 'admin'

export interface PortalMeta {
  portal: Portal
  label: string
  description: string
  /** One line shown on the portal card. */
  subtext: string
  icon: 'graduation' | 'building' | 'briefcase' | 'shield'
  /** Admin only. Not offered on public pages. */
  restricted: boolean
}

export const PORTAL_META: Record<Portal, PortalMeta> = {
  student: {
    portal: 'student',
    label: 'Student Portal',
    description: 'Access your credential dashboard, upload documents, and track verifications.',
    subtext: 'Upload credentials, get verified, and share one trusted link.',
    icon: 'graduation',
    restricted: false,
  },
  university: {
    portal: 'university',
    label: 'University Portal',
    description: 'Manage your student registry and verify academic credentials.',
    subtext: 'Manage your student registry and academic records.',
    icon: 'building',
    restricted: false,
  },
  company: {
    portal: 'company',
    label: 'Company Portal',
    description: 'Search verified talent and access trusted candidate profiles.',
    subtext: 'Find verified talent with trusted credential scores.',
    icon: 'briefcase',
    restricted: false,
  },
  admin: {
    portal: 'admin',
    label: 'Admin Access',
    description: 'Restricted access. Authorized personnel only.',
    subtext: 'Platform administration. Authorized personnel only.',
    icon: 'shield',
    restricted: true,
  },
}

export const PORTAL_PATHS: Record<Portal, string> = {
  student: '/dashboard/student',
  university: '/dashboard/university',
  company: '/dashboard/company',
  admin: '/dashboard/admin',
}

export function isValidPortal(p: string | null | undefined): p is Portal {
  return !!p && ['student', 'university', 'company', 'admin'].includes(p)
}

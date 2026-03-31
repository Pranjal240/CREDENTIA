// Portal metadata — single source of truth for all 4 portals.
// Used by login pages, the landing page portal cards, and error components.

export type Portal = 'student' | 'university' | 'company' | 'admin'

export interface PortalMeta {
  portal:      Portal
  label:       string
  description: string
  subtext:     string          // shown on the portal card
  accent:      string          // primary hex colour
  accentRgb:   string          // for rgba() usage
  gradient:    string          // CSS gradient for card
  border:      string          // CSS border colour
  icon:        'graduation' | 'building' | 'briefcase' | 'shield'
  restricted:  boolean         // admin only — not on landing
}

export const PORTAL_META: Record<Portal, PortalMeta> = {
  student: {
    portal:      'student',
    label:       'Student Portal',
    description: 'Access your credential dashboard, upload documents, and track verifications.',
    subtext:     'Upload credentials, get verified, and connect with top companies.',
    accent:      '#6366f1',
    accentRgb:   '99,102,241',
    gradient:    'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.03) 100%)',
    border:      'rgba(99,102,241,0.2)',
    icon:        'graduation',
    restricted:  false,
  },
  university: {
    portal:      'university',
    label:       'University Portal',
    description: 'Manage your student registry and verify academic credentials.',
    subtext:     'Manage your student registry and verify academic credentials.',
    accent:      '#0d9488',
    accentRgb:   '13,148,136',
    gradient:    'linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(13,148,136,0.03) 100%)',
    border:      'rgba(13,148,136,0.2)',
    icon:        'building',
    restricted:  false,
  },
  company: {
    portal:      'company',
    label:       'Company Portal',
    description: 'Search verified talent and access trusted candidate profiles.',
    subtext:     'Find verified talent with trusted credential scores.',
    accent:      '#7c3aed',
    accentRgb:   '124,58,237',
    gradient:    'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0.03) 100%)',
    border:      'rgba(124,58,237,0.2)',
    icon:        'briefcase',
    restricted:  false,
  },
  admin: {
    portal:      'admin',
    label:       'Admin Access',
    description: 'Restricted access. Authorized personnel only.',
    subtext:     'Platform administration. Authorized personnel only.',
    accent:      '#dc2626',
    accentRgb:   '220,38,38',
    gradient:    'linear-gradient(135deg, rgba(220,38,38,0.12) 0%, rgba(220,38,38,0.03) 100%)',
    border:      'rgba(220,38,38,0.2)',
    icon:        'shield',
    restricted:  true,
  },
}

export const PORTAL_PATHS: Record<Portal, string> = {
  student:    '/dashboard/student',
  university: '/dashboard/university',
  company:    '/dashboard/company',
  admin:      '/dashboard/admin',
}

export function isValidPortal(p: string | null | undefined): p is Portal {
  return !!p && ['student', 'university', 'company', 'admin'].includes(p)
}

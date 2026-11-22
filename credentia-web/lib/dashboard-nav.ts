import {
  BarChart3,
  BookmarkCheck,
  Briefcase,
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  Headphones,
  LayoutDashboard,
  Link2,
  ScrollText,
  Search,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type DashRole = 'student' | 'company' | 'university' | 'admin'

export interface NavItem {
  /** Full name, used in titles, tooltips and the more sheet. */
  label: string
  /** One word for the mobile dock. */
  short: string
  href: string
  icon: LucideIcon
  /** Description under the page title. */
  description: string
  /** Placeholder text typed into the ask bar while on this page. */
  prompt: string
  /** Shows a count badge, fed by the shell. */
  badge?: 'support'
}

export const ROLE_LABEL: Record<DashRole, string> = {
  student: 'Student',
  company: 'Company',
  university: 'University',
  admin: 'Admin',
}

/**
 * Every dashboard route. These are the real routes of the app, so the docks and
 * the search palette never link to a page that does not exist.
 */
export const DASH_NAV: Record<DashRole, NavItem[]> = {
  student: [
    { label: 'Dashboard', short: 'Home', href: '/dashboard/student', icon: LayoutDashboard, description: 'Your verification progress and trust score.', prompt: 'Which of my documents are verified?' },
    { label: 'Overview', short: 'Overview', href: '/dashboard/student/overview', icon: ClipboardList, description: 'Academic details and scores read from your documents.', prompt: 'What does my profile show to companies?' },
    { label: 'Resume', short: 'Resume', href: '/dashboard/student/resume', icon: FileText, description: 'Upload a resume and get an ATS score with feedback.', prompt: 'How can I improve my ATS score?' },
    { label: 'Police Certificate', short: 'Police', href: '/dashboard/student/police', icon: Shield, description: 'Verify your police clearance certificate.', prompt: 'Is my police certificate approved?' },
    { label: 'Aadhaar', short: 'Aadhaar', href: '/dashboard/student/aadhaar', icon: CreditCard, description: 'Confirm your identity. Only the last four digits of the number are kept.', prompt: 'Why was my Aadhaar flagged?' },
    { label: 'Degree', short: 'Degree', href: '/dashboard/student/degree', icon: GraduationCap, description: 'Verify your degree and academic records.', prompt: 'Show my degree details.' },
    { label: 'Company Apply', short: 'Apply', href: '/dashboard/student/apply', icon: Briefcase, description: 'Apply to companies with your verified profile.', prompt: 'Which companies are hiring now?' },
    { label: 'My Verifications', short: 'Records', href: '/dashboard/student/saved', icon: BookmarkCheck, description: 'Every document and its verification status.', prompt: 'Show my rejected documents.' },
    { label: 'My Link', short: 'Link', href: '/dashboard/student/my-link', icon: Link2, description: 'Your public verified profile link and QR code.', prompt: 'Share my verified profile.' },
    { label: 'Settings', short: 'Settings', href: '/dashboard/student/settings', icon: Settings, description: 'Profile details and your linked university.', prompt: 'Update my profile details.' },
  ],
  company: [
    { label: 'Talent Search', short: 'Talent', href: '/dashboard/company', icon: Search, description: 'Find verified candidates and rank them for a role.', prompt: 'Find verified candidates with CGPA above 8' },
    { label: 'Applicants', short: 'Applicants', href: '/dashboard/company/applicants', icon: Users, description: 'People who applied to your company.', prompt: 'Who applied this week?' },
    { label: 'Saved Candidates', short: 'Saved', href: '/dashboard/company/saved', icon: BookmarkCheck, description: 'Candidates you bookmarked.', prompt: 'Show my saved candidates.' },
    { label: 'Analytics', short: 'Analytics', href: '/dashboard/company/analytics', icon: BarChart3, description: 'Talent pool and hiring insights from real data.', prompt: 'How many candidates are fully verified?' },
    { label: 'Settings', short: 'Settings', href: '/dashboard/company/settings', icon: Settings, description: 'Company profile and access settings.', prompt: 'Update my company profile.' },
  ],
  university: [
    { label: 'Student Registry', short: 'Registry', href: '/dashboard/university', icon: Users, description: 'Students linked to your institution and their verification.', prompt: 'Which students are unverified?' },
    { label: 'Analytics', short: 'Analytics', href: '/dashboard/university/analytics', icon: BarChart3, description: 'Verification completion across your institution.', prompt: 'How many students completed verification?' },
    { label: 'Settings', short: 'Settings', href: '/dashboard/university/settings', icon: Settings, description: 'Institution name, place and identifiers.', prompt: 'Update my institution details.' },
  ],
  admin: [
    { label: 'Dashboard', short: 'Home', href: '/dashboard/admin', icon: LayoutDashboard, description: 'Platform activity and what needs a decision.', prompt: 'What needs review today?' },
    { label: 'Analytics', short: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3, description: 'Users, verifications and trust across the platform.', prompt: 'How are verifications trending?' },
    { label: 'All Users', short: 'Users', href: '/dashboard/admin/users', icon: Users, description: 'Every account across all roles.', prompt: 'Find a user by name or email.' },
    { label: 'Verifications', short: 'Verify', href: '/dashboard/admin/verifications', icon: Shield, description: 'Review and override document verification.', prompt: 'Show documents that need review.' },
    { label: 'Audit Logs', short: 'Audit', href: '/dashboard/admin/audit', icon: ScrollText, description: 'Every admin action taken on the platform.', prompt: 'What did admins change today?' },
    { label: 'Universities', short: 'Universities', href: '/dashboard/admin/outreach', icon: Building2, description: 'Registered universities and approvals.', prompt: 'Which universities await approval?' },
    { label: 'Companies', short: 'Companies', href: '/dashboard/admin/companies', icon: Briefcase, description: 'Registered companies and access.', prompt: 'Which companies have talent access?' },
    { label: 'Support Inbox', short: 'Support', href: '/dashboard/admin/support', icon: Headphones, description: 'Conversations from students, companies and universities.', prompt: 'Show unread support conversations.', badge: 'support' },
    { label: 'Settings', short: 'Settings', href: '/dashboard/admin/settings', icon: Settings, description: 'Platform settings.', prompt: 'Open platform settings.' },
  ],
}

export function roleFromPath(pathname: string): DashRole {
  if (pathname.startsWith('/dashboard/admin')) return 'admin'
  if (pathname.startsWith('/dashboard/university')) return 'university'
  if (pathname.startsWith('/dashboard/company')) return 'company'
  return 'student'
}

/** The nav item whose href is the longest prefix of the current path. */
export function activeNavItem(role: DashRole, pathname: string): NavItem {
  const items = DASH_NAV[role]
  let best = items[0]
  for (const item of items) {
    if ((pathname === item.href || pathname.startsWith(item.href + '/')) && item.href.length >= best.href.length) {
      best = item
    }
  }
  return best
}

/** Landing route for a role. */
export const roleHome = (role: DashRole) => `/dashboard/${role}`

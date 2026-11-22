import { BookOpen, Briefcase, Building2, FileText, MessagesSquare, ScrollText, ShieldCheck, Users } from 'lucide-react'
import { AadhaarIcon, AnalyticsIcon, CompanyIcon, DegreeIcon, PoliceIcon, ResumeIcon, ShareIcon, StudentIcon, UniversityIcon } from '@/components/brand/icons'
import type { MegaMenuItem, MegaMenuNavbarProps } from '@/components/shell/mega-menu-navbar'

/**
 * Every destination here is a route that exists, so the header never links to
 * a dead page. In page anchors (the ids after #) are defined on /features.
 */

export const SITE_FEATURES: MegaMenuItem[] = [
  {
    title: 'Resume Analysis',
    description: 'ATS score, skills and gaps read in seconds.',
    href: '/features#resume',
    icon: ResumeIcon,
  },
  {
    title: 'Police Certificate',
    description: 'Issuer, number and date extracted and checked.',
    href: '/features#police',
    icon: PoliceIcon,
  },
  {
    title: 'Aadhaar Check',
    description: 'Identity confirmed. Only the last four digits of the number are kept.',
    href: '/features#aadhaar',
    icon: AadhaarIcon,
  },
  {
    title: 'Degree Verification',
    description: 'University, course, year and CGPA validated.',
    href: '/features#degree',
    icon: DegreeIcon,
  },
  {
    title: 'Verified Share Link',
    description: 'One trusted link and QR code for any recruiter.',
    href: '/features#share-link',
    icon: ShareIcon,
  },
  {
    title: 'Live Analytics',
    description: 'Completion and trust insights that update in real time.',
    href: '/features#analytics',
    icon: AnalyticsIcon,
  },
]

export const SITE_AUDIENCES: MegaMenuItem[] = [
  {
    title: 'Students',
    description: 'Upload once, get verified, share one link.',
    href: '/login/student',
    icon: StudentIcon,
  },
  {
    title: 'Companies',
    description: 'Search verified talent and review trusted profiles.',
    href: '/for-companies',
    icon: CompanyIcon,
  },
  {
    title: 'Universities',
    description: 'Manage your registry and confirm academic records.',
    href: '/login/university',
    icon: UniversityIcon,
  },
]

export const SITE_RESOURCE_GROUPS: MegaMenuNavbarProps['resourceGroups'] = [
  {
    title: 'Company',
    links: [
      { title: 'About us', href: '/about', icon: Building2 },
      { title: 'Team', href: '/team', icon: Users },
      { title: 'Careers', href: '/careers', icon: Briefcase },
      { title: 'Contact', href: '/contact', icon: MessagesSquare },
    ],
  },
  {
    title: 'Learn',
    links: [
      { title: 'How it works', href: '/how-it-works', icon: BookOpen },
      { title: 'Data security', href: '/data-security', icon: ShieldCheck },
      { title: 'Blog', href: '/blog', icon: ScrollText },
      { title: 'Pricing', href: '/pricing', icon: FileText },
    ],
  },
]

export const SITE_RESOURCE_PROMO: NonNullable<MegaMenuNavbarProps['resourcePromo']> = {
  icon: BookOpen,
  title: 'How verification works',
  description: 'From upload to a trusted link, step by step, with what we check and what we never store.',
  href: '/how-it-works',
  cta: 'Read the guide',
}

export const SITE_FEATURES_FOOTER: NonNullable<MegaMenuNavbarProps['featuresFooter']> = {
  text: 'Hiring or running a registry?',
  href: '/for-companies',
  cta: 'See the company portal',
}

export const SITE_AUDIENCE_FOOTER: NonNullable<MegaMenuNavbarProps['audienceFooter']> = {
  title: 'New to Credentia?',
  text: 'See what we verify and how a profile becomes trusted.',
  href: '/how-it-works',
  cta: 'Start with the overview',
}

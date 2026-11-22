/** Contact details and links shared by the footer, the contact page and the quick access dock. */

export const CONTACT_EMAIL = 'pranjalwork2602@gmail.com'

export const SOCIALS = {
  x: { label: 'X', handle: '@Nihal81788', href: 'https://x.com/Nihal81788' },
  linkedin: { label: 'LinkedIn', handle: 'Pranjal Mishra', href: 'https://www.linkedin.com/in/pranjal-mishra-3a7256291/' },
  instagram: { label: 'Instagram', handle: '@pranjal.__.mishra', href: 'https://www.instagram.com/pranjal.__.mishra/' },
} as const

export const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'How it works', href: '/how-it-works' },
    { label: 'For companies', href: '/for-companies' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Team', href: '/team' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy policy', href: '/privacy' },
    { label: 'Terms of service', href: '/terms' },
    { label: 'Cookie policy', href: '/cookies' },
    { label: 'Data security', href: '/data-security' },
  ],
} as const

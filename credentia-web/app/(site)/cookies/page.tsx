import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/site/legal-page'

export const metadata: Metadata = { title: 'Cookie Policy' }

const sections: LegalSection[] = [
  {
    title: '1. What are cookies?',
    items: [
      'Cookies are small text files placed on your device when you visit our platform. They help us provide essential features and remember your session.',
    ],
  },
  {
    title: '2. Essential cookies (required)',
    items: [
      'These keep you signed in and keep your session secure. They are set by our authentication provider, Supabase, when you log in.',
      'Without them you cannot use the dashboards. They are removed when you sign out.',
    ],
  },
  {
    title: '3. Preferences stored on your device',
    items: [
      'Some choices, such as the file view you picked in a folder window or the items you pinned in a dashboard, are kept in your browser storage on your own device.',
      'They are never sent to our servers, and you can clear them from your browser settings at any time.',
    ],
  },
  {
    title: '4. Advertising and tracking',
    items: [
      'We do not use advertising cookies.',
      'We do not currently run third-party analytics on this site. If that changes, this page will be updated before it does.',
    ],
  },
  {
    title: '5. Managing cookies',
    items: [
      'Most web browsers let you view and delete cookies, block all cookies or only third-party cookies, and set preferences for specific websites.',
      'Blocking essential cookies will stop you from signing in.',
    ],
  },
]

export default function CookiesPage() {
  return <LegalPage title="Cookie Policy" subtitle="Last updated: April 2026. How we use cookies and similar technologies on our platform." sections={sections} />
}

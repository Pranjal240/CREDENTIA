import type { Metadata } from 'next'
import { PORTAL_META, type Portal } from '@/lib/auth/portalMeta'

/** Each sign in page names its portal in the browser tab. The page itself is a client component. */
export function generateMetadata({ params }: { params: { portal: string } }): Metadata {
  const meta = PORTAL_META[params.portal as Portal]
  return {
    title: meta ? `${meta.label} sign in` : 'Sign in',
    description: meta?.description ?? 'Sign in to Credentia.',
    robots: { index: false },
  }
}

export default function PortalLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}

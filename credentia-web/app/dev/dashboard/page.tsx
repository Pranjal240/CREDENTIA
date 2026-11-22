import { notFound } from 'next/navigation'
import DashboardPreview from './view'

export const metadata = { title: 'Dashboard preview', robots: { index: false, follow: false } }

/**
 * Development only preview of the dashboard shell and kit with fixture data.
 * It exists to review layout and motion without signing in. Returns 404 in production.
 */
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <DashboardPreview />
}

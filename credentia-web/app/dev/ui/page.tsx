import { notFound } from 'next/navigation'
import UiGallery from './gallery'

export const metadata = { title: 'UI gallery', robots: { index: false, follow: false } }

/**
 * Development only gallery of the shared components. Everything on it is a
 * fixture for visual review, nothing here is shipped: the route returns 404
 * in production.
 */
export default function Page() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <UiGallery />
}

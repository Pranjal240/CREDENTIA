import { notFound } from 'next/navigation'
import { PreviewHarness } from './harness'

export const metadata = { title: 'Page preview', robots: { index: false, follow: false } }

/**
 * Development only. Renders any dashboard page inside the real shell with a
 * fixture identity, so layout and states can be reviewed without signing in.
 * Network calls can be mocked from the test browser. Returns 404 in production.
 */
export default function Page({ params }: { params: { slug: string[] } }) {
  if (process.env.NODE_ENV === 'production') notFound()
  return <PreviewHarness slug={params.slug.join('/')} />
}

import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { SitePeon } from '@/components/peon/site-peon'
import { SwipeFallback } from '@/components/site/swipe'

/** Header, footer and the Peon assistant for every public page. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SitePeon>
      <SwipeFallback />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </SitePeon>
  )
}

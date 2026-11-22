'use client'

import * as React from 'react'
import { MegaMenuNavbar } from '@/components/shell/mega-menu-navbar'
import { SiteSearch } from '@/components/site/site-search'
import { useAuthRole } from '@/hooks/use-auth-role'
import {
  SITE_AUDIENCES,
  SITE_AUDIENCE_FOOTER,
  SITE_FEATURES,
  SITE_FEATURES_FOOTER,
  SITE_RESOURCE_GROUPS,
  SITE_RESOURCE_PROMO,
} from '@/components/site/site-nav-data'

/** The public header. Signed in visitors get a Dashboard button instead of log in and sign up. */
export function SiteHeader() {
  const { role } = useAuthRole()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const dashboardHref = role ? `/dashboard/${role}` : undefined

  // Ctrl or Cmd K opens search from any public page.
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <MegaMenuNavbar
        features={SITE_FEATURES}
        featuresFooter={SITE_FEATURES_FOOTER}
        audiences={SITE_AUDIENCES}
        audienceFooter={SITE_AUDIENCE_FOOTER}
        audienceLabel="Portals"
        resourceGroups={SITE_RESOURCE_GROUPS}
        resourcePromo={SITE_RESOURCE_PROMO}
        signedInHref={dashboardHref}
        onSearch={() => setSearchOpen(true)}
      />
      <SiteSearch open={searchOpen} onOpenChange={setSearchOpen} dashboardHref={dashboardHref} />
    </>
  )
}

export default SiteHeader

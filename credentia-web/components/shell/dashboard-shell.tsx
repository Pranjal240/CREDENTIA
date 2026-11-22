'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import AILoader from '@/components/smoothui/components/ai-loader'
import { DASH_NAV, activeNavItem } from '@/lib/dashboard-nav'
import { useDash } from '@/components/dash/dashboard-context'
import { SearchContext } from '@/components/search/search-context'
import { CredentiaSearch } from '@/components/search/credentia-search'
import { DashboardTopBar } from '@/components/shell/dashboard-topbar'
import { BottomDock, SideDock, type DockBadges } from '@/components/shell/dashboard-dock'
import { PeonProvider } from '@/components/peon/peon-provider'

/** Unread support conversations for admins, refreshed on a timer. */
function useAdminSupportUnread(userId: string | null, enabled: boolean): number {
  const [count, setCount] = React.useState(0)
  React.useEffect(() => {
    if (!enabled || !userId) return
    let alive = true
    const load = async () => {
      try {
        const res = await fetch('/api/admin/support?summary=1', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (alive && typeof data.unread === 'number') setCount(data.unread)
      } catch {
        // Keep the last known count.
      }
    }
    load()
    const timer = window.setInterval(load, 30_000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [userId, enabled])
  return count
}

/**
 * The frame around every dashboard page: glass top bar, a floating dock on the
 * left (a bottom dock on phones), and a glass stage that scrolls on its own so
 * the bar and dock stay put. It also owns the search palette, opened with the
 * ask bar or Ctrl or Cmd K from any page.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { loading, role, userId, displayName, signOut } = useDash()
  const pathname = usePathname() ?? ''
  const items = DASH_NAV[role]
  const current = activeNavItem(role, pathname)

  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchSeed, setSearchSeed] = React.useState('')
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const supportUnread = useAdminSupportUnread(userId, role === 'admin')
  const badges: DockBadges = { support: supportUnread }

  const searchApi = React.useMemo(
    () => ({
      open: (options?: { query?: string }) => {
        setSearchSeed(options?.query ?? '')
        setSearchOpen(true)
      },
    }),
    [],
  )

  // Ctrl or Cmd K is handled here so it works before the palette has ever opened.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchSeed('')
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Every page starts at the top of the stage.
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <SearchContext.Provider value={searchApi}>
      <PeonProvider signedIn={Boolean(userId)} role={role} name={displayName} aboveDock onOpenSearch={() => searchApi.open()}>
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-on-brand"
      >
        Skip to content
      </a>

      <div className="mx-auto w-full max-w-none px-3 pb-[96px] pt-3 sm:px-5 sm:pt-4 lg:px-8 lg:pb-6 [@media(max-height:660px)]:lg:pb-[96px]">
        <DashboardTopBar prompt={current.prompt} onOpenSearch={() => searchApi.open()} />

        <div className="relative mt-3">
          <SideDock items={items} activeHref={current.href} badges={badges} />

          <main id="dashboard-main" className="glass-stage relative rounded-[28px] sm:rounded-[34px]">
            <div
              ref={scrollRef}
              tabIndex={-1}
              className="px-4 pb-10 pt-5 outline-none sm:px-8 sm:pt-7 lg:h-[max(560px,calc(100dvh-150px))] lg:overflow-y-auto lg:overscroll-contain lg:px-12 lg:pb-12 lg:pt-9 lg:scrollbar-thin"
            >
              {loading && !userId ? (
                <div className="grid min-h-[320px] place-items-center">
                  <AILoader label="Loading your workspace" variant="bar" />
                </div>
              ) : (
                <div key={pathname} className="animate-fade-in">
                  {children}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <BottomDock items={items} activeHref={current.href} badges={badges} onSignOut={signOut} />

      <CredentiaSearch open={searchOpen} onOpenChange={setSearchOpen} role={role} initialQuery={searchSeed} />
      </PeonProvider>
    </SearchContext.Provider>
  )
}

export default DashboardShell

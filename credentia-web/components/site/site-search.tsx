'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Sparkles, UserPlus } from 'lucide-react'
import SearchModal, { type QuickAction, type SearchResult } from '@/components/ui/search-modal'
import { usePeonPanel } from '@/components/peon/peon-provider'
import { SITE_AUDIENCES, SITE_FEATURES, SITE_RESOURCE_GROUPS } from '@/components/site/site-nav-data'

interface SiteSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Where a signed in visitor's dashboard lives. */
  dashboardHref?: string
}

/** Every public page a visitor can reach, with a line about it. All of them are real routes. */
const PAGES: { name: string; meta: string; href: string; group: string }[] = [
  ...SITE_FEATURES.map((item) => ({ name: item.title, meta: item.description ?? '', href: item.href, group: 'Features' })),
  ...SITE_AUDIENCES.map((item) => ({ name: item.title, meta: item.description ?? '', href: item.href, group: 'For you' })),
  ...(SITE_RESOURCE_GROUPS ?? []).flatMap((group) => group.links.map((item) => ({ name: item.title, meta: item.description ?? '', href: item.href, group: group.title }))),
  { name: 'Terms of service', meta: 'The rules for using Credentia.', href: '/terms', group: 'Legal' },
  { name: 'Privacy policy', meta: 'What we collect and why.', href: '/privacy', group: 'Legal' },
  { name: 'Cookie policy', meta: 'The cookies we use.', href: '/cookies', group: 'Legal' },
]

/** Words that carry no meaning for finding a page, so "how does verification work" is matched on "verification" and "work". */
const FILLER = new Set(['how', 'does', 'do', 'did', 'the', 'a', 'an', 'to', 'is', 'are', 'i', 'my', 'me', 'what', 'can', 'of', 'and', 'for', 'it', 'in', 'on', 'you', 'your', 'we', 'with', 'this', 'that', 'about', 'tell'])

/**
 * Search for the public site. It finds pages and sends a real question to Peon,
 * which answers from what Credentia does and how it keeps data. Nothing from
 * the database is searched here, because a visitor is not signed in.
 */
export function SiteSearch({ open, onOpenChange, dashboardHref }: SiteSearchProps) {
  const router = useRouter()
  const peon = usePeonPanel()
  const [query, setQuery] = React.useState('')

  React.useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const everything = React.useMemo<SearchResult[]>(
    () => PAGES.map((page) => ({ id: page.href + page.name, name: page.name, meta: page.meta, group: page.group, data: page.href })),
    [],
  )

  const close = () => onOpenChange(false)
  const asked = query.trim()

  // Match word by word, best match first, so a whole question still finds the right pages.
  const results = React.useMemo<SearchResult[]>(() => {
    const words = asked.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !FILLER.has(w))
    if (words.length === 0) return everything
    return everything
      .map((result) => {
        const text = `${result.name} ${result.meta ?? ''} ${result.group ?? ''}`.toLowerCase()
        return { result, score: words.filter((w) => text.includes(w)).length }
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.result)
  }, [asked, everything])

  const quickActions = React.useMemo<QuickAction[]>(() => {
    const account: QuickAction[] = dashboardHref
      ? [{ label: 'Open my dashboard', icon: <LogIn className="h-[15px] w-[15px]" />, onClick: () => { onOpenChange(false); router.push(dashboardHref) } }]
      : [
          { label: 'Log in', icon: <LogIn className="h-[15px] w-[15px]" />, onClick: () => { onOpenChange(false); router.push('/login') } },
          { label: 'Create an account', icon: <UserPlus className="h-[15px] w-[15px]" />, onClick: () => { onOpenChange(false); router.push('/register') } },
        ]
    if (asked.split(/\s+/).filter(Boolean).length < 3 && !asked.includes('?')) return account
    const question: QuickAction = {
      label: `Ask Peon: ${asked.length > 46 ? `${asked.slice(0, 46)}...` : asked}`,
      icon: <Sparkles className="h-[15px] w-[15px]" />,
      onClick: () => {
        onOpenChange(false)
        peon.open({ prompt: asked })
      },
    }
    return [question, ...account]
  }, [asked, dashboardHref, onOpenChange, peon, router])

  return (
    <SearchModal
      modal
      open={open}
      onOpenChange={onOpenChange}
      placeholder="Search Credentia, or ask a question"
      query={query}
      onQueryChange={setQuery}
      results={results}
      filterLocally={false}
      quickActions={quickActions}
      emptyText="No page matches. Ask Peon instead, it answers questions about Credentia."
      onSelectResult={(result) => {
        const href = result.data as string | undefined
        if (href) {
          close()
          router.push(href)
        }
      }}
    />
  )
}

export default SiteSearch

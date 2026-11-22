'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Building, ChatCircleText, FileText, GraduationCap, Scroll, Shield, UserCircle, Users } from '@phosphor-icons/react'
import SearchModal, { type QuickAction, type SearchAiSummary, type SearchResult, type SearchTag } from '@/components/ui/search-modal'
import { Sparkles } from 'lucide-react'
import { DASH_NAV, type DashRole } from '@/lib/dashboard-nav'
import { SEARCH_TYPES, type SearchHit, type SearchResponse, type SearchType } from '@/lib/search/types'
import { usePeonPanel } from '@/components/peon/peon-provider'

export { SEARCH_TYPES }
export type { SearchHit, SearchResponse, SearchType }

const TYPE_META: Record<SearchType, { label: string; icon: React.ReactNode }> = {
  student: { label: 'Students', icon: <GraduationCap className="h-4 w-4" /> },
  company: { label: 'Companies', icon: <Briefcase className="h-4 w-4" /> },
  university: { label: 'Universities', icon: <Building className="h-4 w-4" /> },
  user: { label: 'Users', icon: <UserCircle className="h-4 w-4" /> },
  verification: { label: 'Verifications', icon: <Shield className="h-4 w-4" /> },
  document: { label: 'Documents', icon: <FileText className="h-4 w-4" /> },
  application: { label: 'Applications', icon: <Users className="h-4 w-4" /> },
  audit: { label: 'Audit logs', icon: <Scroll className="h-4 w-4" /> },
  support: { label: 'Support', icon: <ChatCircleText className="h-4 w-4" /> },
}

const PLACEHOLDER: Record<DashRole, string> = {
  student: 'Search your documents and companies',
  company: 'Search verified candidates and applicants',
  university: 'Search students in your registry',
  admin: 'Search users, verifications, companies and logs',
}

interface CredentiaSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: DashRole
  /** Words to start with, for example when handed over from a table. */
  initialQuery?: string
}

/**
 * The search palette for every dashboard. Short queries match the database
 * directly and answer in a few milliseconds. Longer questions, such as
 * "verified students from Delhi with CGPA above 8", are read by AI on the
 * server and turned into filters. The server decides what the caller may see.
 */
export function CredentiaSearch({ open, onOpenChange, role, initialQuery = '' }: CredentiaSearchProps) {
  const router = useRouter()
  const peon = usePeonPanel()
  const types = SEARCH_TYPES[role]
  const [query, setQuery] = React.useState('')
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() => Object.fromEntries(types.map((t) => [t, true])))
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [response, setResponse] = React.useState<SearchResponse | null>(null)
  const controller = React.useRef<AbortController | null>(null)

  // Opening with words from a table starts the search at once.
  React.useEffect(() => {
    if (open) setQuery(initialQuery)
  }, [open, initialQuery])

  const activeTypes = types.filter((t) => enabled[t])
  const words = query.trim().split(/\s+/).filter(Boolean)
  const wantsAI = words.length >= 3 || query.includes('?')

  React.useEffect(() => {
    const q = query.trim()
    controller.current?.abort()
    if (!open || q.length < 2 || activeTypes.length === 0) {
      setResponse(null)
      setLoading(false)
      setError(null)
      return
    }

    const timer = window.setTimeout(async () => {
      const ctrl = new AbortController()
      controller.current = ctrl
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ q, types: activeTypes.join(',') })
        if (wantsAI) params.set('ai', '1')
        const res = await fetch(`/api/search?${params}`, { signal: ctrl.signal, cache: 'no-store' })
        if (!res.ok) throw new Error(res.status === 401 ? 'Sign in again to search.' : 'Search is unavailable right now.')
        setResponse((await res.json()) as SearchResponse)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setResponse(null)
        setError((err as Error).message)
      } finally {
        if (controller.current === ctrl) setLoading(false)
      }
    }, 170)

    return () => window.clearTimeout(timer)
    // activeTypes and wantsAI derive from state listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open, enabled, role])

  const close = () => onOpenChange(false)

  const results = React.useMemo<SearchResult[]>(
    () =>
      (response?.groups ?? []).flatMap((group) =>
        group.hits.map((hit) => ({
          id: `${hit.type}:${hit.id}`,
          name: hit.title,
          meta: hit.subtitle,
          avatar: hit.avatar,
          badge: hit.badge,
          group: group.label || TYPE_META[hit.type].label,
          // The destination travels on the row. The modal navigates through onSelectResult.
          data: hit.href,
        })),
      ),
    [response],
  )

  const quickActions = React.useMemo<QuickAction[]>(() => {
    const q = query.trim().toLowerCase()
    const pages = DASH_NAV[role]
      .filter((item) => !q || item.label.toLowerCase().includes(q))
      .slice(0, q ? 4 : 6)
      .map((item) => ({
        label: `Go to ${item.label}`,
        icon: <item.icon className="h-[15px] w-[15px]" />,
        onClick: () => {
          close()
          router.push(item.href)
        },
      }))

    // A real question can be handed to Peon with the words already typed.
    const asked = query.trim()
    if (asked.split(/\s+/).length < 3) return pages
    const question: QuickAction = {
      label: `Ask Peon: ${asked.length > 46 ? `${asked.slice(0, 46)}...` : asked}`,
      icon: <Sparkles className="h-[15px] w-[15px]" />,
      onClick: () => {
        close()
        peon.open({ prompt: asked })
      },
    }
    return [question, ...pages]
    // close is stable enough for a palette that rebuilds on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, query, router, peon])

  const tags: SearchTag[] = types.map((t) => ({ id: t, label: TYPE_META[t].label, icon: TYPE_META[t].icon, active: enabled[t] }))

  const aiSummary: SearchAiSummary | null =
    wantsAI && (loading || response?.ai) ? { loading: loading && !response?.ai, text: response?.ai?.summary ?? '' } : null

  return (
    <SearchModal
      modal
      open={open}
      onOpenChange={onOpenChange}
      placeholder={PLACEHOLDER[role]}
      query={query}
      onQueryChange={setQuery}
      filterLocally={false}
      loading={loading}
      tags={tags}
      onTagToggle={(tag) => setEnabled((prev) => ({ ...prev, [tag.id as string]: !prev[tag.id as string] }))}
      results={results}
      resultsLabel={query.trim().length >= 2 ? (response ? `Results in ${response.tookMs} ms` : 'Searching') : undefined}
      emptyText={error ?? 'No matches. Try another word or switch a filter back on.'}
      aiSummary={aiSummary}
      quickActions={quickActions}
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

export default CredentiaSearch

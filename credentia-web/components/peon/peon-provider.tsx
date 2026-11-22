'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { Headphones, Search } from 'lucide-react'
import type { DashRole } from '@/lib/dashboard-nav'
import type { AIState } from '@/components/smoothui/components/ai-core'
import { usePeonChat, useSupportThread } from '@/hooks/use-peon'
import { PeonLauncher, type LauncherAction } from './peon-launcher'
import { PeonPanel, type PeonTab } from './peon-panel'

export interface OpenPeonOptions {
  /** A question to send as soon as the panel is open. */
  prompt?: string
  tab?: PeonTab
}

interface PeonApi {
  open: (options?: OpenPeonOptions) => void
  close: () => void
  isOpen: boolean
}

const PeonContext = React.createContext<PeonApi | null>(null)

const NOOP: PeonApi = { open: () => {}, close: () => {}, isOpen: false }

/** Opens Peon from anywhere inside a page that has it. Does nothing elsewhere. */
export function usePeonPanel(): PeonApi {
  return React.useContext(PeonContext) ?? NOOP
}

interface PeonProviderProps {
  children: React.ReactNode
  signedIn: boolean
  role: DashRole | null
  name?: string
  /** Dashboards show a bottom dock on small screens, so the button rides above it. */
  aboveDock?: boolean
  /** Adds a search button to the launcher. Only dashboards have a search palette. */
  onOpenSearch?: () => void
}

/**
 * Owns the conversation, the support thread and the panel state, so a chat
 * survives opening, closing and moving between pages that share a layout.
 */
export function PeonProvider({ children, signedIn, role, name, aboveDock, onOpenSearch }: PeonProviderProps) {
  const page = usePathname() ?? ''
  const [open, setOpen] = React.useState(false)
  const [tab, setTab] = React.useState<PeonTab>('ask')
  const [seed, setSeed] = React.useState('')

  const canSupport = signedIn && role !== 'admin'
  const chat = usePeonChat(page)
  const support = useSupportThread({ enabled: canSupport, active: open && tab === 'support' })

  const close = React.useCallback(() => setOpen(false), [])
  const api = React.useMemo<PeonApi>(
    () => ({
      open: (options) => {
        setTab(options?.tab && canSupport ? options.tab : 'ask')
        if (options?.prompt) setSeed(options.prompt)
        setOpen(true)
      },
      close,
      isOpen: open,
    }),
    [canSupport, close, open],
  )

  const last = chat.messages[chat.messages.length - 1]
  const orbState: AIState = chat.busy ? (last?.text ? 'streaming' : 'thinking') : 'idle'

  const actions: LauncherAction[] = []
  if (canSupport) {
    actions.push({ key: 'support', label: 'Talk to support', icon: Headphones, x: -70, y: 0, onClick: () => api.open({ tab: 'support' }) })
  }
  if (onOpenSearch) {
    actions.push({ key: 'search', label: 'Search', icon: Search, x: 0, y: -70, onClick: onOpenSearch })
  }

  return (
    <PeonContext.Provider value={api}>
      {children}
      <PeonLauncher open={open} onToggle={() => (open ? close() : api.open())} orbState={orbState} unread={support.unread} actions={actions} aboveDock={aboveDock} />
      <PeonPanel
        open={open}
        onClose={close}
        tab={tab}
        onTabChange={setTab}
        chat={chat}
        support={support}
        signedIn={signedIn}
        role={role}
        name={name}
        seed={seed}
        onSeedUsed={() => setSeed('')}
      />
    </PeonContext.Provider>
  )
}

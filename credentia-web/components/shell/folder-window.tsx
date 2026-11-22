'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Database,
  File as FileIcon,
  FileText,
  Folder,
  Image as ImageIcon,
  LayoutGrid,
  Link2,
  List,
  Minus,
  Search,
  Square,
  User,
  X,
  XCircle,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CopyButton } from '@/components/ui/copy-button'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

export type FolderEntryKind = 'pdf' | 'doc' | 'image' | 'data' | 'link' | 'person' | 'folder' | 'other'
export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

export interface FolderEntry {
  id: string
  name: string
  kind?: FolderEntryKind
  /** Second line: size, document type, score. */
  meta?: string
  /** Display date, already formatted. */
  date?: string
  /** Sortable timestamp for the date sort. */
  timestamp?: number
  status?: { label: string; tone: StatusTone }
  /** Internal path or external URL opened with Enter or a double click. */
  href?: string
  onOpen?: () => void
  /** Text for the copy button in the details pane (link, certificate number, email). */
  copyValue?: string
  copyLabel?: string
  /** Extra rows in the details pane. */
  details?: { label: string; value: string }[]
}

export interface FolderWindowProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  entries: FolderEntry[]
  loading?: boolean
  /** On screen rectangle of the folder that opened the window, so the window grows out of it. */
  originRect?: DOMRect | null
  emptyTitle?: string
  emptyHint?: string
  /** Extra buttons for the toolbar, for example an upload action. */
  actions?: React.ReactNode
}

const KIND_ICON: Record<FolderEntryKind, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  doc: FileText,
  image: ImageIcon,
  data: Database,
  link: Link2,
  person: User,
  folder: Folder,
  other: FileIcon,
}

const TONE: Record<StatusTone, { text: string; dot: string; Icon: React.ComponentType<{ className?: string }> }> = {
  success: { text: 'text-success', dot: 'bg-success', Icon: CheckCircle2 },
  warning: { text: 'text-warning', dot: 'bg-warning', Icon: Clock3 },
  danger: { text: 'text-danger', dot: 'bg-danger', Icon: XCircle },
  neutral: { text: 'text-muted-foreground', dot: 'bg-muted-foreground', Icon: TriangleAlert },
}

function StatusChip({ status }: { status: NonNullable<FolderEntry['status']> }) {
  const tone = TONE[status.tone]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', tone.text)}>
      <tone.Icon className="size-3.5" />
      {status.label}
    </span>
  )
}

type View = 'grid' | 'list'
type Sort = 'name' | 'date' | 'status'

const VIEW_KEY = 'credentia:folder-view'

/**
 * A file window in the style of Finder or Explorer. It opens from a GlassFolder,
 * lists every file in the folder as a grid or a list, filters and sorts them, and
 * shows the selected file's details with copy and open actions.
 *
 * Mac style puts the traffic lights on the left. On Windows the window controls
 * move to the right. Keyboard: arrows move the selection, Enter opens, Escape closes.
 */
export function FolderWindow({
  open,
  onClose,
  title,
  subtitle,
  entries,
  loading,
  originRect,
  emptyTitle = 'This folder is empty',
  emptyHint = 'Files added here will show up in this window.',
  actions,
}: FolderWindowProps) {
  const router = useRouter()
  const reduced = useReducedMotion()
  const [mounted, setMounted] = React.useState(false)
  const [view, setView] = React.useState<View>('grid')
  const [sort, setSort] = React.useState<Sort>('name')
  const [query, setQuery] = React.useState('')
  const [group, setGroup] = React.useState<string>('all')
  const [selected, setSelected] = React.useState<string | null>(null)
  const [maximised, setMaximised] = React.useState(false)
  const windowRef = React.useRef<HTMLDivElement>(null)
  const returnFocus = React.useRef<HTMLElement | null>(null)
  const isWindows = React.useMemo(
    () => typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent),
    [],
  )

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY)
      if (saved === 'grid' || saved === 'list') setView(saved)
    } catch {}
  }, [])

  const changeView = (next: View) => {
    setView(next)
    try {
      window.localStorage.setItem(VIEW_KEY, next)
    } catch {}
  }

  // Reset transient state and manage focus each time the window opens.
  React.useEffect(() => {
    if (!open) return
    returnFocus.current = document.activeElement as HTMLElement | null
    setQuery('')
    setGroup('all')
    setSelected(null)
    setMaximised(false)
    const frame = requestAnimationFrame(() => windowRef.current?.focus())
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      returnFocus.current?.focus?.()
    }
  }, [open])

  const groups = React.useMemo(() => {
    const map = new Map<string, { label: string; count: number; tone: StatusTone }>()
    for (const e of entries) {
      if (!e.status) continue
      const current = map.get(e.status.label)
      if (current) current.count += 1
      else map.set(e.status.label, { label: e.status.label, count: 1, tone: e.status.tone })
    }
    return Array.from(map.values())
  }, [entries])

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = entries.filter((e) => {
      if (group !== 'all' && e.status?.label !== group) return false
      if (!q) return true
      return `${e.name} ${e.meta ?? ''} ${e.status?.label ?? ''}`.toLowerCase().includes(q)
    })
    return [...list].sort((a, b) => {
      if (sort === 'date') return (b.timestamp ?? 0) - (a.timestamp ?? 0)
      if (sort === 'status') return (a.status?.label ?? '').localeCompare(b.status?.label ?? '')
      return a.name.localeCompare(b.name)
    })
  }, [entries, group, query, sort])

  const current = visible.find((e) => e.id === selected) ?? null

  const openEntry = (entry: FolderEntry) => {
    if (entry.onOpen) {
      entry.onOpen()
      return
    }
    if (!entry.href) return
    if (/^https?:/.test(entry.href)) window.open(entry.href, '_blank', 'noopener,noreferrer')
    else {
      onClose()
      router.push(entry.href)
    }
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') return
    if (!visible.length) return
    const index = visible.findIndex((e) => e.id === selected)
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
      event.preventDefault()
      const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
      const next = index === -1 ? 0 : (index + step + visible.length) % visible.length
      setSelected(visible[next].id)
    } else if (event.key === 'Enter' && current) {
      event.preventDefault()
      openEntry(current)
    } else if (event.key === 'Tab') {
      // Keep focus inside the window while it is open.
      const focusables = windowRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  // The window grows out of the folder that was pressed.
  const origin = React.useMemo(() => {
    if (!originRect || typeof window === 'undefined') return { x: 0, y: 12, s: 0.94 }
    const cx = originRect.left + originRect.width / 2
    const cy = originRect.top + originRect.height / 2
    return { x: (cx - window.innerWidth / 2) * 0.6, y: (cy - window.innerHeight / 2) * 0.6, s: 0.55 }
  }, [originRect])

  const controls = (
    <div className={cn('flex items-center gap-2', isWindows && 'order-last ml-auto')}>
      {isWindows ? (
        <>
          <SmoothButton aria-label="Minimise" variant="ghost" size="icon-sm" onClick={() => setMaximised(false)}>
            <Minus />
          </SmoothButton>
          <SmoothButton aria-label="Maximise" variant="ghost" size="icon-sm" onClick={() => setMaximised((m) => !m)}>
            <Square className="!size-3" />
          </SmoothButton>
          <SmoothButton aria-label="Close" variant="ghost" color="destructive" size="icon-sm" onClick={onClose}>
            <X />
          </SmoothButton>
        </>
      ) : (
        <>
          <button type="button" aria-label="Close" onClick={onClose} className="group grid size-3.5 place-items-center rounded-full bg-[#ff5f57] outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-2.5 text-black/60 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={3} />
          </button>
          <button type="button" aria-label="Minimise" onClick={() => setMaximised(false)} className="group grid size-3.5 place-items-center rounded-full bg-[#febc2e] outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Minus className="size-2.5 text-black/60 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={3} />
          </button>
          <button type="button" aria-label="Maximise" onClick={() => setMaximised((m) => !m)} className="group grid size-3.5 place-items-center rounded-full bg-[#28c840] outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowUpRight className="size-2.5 text-black/60 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={3} />
          </button>
        </>
      )}
    </div>
  )

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[120] grid place-items-center p-0 sm:p-4" onKeyDown={onKeyDown}>
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            ref={windowRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: origin.s, x: origin.x, y: origin.y }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className={cn(
              'glass-strong relative flex flex-col overflow-hidden outline-none',
              'h-dvh w-screen rounded-none sm:h-[min(680px,calc(100dvh-2rem))] sm:w-[min(1040px,100%)] sm:rounded-3xl',
              maximised && 'sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)]',
              isWindows && 'sm:rounded-xl',
            )}
            style={{ background: 'rgba(14,14,15,0.86)' }}
          >
            {/* Title bar */}
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              {controls}
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-bold text-foreground">{title}</h2>
                {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
              </div>
              <div className="hidden items-center gap-2 sm:flex">{actions}</div>
            </header>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2.5">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 focus-within:border-white/25 sm:max-w-sm">
                <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search in ${title}`}
                  aria-label={`Search in ${title}`}
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </label>
              <label className="sr-only" htmlFor="folder-sort">Sort by</label>
              <select
                id="folder-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-foreground outline-none focus:border-white/25"
              >
                <option value="name">Name</option>
                <option value="date">Date</option>
                <option value="status">Status</option>
              </select>
              <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.04] p-0.5" role="group" aria-label="View">
                <SmoothButton
                  size="icon-sm"
                  variant={view === 'grid' ? 'soft' : 'ghost'}
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  onClick={() => changeView('grid')}
                >
                  <LayoutGrid />
                </SmoothButton>
                <SmoothButton
                  size="icon-sm"
                  variant={view === 'list' ? 'soft' : 'ghost'}
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                  onClick={() => changeView('list')}
                >
                  <List />
                </SmoothButton>
              </div>
              <div className="flex items-center gap-2 sm:hidden">{actions}</div>
            </div>

            <div className="flex min-h-0 flex-1">
              {/* Sidebar */}
              <nav aria-label="Filter by status" className="hidden w-48 shrink-0 flex-col gap-1 border-r border-white/10 p-3 md:flex">
                <p className="eyebrow px-2 pb-1">Show</p>
                <button
                  type="button"
                  onClick={() => setGroup('all')}
                  className={cn('flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm state-transition', group === 'all' ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground')}
                >
                  <span>All items</span>
                  <span className="tabular text-xs">{entries.length}</span>
                </button>
                {groups.map((g) => (
                  <button
                    key={g.label}
                    type="button"
                    onClick={() => setGroup(g.label)}
                    className={cn('flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm state-transition', group === g.label ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground')}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={cn('size-2 shrink-0 rounded-full', TONE[g.tone].dot)} aria-hidden="true" />
                      <span className="truncate">{g.label}</span>
                    </span>
                    <span className="tabular text-xs">{g.count}</span>
                  </button>
                ))}
              </nav>

              {/* Files */}
              <div className="min-w-0 flex-1 overflow-y-auto p-4 scrollbar-thin" data-lenis-prevent onClick={() => setSelected(null)}>
                {loading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="skeleton h-28" />
                    ))}
                  </div>
                ) : visible.length === 0 ? (
                  <div className="grid h-full min-h-48 place-items-center text-center">
                    <div className="max-w-xs">
                      <Folder className="mx-auto mb-3 size-10 text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm font-semibold text-foreground">{entries.length === 0 ? emptyTitle : 'No matching files'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{entries.length === 0 ? emptyHint : 'Try a different search or filter.'}</p>
                    </div>
                  </div>
                ) : view === 'grid' ? (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" role="listbox" aria-label={`${title} files`}>
                    {visible.map((entry) => {
                      const Icon = KIND_ICON[entry.kind ?? 'other']
                      const isSelected = entry.id === selected
                      return (
                        <li key={entry.id} role="option" aria-selected={isSelected}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelected(entry.id)
                            }}
                            onDoubleClick={() => openEntry(entry)}
                            className={cn(
                              'flex w-full flex-col items-center gap-2 rounded-2xl border p-3 text-center state-transition',
                              isSelected ? 'border-brand/70 bg-brand/10' : 'border-transparent hover:bg-white/5',
                            )}
                          >
                            <span className="relative grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.05]">
                              <Icon className={cn('size-6', isSelected ? 'text-brand-ink' : 'text-foreground/80')} />
                              {entry.status ? <span className={cn('absolute -right-1 -top-1 size-3 rounded-full ring-2 ring-[#0e0e0f]', TONE[entry.status.tone].dot)} aria-hidden="true" /> : null}
                            </span>
                            <span className="line-clamp-2 break-words text-xs font-semibold text-foreground">{entry.name}</span>
                            {entry.meta ? <span className="line-clamp-1 text-[11px] text-muted-foreground">{entry.meta}</span> : null}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <ul className="flex flex-col" role="listbox" aria-label={`${title} files`}>
                    <li className="hidden grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] gap-3 px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:grid" aria-hidden="true">
                      <span>Name</span>
                      <span>Status</span>
                      <span>Date</span>
                      <span>Details</span>
                    </li>
                    {visible.map((entry) => {
                      const Icon = KIND_ICON[entry.kind ?? 'other']
                      const isSelected = entry.id === selected
                      return (
                        <li key={entry.id} role="option" aria-selected={isSelected}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelected(entry.id)
                            }}
                            onDoubleClick={() => openEntry(entry)}
                            className={cn(
                              'grid w-full grid-cols-[minmax(0,1fr)] items-center gap-3 rounded-xl border px-3 py-2.5 text-left state-transition sm:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr]',
                              isSelected ? 'border-brand/70 bg-brand/10' : 'border-transparent hover:bg-white/5',
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <Icon className={cn('size-5 shrink-0', isSelected ? 'text-brand-ink' : 'text-foreground/80')} />
                              <span className="truncate text-sm font-semibold text-foreground">{entry.name}</span>
                            </span>
                            <span className="hidden sm:block">{entry.status ? <StatusChip status={entry.status} /> : <span className="text-xs text-muted-foreground">None</span>}</span>
                            <span className="tabular hidden text-xs text-muted-foreground sm:block">{entry.date ?? ''}</span>
                            <span className="hidden truncate text-xs text-muted-foreground sm:block">{entry.meta ?? ''}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* Details */}
              <aside aria-label="Details" className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto border-l border-white/10 p-4 scrollbar-thin lg:flex" data-lenis-prevent>
                {current ? (
                  <>
                    <div className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.05]">
                      {React.createElement(KIND_ICON[current.kind ?? 'other'], { className: 'size-7 text-brand-ink' })}
                    </div>
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-bold text-foreground">{current.name}</h3>
                      {current.meta ? <p className="mt-0.5 text-xs text-muted-foreground">{current.meta}</p> : null}
                    </div>
                    {current.status ? <StatusChip status={current.status} /> : null}
                    <dl className="space-y-2.5 text-xs">
                      {current.date ? (
                        <div>
                          <dt className="text-muted-foreground">Date</dt>
                          <dd className="tabular font-medium text-foreground">{current.date}</dd>
                        </div>
                      ) : null}
                      {current.details?.map((d) => (
                        <div key={d.label}>
                          <dt className="text-muted-foreground">{d.label}</dt>
                          <dd className="break-words font-medium text-foreground">{d.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="mt-auto flex items-center gap-2">
                      {current.href || current.onOpen ? (
                        <SmoothButton color="accent" variant="solid" size="sm" className="flex-1" onClick={() => openEntry(current)}>
                          Open
                          <ArrowUpRight />
                        </SmoothButton>
                      ) : null}
                      {current.copyValue ? <CopyButton value={current.copyValue} /> : null}
                    </div>
                  </>
                ) : (
                  <p className="my-auto text-center text-xs text-muted-foreground">Select a file to see its details.</p>
                )}
              </aside>
            </div>

            {/* Status bar */}
            <footer className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs text-muted-foreground">
              <span className="tabular">
                {visible.length} of {entries.length} {entries.length === 1 ? 'item' : 'items'}
              </span>
              <span className="hidden sm:inline">Enter to open, arrow keys to move, Esc to close</span>
            </footer>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export default FolderWindow

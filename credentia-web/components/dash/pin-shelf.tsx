'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import PinnedList, { type PinnedListItem } from '@/components/smoothui/components/pinned-list'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { Panel } from '@/components/dash/kit'

/**
 * Pinned ids for one list, kept in local storage so they survive a reload and
 * stay in step across tabs. The key should include the user id.
 */
export function usePins(storageKey: string) {
  const [ids, setIds] = React.useState<string[]>([])

  React.useEffect(() => {
    const read = () => {
      try {
        const raw = window.localStorage.getItem(storageKey)
        const parsed = raw ? JSON.parse(raw) : []
        setIds(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [])
      } catch {
        setIds([])
      }
    }
    read()
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) read()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [storageKey])

  const update = React.useCallback(
    (next: string[]) => {
      setIds(next)
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {
        // Storage can be blocked. The pins still work for this visit.
      }
    },
    [storageKey],
  )

  return [ids, update] as const
}

export interface PinItem extends PinnedListItem {
  /** Where the item lives. Pinned items with a destination get an Open shortcut. */
  href?: string
}

/**
 * A list where rows can be pinned to the top. Click a row, or focus it and press
 * P, to pin or unpin it. Pinned items with a destination are also listed as quick
 * links under the list.
 */
export function PinShelf({
  storageKey,
  items,
  max = 4,
  title,
  subtitle,
  label,
  emptyPinnedMessage = 'Nothing pinned yet. Pin a row to keep it up here.',
  index = 0,
  className,
}: {
  storageKey: string
  items: PinItem[]
  max?: number
  title: string
  subtitle?: string
  label: string
  emptyPinnedMessage?: string
  index?: number
  className?: string
}) {
  const [stored, setStored] = usePins(storageKey)
  // Items can disappear, so drop pinned ids that no longer exist.
  const pinned = React.useMemo(() => stored.filter((id) => items.some((item) => item.id === id)), [stored, items])
  const links = pinned.map((id) => items.find((item) => item.id === id)).filter((item): item is PinItem => Boolean(item?.href))

  return (
    <Panel
      title={title}
      subtitle={subtitle}
      index={index}
      className={className}
      action={
        <div className="flex items-center gap-2">
          <span className="tabular text-xs text-muted-foreground">
            {pinned.length} / {max} pinned
          </span>
          <SmoothButton size="xs" variant="ghost" disabled={pinned.length === 0} onClick={() => setStored([])}>
            Unpin all
          </SmoothButton>
        </div>
      }
    >
      <div className="max-h-[22rem] overflow-y-auto pr-1 scrollbar-thin">
        <PinnedList
          items={items}
          label={label}
          maxPinned={max}
          pinnedIds={pinned}
          onPinnedChange={setStored}
          emptyPinnedMessage={emptyPinnedMessage}
          showDivider
        />
      </div>
      {links.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
          <span className="text-[11px] font-bold text-muted-foreground">Open</span>
          {links.map((item) => (
            <Link
              key={item.id}
              href={item.href as string}
              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-xs font-semibold text-foreground transition-colors hover:border-brand/50 hover:bg-brand/10"
            >
              {item.title}
              <ArrowUpRight className="size-3 text-brand-ink" aria-hidden="true" />
            </Link>
          ))}
        </div>
      ) : null}
    </Panel>
  )
}

export default PinShelf

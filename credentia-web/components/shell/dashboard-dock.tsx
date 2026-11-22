'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { Home, LogOut, MoreHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavItem } from '@/lib/dashboard-nav'

export interface DockBadges {
  support?: number
}

interface DockProps {
  items: NavItem[]
  activeHref: string
  badges?: DockBadges
}

/** Positions a sliding pill under the active link. Re-measures when the links resize. */
function useIndicator(containerRef: React.RefObject<HTMLElement>, indicatorRef: React.RefObject<HTMLSpanElement>, activeHref: string) {
  React.useLayoutEffect(() => {
    const container = containerRef.current
    const indicator = indicatorRef.current
    if (!container || !indicator) return
    const place = () => {
      const current = container.querySelector<HTMLElement>('[aria-current="page"]')
      if (!current) {
        indicator.style.opacity = '0'
        return
      }
      indicator.style.width = `${current.offsetWidth}px`
      indicator.style.height = `${current.offsetHeight}px`
      indicator.style.transform = `translate(${current.offsetLeft}px, ${current.offsetTop}px)`
      indicator.style.opacity = '1'
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(container)
    container.querySelectorAll('a').forEach((a) => observer.observe(a))
    return () => observer.disconnect()
  }, [containerRef, indicatorRef, activeHref])
}

const Indicator = React.forwardRef<HTMLSpanElement>(function Indicator(_, ref) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 rounded-xl bg-brand opacity-0 transition-[transform,width,height,opacity] duration-300 ease-out-smooth motion-reduce:transition-none"
    />
  )
})

function CountDot({ count }: { count?: number }) {
  if (!count) return null
  return (
    <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-md bg-brand px-1 text-[9px] font-extrabold leading-4 text-on-brand ring-2 ring-black">
      {count > 9 ? '9+' : count}
    </span>
  )
}

/** Vertical dock on the left edge of the stage. Hidden on small screens and on short windows. */
export function SideDock({ items, activeHref, badges }: DockProps) {
  const ref = React.useRef<HTMLElement>(null)
  const indicator = React.useRef<HTMLSpanElement>(null)
  useIndicator(ref, indicator, activeHref)

  return (
    <nav
      ref={ref}
      aria-label="Dashboard pages"
      className="glass-strong absolute -left-4 top-6 z-20 hidden w-[52px] flex-col gap-0.5 rounded-2xl p-1 lg:flex lg:[@media(max-height:660px)]:hidden"
    >
      <Indicator ref={indicator} />
      {items.map((item) => {
        const active = item.href === activeHref
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative z-10 grid size-11 place-items-center rounded-full transition-colors [@media(max-height:820px)]:size-10',
              active ? 'text-on-brand' : 'text-foreground/70 hover:bg-white/10 hover:text-foreground',
            )}
          >
            <item.icon className="size-[18px]" aria-hidden="true" />
            <CountDot count={item.badge ? badges?.[item.badge] : undefined} />
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg border border-white/15 bg-black/85 px-2.5 py-1.5 text-xs font-semibold text-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

interface BottomDockProps extends DockProps {
  onSignOut: () => void
}

/** Bottom dock for phones, tablets and short windows. Four pages and a More sheet with the rest. */
export function BottomDock({ items, activeHref, badges, onSignOut }: BottomDockProps) {
  const ref = React.useRef<HTMLElement>(null)
  const indicator = React.useRef<HTMLSpanElement>(null)
  const [sheet, setSheet] = React.useState(false)
  const activeIndex = items.findIndex((i) => i.href === activeHref)
  // The active page always shows in the dock, even when it normally lives in More.
  const primary = React.useMemo(() => {
    const first = items.slice(0, 4)
    if (activeIndex >= 4) return [...first.slice(0, 3), items[activeIndex]]
    return first
  }, [items, activeIndex])
  useIndicator(ref, indicator, activeHref)

  React.useEffect(() => {
    if (!sheet) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheet])

  React.useEffect(() => setSheet(false), [activeHref])

  const hasMore = items.length > 4

  return (
    <>
      <nav
        ref={ref}
        aria-label="Dashboard pages"
        className="glass-strong fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-stretch justify-between rounded-2xl p-1 lg:[@media(min-height:661px)]:hidden"
      >
        <Indicator ref={indicator} />
        {primary.map((item) => {
          const active = item.href === activeHref
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative z-10 flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-bold leading-none transition-colors',
                active ? 'text-on-brand' : 'text-foreground/70',
              )}
            >
              <item.icon className="size-[18px]" aria-hidden="true" />
              <span>{item.short}</span>
              <CountDot count={item.badge ? badges?.[item.badge] : undefined} />
            </Link>
          )
        })}
        {hasMore ? (
          <button
            type="button"
            onClick={() => setSheet(true)}
            aria-haspopup="dialog"
            aria-expanded={sheet}
            className="relative z-10 flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-bold leading-none text-foreground/70"
          >
            <MoreHorizontal className="size-[18px]" aria-hidden="true" />
            <span>More</span>
          </button>
        ) : null}
      </nav>

      <AnimatePresence>
        {sheet ? (
          <div className="fixed inset-0 z-[90]">
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="All pages"
              className="overlay-surface absolute inset-x-0 bottom-0 rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-extrabold">All pages</h2>
                <button type="button" aria-label="Close" onClick={() => setSheet(false)} className="grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-white/10">
                  <X className="size-5" />
                </button>
              </div>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {items.map((item) => {
                  const active = item.href === activeHref
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-center text-[11px] font-bold transition-colors',
                          active ? 'border-brand/60 bg-brand/15 text-foreground' : 'border-white/10 bg-white/[0.04] text-foreground/80 hover:bg-white/10',
                        )}
                      >
                        <item.icon className="size-5 text-brand-ink" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-bold hover:bg-white/10">
                  <Home className="size-4" aria-hidden="true" />
                  Back to site
                </Link>
                <button type="button" onClick={onSignOut} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-destructive/40 text-xs font-bold text-destructive hover:bg-destructive/10">
                  <LogOut className="size-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

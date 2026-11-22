'use client'

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { ArrowUpRight, X } from 'lucide-react'
import { useOutsideClick } from '@/hooks/use-outside-click'
import { setScrollLocked } from '@/components/shell/smooth-scroll'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface BentoItem {
  id: string | number
  title: string
  subtitle?: string
  description?: string
  /** Body of the expanded card. */
  content: React.ReactNode
  icon?: React.ReactNode
  /** Destination of the call to action in the expanded card. */
  href?: string
  ctaLabel?: string
  /** Grid placement of the compact card, for example `md:col-span-2 lg:col-span-6`. */
  className?: string
  /** Extra detail shown only on the compact card, such as chips. Keep it to inline elements. */
  preview?: React.ReactNode
}

export interface BentoGridProps {
  items: BentoItem[]
  /** A slim bar above the grid. */
  caption?: React.ReactNode
  /** Classes for the band that holds the grid. */
  className?: string
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A full width board of cards separated by hairlines. It runs edge to edge, so
 * place it outside any max width container. Pressing a card lifts it into a
 * centred detail card with a shared element transition: the icon, title and
 * description travel between the two states instead of cross fading.
 *
 * Escape, the close button or a press outside dismiss it. Page scrolling is
 * frozen while a card is open, focus stays inside it, and focus returns to the
 * card that opened it.
 *
 * The overlay is a sibling of the band, never a child, because a blurred
 * ancestor would turn `position: fixed` into position relative to that ancestor.
 */
export default function ExpandableBentoGrid({ items, caption, className }: BentoGridProps) {
  const [active, setActive] = useState<BentoItem | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)
  const id = useId()

  const close = useCallback(() => setActive(null), [])

  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(null)
    }
    setScrollLocked(true)
    window.addEventListener('keydown', onKeyDown)
    ref.current?.focus({ preventScroll: true })
    return () => {
      setScrollLocked(false)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [active])

  // Hand focus back to the card that opened the detail view.
  useEffect(() => {
    if (!active) lastFocus.current?.focus?.({ preventScroll: true })
  }, [active])

  useOutsideClick(ref, close)

  const open = (item: BentoItem, event: React.MouseEvent<HTMLElement>) => {
    lastFocus.current = event.currentTarget
    setActive(item)
  }

  // Keep Tab inside the dialog while it is open.
  const trapTab = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const nodes = ref.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
    if (!nodes || nodes.length === 0) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    const current = document.activeElement
    if (event.shiftKey && (current === first || current === ref.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && current === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {active ? (
          <motion.div
            key="bento-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-sm"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {active ? (
          <div key="bento-dialog" className="fixed inset-0 z-[111] grid place-items-center p-3 sm:p-6">
            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              role="dialog"
              aria-modal="true"
              aria-label={active.title}
              tabIndex={-1}
              onKeyDown={trapTab}
              data-lenis-prevent
              className="glass-strong relative flex max-h-[90dvh] w-full max-w-[600px] flex-col overflow-hidden outline-none"
              style={{ borderRadius: 28, background: 'rgba(14,14,15,0.94)' }}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={close}
                className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full border border-white/15 bg-black/50 text-foreground state-transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring/80"
              >
                <X className="size-4" />
              </button>

              <motion.div layoutId={`image-${active.id}-${id}`}>
                <div className="grid h-36 place-items-center bg-brand/10 text-brand-ink sm:h-44">
                  <div className="scale-[2]">{active.icon}</div>
                </div>
              </motion.div>

              <div className="flex flex-col gap-4 overflow-y-auto p-5 scrollbar-thin sm:p-7" data-lenis-prevent>
                <div className="min-w-0">
                  <motion.h3 layout="position" layoutId={`title-${active.id}-${id}`} className="text-xl font-bold tracking-tight text-foreground">
                    {active.title}
                  </motion.h3>
                  {active.description ? (
                    <motion.p layout="position" layoutId={`description-${active.id}-${id}`} className="mt-1 text-sm font-semibold text-brand-ink">
                      {active.description}
                    </motion.p>
                  ) : null}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/80"
                >
                  {active.content}
                </motion.div>

                {active.href ? (
                  <div className="pt-1">
                    <Button href={active.href} variant="primary" size="sm">
                      {active.ctaLabel ?? 'Learn more'}
                      <ArrowUpRight className="size-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <div className={cn('w-full border-y border-white/10 bg-black/55', className)}>
        {caption ? (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-white/10 px-5 py-3 text-xs font-semibold text-muted-foreground sm:px-8">
            {caption}
          </div>
        ) : null}

        <ul className="grid w-full grid-cols-1 gap-px bg-white/10 lg:grid-cols-12">
          {items.map((item, index) => (
            <li key={item.id} data-swipe style={{ '--i': index } as React.CSSProperties} className={cn('flex min-w-0 lg:col-span-3', item.className)}>
              <motion.button
                type="button"
                layoutId={`card-${item.id}-${id}`}
                onClick={(event) => open(item, event)}
                aria-haspopup="dialog"
                style={{ borderRadius: 0 }}
                className="group relative flex w-full items-center gap-4 bg-black/45 p-5 text-left outline-none state-transition hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/80 sm:p-6 lg:min-h-[320px] lg:flex-col lg:items-stretch lg:justify-between lg:gap-8 lg:p-8"
              >
                <ArrowUpRight
                  aria-hidden="true"
                  className="absolute right-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-brand-ink lg:right-8 lg:top-8 lg:translate-y-0 lg:group-hover:-translate-y-0.5"
                />
                <motion.span layoutId={`image-${item.id}-${id}`} className="block shrink-0">
                  <span className="grid size-12 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-foreground">{item.icon}</span>
                </motion.span>
                <span className="block min-w-0 flex-1 pr-7 lg:flex-none lg:pr-0">
                  {item.description ? (
                    <motion.span layout="position" layoutId={`description-${item.id}-${id}`} className="block text-xs font-semibold text-brand-ink">
                      {item.description}
                    </motion.span>
                  ) : null}
                  <motion.span layout="position" layoutId={`title-${item.id}-${id}`} className="mt-1 block text-lg font-bold tracking-tight text-foreground lg:text-xl">
                    {item.title}
                  </motion.span>
                  {item.subtitle ? <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{item.subtitle}</span> : null}
                  {item.preview}
                </span>
              </motion.button>
            </li>
          ))}
        </ul>
      </div>
    </MotionConfig>
  )
}

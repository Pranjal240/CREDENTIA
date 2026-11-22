'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { setScrollLocked } from '@/components/shell/smooth-scroll'
import { cn } from '@/lib/utils'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * A centred dialog for details and short forms. It locks the page behind it,
 * keeps focus inside, closes with Escape or a press on the backdrop, and hands
 * focus back to whatever opened it. On a phone it becomes a sheet.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const opener = React.useRef<HTMLElement | null>(null)
  const titleId = React.useId()
  const [mounted, setMounted] = React.useState(false)

  // Callers usually pass an inline onClose. Keeping it in a ref means the effect below
  // runs only when the dialog opens or closes, so typing in a field never moves focus.
  const closeRef = React.useRef(onClose)
  React.useEffect(() => {
    closeRef.current = onClose
  })

  React.useEffect(() => setMounted(true), [])

  React.useEffect(() => {
    if (!open) return
    opener.current = document.activeElement as HTMLElement | null
    setScrollLocked(true)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    const timer = window.setTimeout(() => ref.current?.focus({ preventScroll: true }), 30)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      setScrollLocked(false)
      opener.current?.focus?.({ preventScroll: true })
    }
  }, [open])

  const trap = (event: React.KeyboardEvent<HTMLDivElement>) => {
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

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[120] grid place-items-end sm:place-items-center">
          <motion.div
            key="dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />
          <motion.div
            key="dialog-panel"
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={trap}
            data-lenis-prevent
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98, transition: { duration: 0.14 } }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            style={{ background: 'rgba(14,14,15,0.94)' }}
            className={cn(
              'glass-strong relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] outline-none sm:max-h-[88dvh] sm:rounded-[28px]',
              size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl',
            )}
          >
            <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-extrabold tracking-tight">
                  {title}
                </h2>
                {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
              </div>
              <SmoothButton size="icon-sm" variant="ghost" shape="pill" aria-label="Close" onClick={onClose}>
                <X aria-hidden="true" />
              </SmoothButton>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 scrollbar-thin">{children}</div>
            {footer ? <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-5 py-3">{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}

export default Dialog

'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, type LucideIcon } from 'lucide-react'
import GooeyFilter from '@/components/smoothui/components/gooey-filter'
import SiriOrb from '@/components/smoothui/components/siri-orb'
import type { AIState } from '@/components/smoothui/components/ai-core'
import { cn } from '@/lib/utils'

export interface LauncherAction {
  key: string
  label: string
  icon: LucideIcon
  /** Offset from the main button, in pixels. Negative x is left, negative y is up. */
  x: number
  y: number
  onClick: () => void
}

interface LauncherProps {
  open: boolean
  onToggle: () => void
  orbState: AIState
  /** Unread replies from the support team. */
  unread: number
  actions: LauncherAction[]
  /** Sit above the bottom dock that dashboards show on small screens. */
  aboveDock?: boolean
}

const SPRING = { type: 'spring', stiffness: 380, damping: 24 } as const

/**
 * The floating button for Peon. Behind the orb sits a liquid layer: on hover or
 * focus the quick action buttons pull out of the main blob like drops, and a
 * count badge grows out of it when the support team has replied. The liquid is
 * plain red shapes inside the gooey filter. The orb and the icons sit above it,
 * unfiltered, and move with exactly the same springs so the two layers agree.
 */
export function PeonLauncher({ open, onToggle, orbState, unread, actions, aboveDock }: LauncherProps) {
  const [hover, setHover] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const show = (hover || focused) && !open && actions.length > 0

  return (
    <div
      className={cn(
        'fixed right-[max(16px,env(safe-area-inset-right))] z-[60]',
        aboveDock ? 'bottom-[calc(92px+env(safe-area-inset-bottom))] lg:[@media(min-height:661px)]:bottom-6' : 'bottom-[max(16px,env(safe-area-inset-bottom))] sm:bottom-6',
      )}
      onPointerEnter={(event) => event.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
      }}
    >
      <div className="relative size-14">
        {/* Liquid layer */}
        <GooeyFilter className="pointer-events-none absolute bottom-0 right-0 h-[190px] w-[190px]" strength={7} contrast={20}>
          <span className="absolute bottom-0 right-0 size-14 rounded-full bg-brand" />
          <AnimatePresence>
            {show
              ? actions.map((action) => (
                  <motion.span
                    key={action.key}
                    className="absolute bottom-[8px] right-[8px] size-10 rounded-full bg-brand"
                    initial={{ x: 0, y: 0, scale: 0.5 }}
                    animate={{ x: action.x, y: action.y, scale: 1 }}
                    exit={{ x: 0, y: 0, scale: 0.5 }}
                    transition={SPRING}
                  />
                ))
              : null}
          </AnimatePresence>
          {unread > 0 && !open ? (
            <motion.span key={unread} className="absolute bottom-[36px] right-[-4px] size-6 rounded-full bg-brand" initial={{ scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 16 }} />
          ) : null}
        </GooeyFilter>

        {/* Controls layer */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? 'Close Peon' : unread > 0 ? `Open Peon, ${unread} new ${unread === 1 ? 'reply' : 'replies'} from support` : 'Open Peon, the Credentia assistant'}
          aria-expanded={open}
          className="absolute bottom-0 right-0 grid size-14 place-items-center rounded-full outline-none transition-transform duration-150 hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-ring/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-95"
        >
          {open ? (
            <span className="grid size-14 place-items-center rounded-full bg-brand text-on-brand">
              <X className="size-6" aria-hidden="true" />
            </span>
          ) : (
            <SiriOrb size="56px" state={orbState} className="pointer-events-none" />
          )}
        </button>

        <AnimatePresence>
          {show
            ? actions.map((action) => (
                <motion.button
                  key={action.key}
                  type="button"
                  aria-label={action.label}
                  title={action.label}
                  onClick={action.onClick}
                  className="absolute bottom-[8px] right-[8px] grid size-10 place-items-center rounded-full text-on-brand outline-none focus-visible:ring-2 focus-visible:ring-white"
                  initial={{ x: 0, y: 0, scale: 0.5, opacity: 0 }}
                  animate={{ x: action.x, y: action.y, scale: 1, opacity: 1 }}
                  exit={{ x: 0, y: 0, scale: 0.5, opacity: 0 }}
                  transition={SPRING}
                >
                  <action.icon className="size-[18px]" aria-hidden="true" />
                </motion.button>
              ))
            : null}
        </AnimatePresence>

        {unread > 0 && !open ? (
          <span aria-hidden="true" className="pointer-events-none absolute -top-[2px] -right-[4px] grid size-6 place-items-center text-[11px] font-extrabold leading-none text-on-brand">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </div>
    </div>
  )
}

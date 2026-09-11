'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

interface SpotlightBackgroundProps {
  /** Base radius in pixels while the cursor is idle. Defaults to 380. */
  restRadius?: number
  /** Radius the spotlight shrinks to while the cursor is moving. Defaults to 260. */
  activeRadius?: number
  /** Primary tint (hex or rgba). Defaults to a soft indigo. */
  tint?: string
  /** Secondary tint used for the outer glow. Defaults to a warm teal. */
  edgeTint?: string
  /** Optional class name for the wrapping div. */
  className?: string
}

/**
 * A cursor-reactive radial spotlight that blends over the current background.
 *
 * — Follows the pointer with a soft spring (feels alive, never twitchy)
 * — Breathes: the radius grows while idle, shrinks while moving
 * — Falls back to a static centred glow on touch devices / reduced motion
 * — Sits behind content (`z-0`) — put your content above with `relative z-10`
 */
export default function SpotlightBackground({
  restRadius = 380,
  activeRadius = 260,
  tint = 'rgba(129, 140, 248, 0.22)', // indigo-400
  edgeTint = 'rgba(45, 212, 191, 0.08)', // teal-400
  className = '',
}: SpotlightBackgroundProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [interactive, setInteractive] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const moveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Motion values — start centred so the fallback SSR frame looks sane
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const sx = useSpring(mx, { damping: 30, stiffness: 140, mass: 0.6 })
  const sy = useSpring(my, { damping: 30, stiffness: 140, mass: 0.6 })

  // Convert 0..1 → CSS percent for the background-position math
  const xPct = useTransform(sx, v => `${v * 100}%`)
  const yPct = useTransform(sy, v => `${v * 100}%`)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = window.matchMedia('(pointer: coarse)').matches
    setInteractive(!reduce && !touch)
  }, [])

  useEffect(() => {
    if (!interactive) return
    const el = wrapRef.current
    if (!el) return

    const handle = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      mx.set((e.clientX - rect.left) / rect.width)
      my.set((e.clientY - rect.top) / rect.height)
      setIsMoving(true)
      if (moveTimeout.current) clearTimeout(moveTimeout.current)
      moveTimeout.current = setTimeout(() => setIsMoving(false), 220)
    }

    window.addEventListener('pointermove', handle)
    return () => {
      window.removeEventListener('pointermove', handle)
      if (moveTimeout.current) clearTimeout(moveTimeout.current)
    }
  }, [interactive, mx, my])

  // Breathing radius — bigger idle, tighter while active
  const radius = isMoving ? activeRadius : restRadius

  return (
    <div ref={wrapRef} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden>
      {/* Primary spotlight — follows cursor */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: useTransform(
            [xPct, yPct] as any,
            ([x, y]: any) =>
              `radial-gradient(${radius}px circle at ${x} ${y}, ${tint}, transparent 65%)`
          ),
        }}
      />
      {/* Secondary trailing glow — larger, softer, teal accent */}
      <motion.div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background: useTransform(
            [xPct, yPct] as any,
            ([x, y]: any) =>
              `radial-gradient(${radius * 2.2}px circle at ${x} ${y}, ${edgeTint}, transparent 70%)`
          ),
        }}
      />
      {/* Fine grain noise (optional depth) via CSS gradient stripes */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(148,158,194) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
        }}
      />
    </div>
  )
}

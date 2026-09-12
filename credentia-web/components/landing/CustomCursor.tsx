'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

/**
 * CustomCursor — premium two-part cursor (dot + trailing ring) with
 * distinct visual states for buttons, links, inputs and text selection.
 *
 * — Sets `data-custom-cursor="on"` on <html> on mount so globals.css
 *   only hides the native cursor on pages where we render it.
 * — Ring lags the dot with a soft spring for a "physical" feel.
 * — Ring dilates + brightens on interactive hover.
 * — Contracts to a text-caret style over text inputs / textareas.
 * — Never renders on touch pointers or when reduced-motion is on.
 */
type CursorState = 'default' | 'button' | 'link' | 'text'

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [state, setState] = useState<CursorState>('default')
  const [pressed, setPressed] = useState(false)
  const lastMove = useRef<number>(0)

  const mx = useMotionValue(-100)
  const my = useMotionValue(-100)

  // Dot follows the pointer tightly (small mass, high stiffness)
  const dotX = useSpring(mx, { damping: 35, stiffness: 800, mass: 0.2 })
  const dotY = useSpring(my, { damping: 35, stiffness: 800, mass: 0.2 })

  // Ring trails a beat behind — the source of the "premium" feel
  const ringX = useSpring(mx, { damping: 28, stiffness: 220, mass: 0.55 })
  const ringY = useSpring(my, { damping: 28, stiffness: 220, mass: 0.55 })

  // Mount / unmount lifecycle
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = window.matchMedia('(pointer: coarse)').matches
    if (reduce || touch) return

    setEnabled(true)
    document.documentElement.setAttribute('data-custom-cursor', 'on')

    const move = (e: MouseEvent) => {
      mx.set(e.clientX)
      my.set(e.clientY)
      lastMove.current = performance.now()
      if (!visible) setVisible(true)
    }

    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t?.closest) return
      // Text inputs / editable content → caret mode
      if (t.closest('input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"]')) {
        setState('text')
        return
      }
      // Buttons → button mode
      if (t.closest('button, [role="button"], input[type="submit"], input[type="button"]')) {
        setState('button')
        return
      }
      // Links → link mode
      if (t.closest('a[href], [role="link"]')) {
        setState('link')
        return
      }
      setState('default')
    }

    const down = () => setPressed(true)
    const up = () => setPressed(false)
    const leaveWindow = () => setVisible(false)
    const enterWindow = () => setVisible(true)

    window.addEventListener('mousemove', move, { passive: true })
    window.addEventListener('mouseover', over, { passive: true })
    window.addEventListener('mousedown', down, { passive: true })
    window.addEventListener('mouseup', up, { passive: true })
    document.addEventListener('mouseleave', leaveWindow)
    document.addEventListener('mouseenter', enterWindow)

    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
      window.removeEventListener('mousedown', down)
      window.removeEventListener('mouseup', up)
      document.removeEventListener('mouseleave', leaveWindow)
      document.removeEventListener('mouseenter', enterWindow)
      document.documentElement.removeAttribute('data-custom-cursor')
    }
  }, [mx, my, visible])

  if (!enabled) return null

  // ── Per-state visuals ──────────────────────────────────────────────
  const isText = state === 'text'
  const isInteractive = state === 'button' || state === 'link'

  const ringSize = isText ? 4 : isInteractive ? 52 : 32
  const ringHeight = isText ? 22 : ringSize
  const ringRadius = isText ? 2 : 999
  const dotSize = isText ? 0 : pressed ? 4 : isInteractive ? 10 : 5

  const ringBorder = isInteractive
    ? '1.5px solid rgba(129,140,248,0.85)'
    : isText
      ? 'none'
      : '1.25px solid rgba(255,255,255,0.35)'
  const ringBg = isInteractive
    ? 'rgba(129,140,248,0.10)'
    : isText
      ? 'rgba(240,243,255,0.85)'
      : 'transparent'
  const ringShadow = isInteractive
    ? '0 0 24px rgba(129,140,248,0.4), 0 0 60px rgba(129,140,248,0.2)'
    : 'none'

  const dotBg = state === 'link' ? '#5eead4' : '#ffffff'

  return (
    <>
      {/* Ring — trails the pointer */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[9998]"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          width: ringSize,
          height: ringHeight,
          borderRadius: ringRadius,
          border: ringBorder,
          background: ringBg,
          boxShadow: ringShadow,
          opacity: visible ? 1 : 0,
          transition:
            'width 220ms cubic-bezier(0.22,1,0.36,1), height 220ms cubic-bezier(0.22,1,0.36,1), border-radius 220ms, background 220ms, border 220ms, box-shadow 220ms, opacity 200ms',
          mixBlendMode: isText ? 'difference' : 'normal',
        }}
      />
      {/* Dot — leading point */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full"
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
          width: dotSize,
          height: dotSize,
          background: dotBg,
          opacity: visible && !isText ? 1 : 0,
          boxShadow: isInteractive ? '0 0 12px rgba(129,140,248,0.8)' : '0 0 6px rgba(255,255,255,0.6)',
          transition:
            'width 180ms cubic-bezier(0.22,1,0.36,1), height 180ms cubic-bezier(0.22,1,0.36,1), background 180ms, box-shadow 180ms, opacity 180ms',
        }}
      />
    </>
  )
}

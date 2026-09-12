'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

/**
 * 3D perspective grid floor — recedes into the horizon.
 * Sits at the BOTTOM 42% of the hero so it never crosses the copy.
 * Slight cursor-parallax on rotateX for a "leaning-in" feel.
 */
export default function PerspectiveGrid() {
  const [interactive, setInteractive] = useState(false)

  const my = useMotionValue(0.5)
  const smoothY = useSpring(my, { damping: 30, stiffness: 90, mass: 0.7 })
  const rotateX = useTransform(smoothY, [0, 1], [58, 66])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = window.matchMedia('(pointer: coarse)').matches
    setInteractive(!reduce && !touch)
    if (reduce || touch) return

    const move = (e: PointerEvent) => {
      my.set(e.clientY / window.innerHeight)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [my])

  return (
    <div
      className="absolute inset-x-0 bottom-0 h-[42%] pointer-events-none overflow-hidden"
      style={{ perspective: 800 }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-x-[-25%] bottom-[-50%] h-[220%]"
        style={{
          rotateX: interactive ? rotateX : 62,
          transformOrigin: 'center bottom',
          background: `
            linear-gradient(to bottom, transparent 0%, rgba(8,10,25,0) 40%, rgba(8,10,25,0.85) 100%),
            linear-gradient(to right, rgba(129,140,248,0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(129,140,248,0.25) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 80px 80px, 80px 80px',
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 40%, black 75%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0%, black 40%, black 75%, transparent 100%)',
        }}
      />
      {/* Horizon glow — sits at the TOP of the grid area (well below copy) */}
      <div
        className="absolute inset-x-0 h-[2px] top-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(129,140,248,0.5), rgba(45,212,191,0.5), transparent)',
          boxShadow: '0 0 30px rgba(129,140,248,0.35)',
        }}
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export default function CustomCursor() {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [isTouch, setIsTouch] = useState(false)

  const mx = useMotionValue(-100)
  const my = useMotionValue(-100)

  // Springs give the cursor a soft trailing feel
  const springX = useSpring(mx, { damping: 30, stiffness: 350, mass: 0.4 })
  const springY = useSpring(my, { damping: 30, stiffness: 350, mass: 0.4 })

  // Ring lags a bit more
  const ringX = useSpring(mx, { damping: 22, stiffness: 180, mass: 0.6 })
  const ringY = useSpring(my, { damping: 22, stiffness: 180, mass: 0.6 })

  useEffect(() => {
    // Respect reduced motion + touch devices
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    setIsTouch(matchMedia('(pointer: coarse)').matches)

    const handleChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', handleChange)

    const move = (e: MouseEvent) => {
      mx.set(e.clientX)
      my.set(e.clientY)
      if (!isVisible) setIsVisible(true)
    }

    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target?.closest) return
      const interactive = target.closest('a, button, [role="button"], input, textarea, select, label')
      setIsHovering(!!interactive)
    }

    const leave = () => setIsVisible(false)

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseover', over)
    window.addEventListener('mouseleave', leave)

    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
      window.removeEventListener('mouseleave', leave)
      mq.removeEventListener('change', handleChange)
    }
  }, [mx, my, isVisible])

  if (reducedMotion || isTouch) return null

  return (
    <>
      {/* Dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full mix-blend-difference"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
          width: isHovering ? 12 : 6,
          height: isHovering ? 12 : 6,
          background: '#fff',
          opacity: isVisible ? 1 : 0,
          transition: 'width 0.2s ease, height 0.2s ease, opacity 0.2s ease',
        }}
      />
      {/* Ring */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9998] rounded-full"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
          width: isHovering ? 56 : 32,
          height: isHovering ? 56 : 32,
          border: '1.5px solid',
          borderColor: isHovering ? 'rgba(129,140,248,0.7)' : 'rgba(255,255,255,0.35)',
          background: isHovering ? 'rgba(129,140,248,0.08)' : 'transparent',
          boxShadow: isHovering ? '0 0 24px rgba(129,140,248,0.35)' : 'none',
          opacity: isVisible ? 1 : 0,
          transition: 'width 0.25s ease, height 0.25s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.25s ease, opacity 0.2s ease',
        }}
      />
    </>
  )
}

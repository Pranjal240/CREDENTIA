'use client'

import React, { useRef } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  MotionStyle,
  SpringOptions,
} from 'framer-motion'

type TiltProps = {
  children: React.ReactNode
  className?: string
  style?: MotionStyle
  rotationFactor?: number
  isReverse?: boolean
  springOptions?: SpringOptions
}

/**
 * 3D tilt wrapper — from motion-primitives (@ibelick).
 * Perspective + rotateX/rotateY driven by pointer position (springy).
 * Set isReverse for a "push" feel; leave false for a "follow" feel.
 */
export function Tilt({
  children,
  className,
  style,
  rotationFactor = 15,
  isReverse = false,
  springOptions = { damping: 15, stiffness: 200 },
}: TiltProps) {
  const ref = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const xSpring = useSpring(x, springOptions)
  const ySpring = useSpring(y, springOptions)

  const rotateX = useTransform(
    ySpring,
    [-0.5, 0.5],
    isReverse ? [rotationFactor, -rotationFactor] : [-rotationFactor, rotationFactor]
  )
  const rotateY = useTransform(
    xSpring,
    [-0.5, 0.5],
    isReverse ? [-rotationFactor, rotationFactor] : [rotationFactor, -rotationFactor]
  )

  const transform = useMotionTemplate`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left) / rect.width - 0.5)
    y.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ transformStyle: 'preserve-3d', ...style, transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  )
}

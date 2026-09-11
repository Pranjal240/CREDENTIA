'use client'

import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { CheckCircle2, ShieldCheck, Sparkles, Fingerprint, Cpu, Award } from 'lucide-react'

/**
 * 3D floating trust badges — orbit the hero at different Z-depths.
 * Each badge parallax-tracks the cursor by an amount inversely proportional to its depth
 * (closer → moves more; further → moves less) creating a real 3D stereoscopic feel.
 */

type Badge = {
  Icon: typeof CheckCircle2
  label: string
  color: string
  bg: string
  border: string
  /** 0..1 — position within the hero as [left, top] percent */
  pos: [string, string]
  /** 0..1 — closer to 0 is further, 1 is closest to camera. Drives parallax intensity. */
  depth: number
  /** delay in seconds for the initial float appearance */
  delay: number
}

const BADGES: Badge[] = [
  {
    Icon: ShieldCheck,
    label: 'SOC 2 · in progress',
    color: '#34d399',
    bg: 'rgba(16,185,129,0.12)',
    border: 'rgba(52,211,153,0.35)',
    pos: ['8%', '18%'],
    depth: 0.85,
    delay: 0.2,
  },
  {
    Icon: Cpu,
    label: 'Groq · 12s avg',
    color: '#818cf8',
    bg: 'rgba(129,140,248,0.12)',
    border: 'rgba(129,140,248,0.35)',
    pos: ['3%', '58%'],
    depth: 0.6,
    delay: 0.5,
  },
  {
    Icon: Fingerprint,
    label: 'Aadhaar · last-4',
    color: '#2dd4bf',
    bg: 'rgba(45,212,191,0.12)',
    border: 'rgba(45,212,191,0.35)',
    pos: ['92%', '8%'],
    depth: 0.4,
    delay: 0.3,
  },
  {
    Icon: Award,
    label: '99.2% precision',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.35)',
    pos: ['94%', '75%'],
    depth: 0.7,
    delay: 0.65,
  },
  {
    Icon: CheckCircle2,
    label: '12.8k profiles',
    color: '#f472b6',
    bg: 'rgba(244,114,182,0.12)',
    border: 'rgba(244,114,182,0.35)',
    pos: ['88%', '40%'],
    depth: 0.3,
    delay: 0.4,
  },
  {
    Icon: Sparkles,
    label: 'AI cross-checked',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.35)',
    pos: ['5%', '35%'],
    depth: 0.5,
    delay: 0.55,
  },
]

export default function FloatingBadges() {
  const [interactive, setInteractive] = useState(false)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const sx = useSpring(mx, { damping: 25, stiffness: 120, mass: 0.6 })
  const sy = useSpring(my, { damping: 25, stiffness: 120, mass: 0.6 })

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const touch = window.matchMedia('(pointer: coarse)').matches
    setInteractive(!reduce && !touch)
    if (reduce || touch) return

    const move = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth)
      my.set(e.clientY / window.innerHeight)
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [mx, my])

  return (
    <div className="absolute inset-0 pointer-events-none hidden md:block" aria-hidden>
      {BADGES.map((b, i) => (
        <FloatingBadge key={i} badge={b} sx={sx} sy={sy} interactive={interactive} />
      ))}
    </div>
  )
}

function FloatingBadge({
  badge,
  sx,
  sy,
  interactive,
}: {
  badge: Badge
  sx: ReturnType<typeof useSpring>
  sy: ReturnType<typeof useSpring>
  interactive: boolean
}) {
  const { Icon, label, color, bg, border, pos, depth, delay } = badge
  const range = 40 * depth // px of parallax travel — closer badges move more
  const parallaxX = useTransform(sx, [0, 1], [range, -range])
  const parallaxY = useTransform(sy, [0, 1], [range * 0.7, -range * 0.7])

  return (
    <motion.div
      className="absolute"
      style={{
        left: pos[0],
        top: pos[1],
        x: interactive ? parallaxX : 0,
        y: interactive ? parallaxY : 0,
      }}
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay + 1.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Continuous float bobbing */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4 + depth * 2, repeat: Infinity, ease: 'easeInOut', delay: delay * 2 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg"
        style={{
          background: bg,
          borderColor: border,
          boxShadow: `0 6px 24px ${color}30`,
          transform: `scale(${0.75 + depth * 0.35})`,
          opacity: 0.55 + depth * 0.45,
        }}
      >
        <Icon size={12} style={{ color }} />
        <span className="text-[10px] font-semibold tracking-wide whitespace-nowrap" style={{ color }}>
          {label}
        </span>
      </motion.div>
    </motion.div>
  )
}

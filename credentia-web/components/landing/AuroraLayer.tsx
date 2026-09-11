'use client'

import { motion } from 'framer-motion'

/**
 * Drifting aurora — three large blurred color blobs that morph independently.
 * Pure CSS + framer-motion (no WebGL) — safe on every browser, near-free CPU.
 * Uses `mix-blend-screen` so it composes over the dark base rather than lightening it.
 */
export default function AuroraLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Indigo cloud — top left */}
      <motion.div
        className="absolute -top-40 -left-40 w-[720px] h-[720px] rounded-full mix-blend-screen"
        style={{
          background:
            'radial-gradient(circle, rgba(99,102,241,0.55) 0%, rgba(99,102,241,0.15) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 60, -40, 0],
          y: [0, -30, 50, 0],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Teal cloud — bottom right */}
      <motion.div
        className="absolute -bottom-52 -right-40 w-[680px] h-[680px] rounded-full mix-blend-screen"
        style={{
          background:
            'radial-gradient(circle, rgba(45,212,191,0.5) 0%, rgba(45,212,191,0.12) 40%, transparent 70%)',
          filter: 'blur(90px)',
        }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 0.92, 1.1, 1],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Violet cloud — center right */}
      <motion.div
        className="absolute top-1/3 right-1/4 w-[500px] h-[500px] rounded-full mix-blend-screen"
        style={{
          background:
            'radial-gradient(circle, rgba(167,139,250,0.4) 0%, rgba(167,139,250,0.1) 40%, transparent 70%)',
          filter: 'blur(70px)',
        }}
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -40, 30, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Tiny star field — subtle depth */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.5), transparent),
            radial-gradient(1px 1px at 70% 45%, rgba(255,255,255,0.35), transparent),
            radial-gradient(1px 1px at 40% 75%, rgba(255,255,255,0.4), transparent),
            radial-gradient(1px 1px at 85% 15%, rgba(255,255,255,0.3), transparent),
            radial-gradient(1px 1px at 10% 90%, rgba(255,255,255,0.35), transparent),
            radial-gradient(1px 1px at 60% 60%, rgba(255,255,255,0.4), transparent)
          `,
          backgroundSize: '600px 600px',
        }}
      />
    </div>
  )
}

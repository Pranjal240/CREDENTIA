'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

/**
 * First-paint splash — shown on cold load only (per-session), then dismissed.
 *
 * Anatomy:
 *   • Full-viewport dark panel with the CREDENTIA logo + wordmark
 *   • Progress ring wipes clockwise as the page settles
 *   • Panel splits vertically and slides away, revealing the hero underneath
 *   • Runs only when the browser is fully painted (safe for SSR — hidden on server)
 *   • Skips itself if the user prefers reduced motion, or if they've seen it this tab session
 */
export default function PageIntro() {
  // Start `mounted:false` so SSR renders nothing → hydration matches → then flip on client.
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setMounted(true)

    // Respect reduced motion
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Only show once per tab session
    const seen = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('credentia_intro_v1') === '1'

    if (reduce || seen) {
      setVisible(false)
      return
    }

    // Show for ~1.6s total, then let the exit animation play (0.9s)
    const t = setTimeout(() => {
      setVisible(false)
      try { sessionStorage.setItem('credentia_intro_v1', '1') } catch {}
    }, 1600)

    return () => clearTimeout(t)
  }, [])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, delay: 0.9 }}
          className="fixed inset-0 z-[500] pointer-events-none flex items-center justify-center"
          style={{ background: 'transparent' }}
        >
          {/* Two halves that slide apart on exit — creates a "curtain reveal" */}
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="absolute top-0 bottom-0 left-0 w-1/2"
            style={{ background: '#080a19' }}
          />
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="absolute top-0 bottom-0 right-0 w-1/2"
            style={{ background: '#080a19' }}
          />

          {/* Center content — logo + wordmark + progress ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            {/* Ambient glow behind logo */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-16 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.5), transparent 70%)' }}
            />

            {/* Progress ring around the logo */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="2"
                />
                <motion.circle
                  cx="50" cy="50" r="46"
                  fill="none"
                  stroke="url(#introGrad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="289.02"
                  initial={{ strokeDashoffset: 289.02 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1.3, ease: 'easeInOut' }}
                />
                <defs>
                  <linearGradient id="introGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-indigo-400/40">
                <Image src="/logo.png" alt="CREDENTIA" fill className="object-contain p-0.5" />
              </div>
            </div>

            {/* Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div
                className="font-heading text-2xl font-extrabold tracking-[0.35em] text-white"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                CREDENTIA
              </div>
              <div className="text-[10px] tracking-[0.25em] uppercase mt-2 text-white/40">
                Trust Layer · Loading
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

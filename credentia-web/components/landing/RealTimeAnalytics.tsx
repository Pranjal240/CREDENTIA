'use client'

import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { Lock, ShieldCheck, Sparkles, FileCheck, KeyRound, Layers } from 'lucide-react'
import { Tilt } from '@/components/ui/tilt'

/* ── Trust pillars — user-facing benefits, no implementation details ───── */
const pillars = [
  {
    Icon: FileCheck,
    tag: 'CROSS-CHECKED',
    title: 'Every field verified against source',
    body: 'Names, dates, degrees and CGPAs are matched back to the issuing university or authority. No hand-typed claims — only what the source confirms.',
    accent: '#818cf8',
    ring: 'rgba(129,140,248,0.35)',
  },
  {
    Icon: ShieldCheck,
    tag: 'FRAUD-RESISTANT',
    title: 'Detects tampering before you see it',
    body: 'Seal patterns, font consistency, signature geometry and metadata are scored together. Anything that doesn’t add up is flagged, never quietly accepted.',
    accent: '#f472b6',
    ring: 'rgba(244,114,182,0.35)',
  },
  {
    Icon: Lock,
    tag: 'AADHAAR-SAFE',
    title: 'Your ID stays yours',
    body: 'Only the last four digits are stored. The full number is dropped the second extraction finishes — never logged, never shared, never surfaced.',
    accent: '#2dd4bf',
    ring: 'rgba(45,212,191,0.35)',
  },
]

/* ── Scroll-choreographed 3D trust badge ───────────────────────────────── */
function TrustBadge3D({ inView }: { inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, rotateY: -30 }}
      animate={inView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[280px] sm:max-w-[360px] lg:max-w-[440px] mx-auto"
      style={{ perspective: 1200 }}
    >
      <Tilt rotationFactor={12} springOptions={{ damping: 20, stiffness: 180, mass: 0.5 }} className="relative">
        {/* Outer glow */}
        <div className="absolute -inset-8 rounded-full blur-3xl opacity-40" style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.5), rgba(45,212,191,0.3) 40%, transparent 70%)' }} />

        {/* Rotating outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="relative w-full aspect-square"
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <defs>
              <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
              <radialGradient id="coreGrad" cx="50%" cy="50%">
                <stop offset="0%" stopColor="rgba(129,140,248,0.4)" />
                <stop offset="100%" stopColor="rgba(129,140,248,0)" />
              </radialGradient>
            </defs>
            {/* Outer dashed ring */}
            <circle cx="200" cy="200" r="180" fill="none" stroke="url(#ringGrad)" strokeWidth="1.5" strokeDasharray="4 8" opacity="0.6" />
            {/* Middle ring */}
            <circle cx="200" cy="200" r="150" fill="none" stroke="url(#ringGrad)" strokeWidth="1" opacity="0.4" />
            {/* Inner glow disc */}
            <circle cx="200" cy="200" r="120" fill="url(#coreGrad)" />
            {/* Anchor points on ring */}
            {[0, 60, 120, 180, 240, 300].map((deg) => {
              const rad = (deg * Math.PI) / 180
              const cx = 200 + Math.cos(rad) * 180
              const cy = 200 + Math.sin(rad) * 180
              return <circle key={deg} cx={cx} cy={cy} r="3" fill="#818cf8" />
            })}
          </svg>
        </motion.div>

        {/* Counter-rotating inner ring (feels alive) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <svg viewBox="0 0 300 300" className="w-[60%] h-[60%]">
            <circle cx="150" cy="150" r="130" fill="none" stroke="rgba(45,212,191,0.35)" strokeWidth="1" strokeDasharray="2 6" />
          </svg>
        </motion.div>

        {/* Center shield */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="relative">
            <div
              className="absolute inset-0 rounded-3xl blur-2xl opacity-60"
              style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)' }}
            />
            <div
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(129,140,248,0.35), rgba(45,212,191,0.28))',
                border: '1.5px solid rgba(129,140,248,0.5)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 20px 60px -12px rgba(129,140,248,0.5)',
              }}
            >
              <ShieldCheck size={44} className="text-white drop-shadow-lg" strokeWidth={1.5} />
            </div>
          </div>
        </motion.div>

        {/* Floating orbital labels */}
        <FloatingChip label="AI cross-check" pos={{ top: '5%', left: '10%' }} accent="#818cf8" delay={0.4} inView={inView} />
        <FloatingChip label="Signed profile" pos={{ top: '10%', right: '5%' }} accent="#a78bfa" delay={0.6} inView={inView} />
        <FloatingChip label="Tamper-proof" pos={{ bottom: '15%', left: '3%' }} accent="#2dd4bf" delay={0.8} inView={inView} />
        <FloatingChip label="Audit-ready" pos={{ bottom: '8%', right: '8%' }} accent="#f472b6" delay={1.0} inView={inView} />
      </Tilt>
    </motion.div>
  )
}

function FloatingChip({
  label,
  pos,
  accent,
  delay,
  inView,
}: {
  label: string
  pos: { top?: string; bottom?: string; left?: string; right?: string }
  accent: string
  delay: number
  inView: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] }}
      className="absolute"
      style={pos}
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3 + Math.random(), repeat: Infinity, ease: 'easeInOut', delay: delay * 2 }}
        className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider uppercase backdrop-blur-md border"
        style={{
          background: `${accent}22`,
          borderColor: `${accent}66`,
          color: accent,
          boxShadow: `0 6px 20px ${accent}30`,
        }}
      >
        {label}
      </motion.div>
    </motion.div>
  )
}

export default function RealTimeAnalytics() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.15 })

  // Scroll-driven parallax for the badge — feels like the shield hovers as you scroll
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const badgeY = useTransform(scrollYProgress, [0, 1], [40, -40])

  return (
    <section id="analytics" ref={ref} className="py-20 sm:py-28 relative overflow-hidden">
      {/* Ambient section glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-30" style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.15), transparent 60%)' }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header — scroll reveal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] text-indigo-400 uppercase mb-4">
            <Sparkles size={11} />
            The trust layer
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.02em] text-white mb-4 leading-tight">
            Trust isn&apos;t claimed.{' '}
            <span
              className="block sm:inline"
              style={{
                background: 'linear-gradient(135deg, #818cf8, #2dd4bf)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              It&apos;s cross-checked.
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(240,243,255,0.78)' }}>
            Every profile is stitched together from verified sources — universities, government IDs and issuing authorities — then sealed against tampering.
          </p>
        </motion.div>

        {/* Split layout — 3D badge left, pillar cards right */}
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-10 lg:gap-16 items-center">
          <motion.div style={{ y: badgeY }} className="order-2 lg:order-1">
            <TrustBadge3D inView={inView} />
          </motion.div>

          <div className="order-1 lg:order-2 space-y-4">
            {pillars.map((p, i) => (
              <motion.div
                key={p.tag}
                initial={{ opacity: 0, x: 40 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: 0.2 + i * 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Tilt rotationFactor={4} springOptions={{ damping: 20, stiffness: 200, mass: 0.4 }}>
                  <div
                    className="relative rounded-2xl p-5 sm:p-6 border overflow-hidden group"
                    style={{
                      background: 'linear-gradient(180deg, rgba(20,24,55,0.65) 0%, rgba(14,17,40,0.8) 100%)',
                      backdropFilter: 'blur(12px)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px -8px rgba(0,0,0,0.5)',
                      transition: 'box-shadow 300ms cubic-bezier(0.22,1,0.36,1), border-color 300ms',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.14), 0 2px 4px rgba(0,0,0,0.4), 0 20px 48px -12px ${p.accent}55`
                      e.currentTarget.style.borderColor = p.ring
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px -8px rgba(0,0,0,0.5)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    }}
                  >
                    {/* Corner glow */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-15 group-hover:opacity-40 blur-2xl transition-opacity duration-500" style={{ background: p.accent }} />

                    <div className="relative flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                        style={{
                          background: `${p.accent}18`,
                          border: `1px solid ${p.ring}`,
                        }}
                      >
                        <p.Icon size={22} style={{ color: p.accent }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold tracking-[0.2em] uppercase mb-1 inline-block" style={{ color: p.accent }}>
                          {p.tag}
                        </span>
                        <h3 className="font-display font-extrabold text-base sm:text-lg text-white mb-1.5 leading-snug tracking-[-0.01em]">
                          {p.title}
                        </h3>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,243,255,0.72)' }}>
                          {p.body}
                        </p>
                      </div>
                    </div>
                  </div>
                </Tilt>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

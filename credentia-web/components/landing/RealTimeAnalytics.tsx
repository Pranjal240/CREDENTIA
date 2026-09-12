'use client'

import { useRef } from 'react'
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'
import {
  Lock, ShieldCheck, Sparkles, FileCheck, KeyRound, Layers,
  FileText, Fingerprint, GraduationCap, Cpu, BadgeCheck, Link2,
} from 'lucide-react'
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

/* ── Immersive 3D Trust Vault — cursor-reactive multi-layer scene ──────
 *
 *   Layers (back → front):
 *     0  outer aurora glow (radial, blurred)
 *     1  slow rotating outer ring (dashed gradient)
 *     2  6-point hexagonal orbit with icon nodes
 *     3  counter-rotating inner ring with tick marks
 *     4  pulsing energy waves emanating from center
 *     5  radial energy beams (SVG lines pulsing outward)
 *     6  central 3D glass vault with layered shield
 *     7  rising verification particles (bottom → up into vault)
 *     8  live status ring (arc) around vault
 *
 *   Cursor: whole scene tilts (Tilt @14°) + shield tracks pointer at 2×
 */

// Six verification stages orbiting the vault
const ORBIT_ICONS = [
  { Icon: FileText, label: 'Upload', color: '#818cf8' },
  { Icon: Cpu, label: 'Extract', color: '#a78bfa' },
  { Icon: Fingerprint, label: 'KYC', color: '#f472b6' },
  { Icon: GraduationCap, label: 'ERP', color: '#60a5fa' },
  { Icon: BadgeCheck, label: 'Sign', color: '#2dd4bf' },
  { Icon: Link2, label: 'Publish', color: '#34d399' },
]

function TrustBadge3D({ inView }: { inView: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null)

  // Pointer follow for the inner shield (lags Tilt slightly, feels alive)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const shieldX = useSpring(mx, { damping: 25, stiffness: 140, mass: 0.6 })
  const shieldY = useSpring(my, { damping: 25, stiffness: 140, mass: 0.6 })

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const dx = (e.clientX - rect.left - rect.width / 2) / rect.width
    const dy = (e.clientY - rect.top - rect.height / 2) / rect.height
    mx.set(dx * 12)
    my.set(dy * 12)
  }
  const onLeave = () => { mx.set(0); my.set(0) }

  return (
    <motion.div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, scale: 0.7, rotateY: -30 }}
      animate={inView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px] mx-auto aspect-square"
      style={{ perspective: 1400 }}
    >
      <Tilt rotationFactor={14} springOptions={{ damping: 22, stiffness: 200, mass: 0.5 }} className="relative w-full h-full">
        {/* ── Layer 0 · aurora bloom behind everything ── */}
        <motion.div
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -inset-8 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.45), rgba(45,212,191,0.25) 40%, transparent 70%)' }}
        />

        {/* ── Layer 1 · slow outer ring — dashed gradient ── */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <defs>
              <linearGradient id="ringGradA" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#2dd4bf" />
              </linearGradient>
              <radialGradient id="vaultCore">
                <stop offset="0%" stopColor="rgba(129,140,248,0.55)" />
                <stop offset="60%" stopColor="rgba(129,140,248,0.12)" />
                <stop offset="100%" stopColor="rgba(129,140,248,0)" />
              </radialGradient>
              <linearGradient id="beamGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(129,140,248,0)" />
                <stop offset="60%" stopColor="rgba(129,140,248,0.6)" />
                <stop offset="100%" stopColor="#fff" />
              </linearGradient>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="2" />
              </filter>
            </defs>
            <circle cx="200" cy="200" r="190" fill="none" stroke="url(#ringGradA)" strokeWidth="1" strokeDasharray="3 10" opacity="0.55" />
            <circle cx="200" cy="200" r="165" fill="none" stroke="url(#ringGradA)" strokeWidth="0.75" strokeDasharray="1 6" opacity="0.35" />
            <circle cx="200" cy="200" r="140" fill="url(#vaultCore)" />
          </svg>
        </motion.div>

        {/* ── Layer 2 · orbital icon nodes (6-point hex) ── */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0"
        >
          {ORBIT_ICONS.map((node, i) => {
            const angle = (i * 60) - 90 // start at top
            const rad = (angle * Math.PI) / 180
            const radius = 42 // % of container
            const x = 50 + Math.cos(rad) * radius
            const y = 50 + Math.sin(rad) * radius
            return (
              <motion.div
                key={node.label}
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              >
                {/* Counter-rotate so icons stay upright */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
                  className="relative"
                >
                  {/* Node glow */}
                  <div
                    className="absolute inset-0 rounded-2xl blur-lg"
                    style={{ background: node.color, opacity: 0.35 }}
                  />
                  {/* Node card */}
                  <div
                    className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center backdrop-blur-md"
                    style={{
                      background: `linear-gradient(135deg, ${node.color}30, ${node.color}12)`,
                      border: `1px solid ${node.color}66`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 24px -6px ${node.color}55`,
                    }}
                  >
                    <node.Icon size={18} style={{ color: node.color }} strokeWidth={2} />
                  </div>
                  {/* Node label pill */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase whitespace-nowrap backdrop-blur-sm"
                    style={{
                      background: `${node.color}18`,
                      color: node.color,
                      border: `1px solid ${node.color}33`,
                    }}
                  >
                    {node.label}
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* ── Layer 3 · counter-rotating tick ring ── */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-[15%]"
        >
          <svg viewBox="0 0 300 300" className="w-full h-full">
            <circle cx="150" cy="150" r="125" fill="none" stroke="rgba(45,212,191,0.28)" strokeWidth="0.75" strokeDasharray="2 8" />
            {[...Array(24)].map((_, i) => {
              const a = (i * 15 * Math.PI) / 180
              const x1 = 150 + Math.cos(a) * 118
              const y1 = 150 + Math.sin(a) * 118
              const x2 = 150 + Math.cos(a) * (i % 3 === 0 ? 105 : 112)
              const y2 = 150 + Math.sin(a) * (i % 3 === 0 ? 105 : 112)
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 3 === 0 ? '#2dd4bf' : 'rgba(45,212,191,0.3)'} strokeWidth={i % 3 === 0 ? 1.5 : 0.75} />
            })}
          </svg>
        </motion.div>

        {/* ── Layer 4 · pulsing energy waves from center ── */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-[30%] rounded-full"
            style={{ border: '1px solid rgba(129,140,248,0.5)' }}
            animate={{
              scale: [0.6, 2.2],
              opacity: [0.7, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              delay: i * 1.15,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* ── Layer 5 · radial energy beams (6 pulsing outward) ── */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 pointer-events-none">
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const rad = (deg * Math.PI) / 180
            const x2 = 200 + Math.cos(rad) * 165
            const y2 = 200 + Math.sin(rad) * 165
            return (
              <motion.line
                key={deg}
                x1={200} y1={200} x2={x2} y2={y2}
                stroke="url(#beamGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                filter="url(#softGlow)"
                animate={{ opacity: [0, 0.85, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.33, ease: 'easeInOut' }}
              />
            )
          })}
        </svg>

        {/* ── Layer 6 · CENTRAL 3D GLASS VAULT ── */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          <motion.div
            style={{ x: shieldX, y: shieldY, transformStyle: 'preserve-3d' }}
            className="relative"
          >
            {/* Back plate — deep glow */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-6 rounded-[2rem] blur-2xl"
              style={{ background: 'radial-gradient(circle, #818cf8, transparent 70%)', opacity: 0.7 }}
            />

            {/* Bottom bevel highlight */}
            <div
              className="absolute inset-0 rounded-[1.75rem] translate-y-[3px]"
              style={{ background: 'linear-gradient(180deg, transparent 60%, rgba(45,212,191,0.4))', filter: 'blur(4px)' }}
            />

            {/* Main glass vault */}
            <div
              className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[1.75rem] flex items-center justify-center overflow-hidden"
              style={{
                background: `
                  linear-gradient(135deg, rgba(129,140,248,0.38) 0%, rgba(45,212,191,0.28) 100%),
                  linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0))
                `,
                border: '1.5px solid rgba(129,140,248,0.6)',
                boxShadow: `
                  inset 0 1px 0 rgba(255,255,255,0.35),
                  inset 0 -12px 24px rgba(45,212,191,0.2),
                  0 24px 60px -12px rgba(129,140,248,0.6),
                  0 0 0 1px rgba(255,255,255,0.06)
                `,
              }}
            >
              {/* Inner sheen */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  background: 'radial-gradient(ellipse at top left, rgba(255,255,255,0.4), transparent 60%)',
                }}
              />

              {/* Rotating inner ring inside vault (subtle) */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-3 rounded-[1.25rem] border border-white/15"
              />

              {/* Shield with floating breath */}
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10"
              >
                <ShieldCheck size={54} className="text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.5)]" strokeWidth={1.5} />
              </motion.div>

              {/* Corner sparkles */}
              {[
                { top: '15%', left: '15%' },
                { top: '18%', right: '20%' },
                { bottom: '18%', left: '22%' },
                { bottom: '15%', right: '15%' },
              ].map((pos, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-white"
                  style={pos}
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
                />
              ))}
            </div>

            {/* "VERIFIED" label pill under vault */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="absolute left-1/2 -translate-x-1/2 top-full mt-3 px-3 py-1 rounded-full text-[9px] font-extrabold tracking-[0.2em] whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, rgba(45,212,191,0.2), rgba(129,140,248,0.2))',
                border: '1px solid rgba(45,212,191,0.5)',
                color: '#5eead4',
                boxShadow: '0 8px 24px rgba(45,212,191,0.3)',
              }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 align-middle animate-pulse" />
              CREDENTIA · VERIFIED
            </motion.div>
          </motion.div>
        </div>

        {/* ── Layer 7 · rising verification particles ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${20 + i * 8}%`,
                bottom: 0,
                background: i % 2 === 0 ? '#818cf8' : '#2dd4bf',
                boxShadow: `0 0 8px ${i % 2 === 0 ? '#818cf8' : '#2dd4bf'}`,
              }}
              animate={{
                y: [0, -280],
                opacity: [0, 1, 1, 0],
                x: [0, (i - 4) * 12],
              }}
              transition={{
                duration: 3.5 + (i % 3),
                repeat: Infinity,
                delay: i * 0.4,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>

        {/* ── Layer 8 · live status arc around whole vault ── */}
        <svg viewBox="0 0 400 400" className="absolute inset-[8%] pointer-events-none">
          <motion.circle
            cx="200"
            cy="200"
            r="170"
            fill="none"
            stroke="url(#ringGradA)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="1068"
            initial={{ strokeDashoffset: 1068 }}
            animate={inView ? { strokeDashoffset: 0 } : {}}
            transition={{ duration: 2.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            opacity="0.7"
          />
        </svg>
      </Tilt>
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

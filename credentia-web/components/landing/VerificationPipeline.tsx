'use client'

import { useRef, useState, MouseEvent } from 'react'
import { motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
// numeric spring; render as percentage via useTransform
import { Upload, Cpu, ShieldCheck, Link2, ArrowRight } from 'lucide-react'

const steps = [
  {
    step: 'STEP 1',
    icon: Upload,
    title: 'Upload',
    description: 'Drop resume, degree, PCC & Aadhaar. PDF or image, no format juggling.',
    color: '#818cf8',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-400/25',
    text: 'text-indigo-400',
  },
  {
    step: 'STEP 2',
    icon: Cpu,
    title: 'AI extract',
    description: 'Text and vision models read every field of every document, in seconds.',
    color: '#a78bfa',
    bg: 'bg-violet-500/10',
    border: 'border-violet-400/25',
    text: 'text-violet-400',
  },
  {
    step: 'STEP 3',
    icon: ShieldCheck,
    title: 'Cross-check',
    description: 'Name, DOB and university are validated against government + ERP records.',
    color: '#f472b6',
    bg: 'bg-pink-500/10',
    border: 'border-pink-400/25',
    text: 'text-pink-400',
  },
  {
    step: 'STEP 4',
    icon: Link2,
    title: 'Get link',
    description: 'One tamper-proof URL with QR — share it with every employer.',
    color: '#2dd4bf',
    bg: 'bg-teal-500/10',
    border: 'border-teal-400/25',
    text: 'text-teal-400',
  },
]

export default function VerificationPipeline() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.05 })
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  // Cursor-reactive X (0-100 numeric percent) with springy follow
  const cursorX = useMotionValue(50)
  const smoothCursorX = useSpring(cursorX, { damping: 24, stiffness: 180, mass: 0.6 })
  const cursorLeft = useTransform(smoothCursorX, v => `${v}%`)

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return
    const rect = gridRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    cursorX.set(pct)
  }

  return (
    <section id="how-it-works" ref={ref} className="py-24 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-[10px] font-bold tracking-[0.25em] text-violet-400 uppercase mb-4 inline-block">
            Verification Pipeline
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.02em] text-white mb-4 leading-tight">
            From upload to verified
            <span className="block" style={{ background: 'linear-gradient(135deg, #a78bfa, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              profile in seconds
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(240,243,255,0.78)' }}>
            Every document flows through 4 AI stages. Watch it happen.
          </p>
        </motion.div>

        {/* Pipeline steps — line runs THROUGH middle of icons */}
        <div
          ref={gridRef}
          onMouseMove={handleMove}
          onMouseLeave={() => { setHovered(null); cursorX.set(50) }}
          className="relative"
        >
          {/* Connector line — sits at 32px = vertical center of the 64px icons */}
          <div
            className="hidden md:block absolute left-[12.5%] right-[12.5%] h-px z-0 pointer-events-none"
            style={{
              top: 32,
              background: 'linear-gradient(90deg, rgba(129,140,248,0.35), rgba(167,139,250,0.35), rgba(244,114,182,0.35), rgba(45,212,191,0.35))',
            }}
          />

          {/* Cursor-reactive glowing dot — slides along the line, following cursor X */}
          <motion.div
            className="hidden md:block absolute w-3.5 h-3.5 rounded-full z-20 pointer-events-none"
            style={{
              top: 32,
              left: cursorLeft,
              translateX: '-50%',
              translateY: '-50%',
              background: 'radial-gradient(circle, #ffffff 0%, #a5b4fc 55%, transparent 80%)',
              boxShadow: '0 0 10px #a5b4fc, 0 0 22px rgba(129,140,248,0.6)',
            }}
          />

          <div className="grid md:grid-cols-4 gap-6 relative">
            {steps.map((s, i) => {
              const active = hovered === i
              return (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 30 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
                  onMouseEnter={() => setHovered(i)}
                  className="relative flex flex-col items-center text-center group cursor-pointer"
                >
                  {/* Step badge — icon at exact centerline of connector */}
                  <div className="relative z-10 mb-5">
                    {/* Subtle constant pulse — one ring, slow */}
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0, 0.25] }}
                      transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
                      className={`absolute inset-0 rounded-2xl ${s.bg} pointer-events-none`}
                    />
                    {/* Icon container — lifts + brightens on hover */}
                    <motion.div
                      animate={{
                        scale: active ? 1.1 : 1,
                        borderColor: active ? s.color : undefined,
                      }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className={`relative w-16 h-16 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center backdrop-blur-sm`}
                      style={{
                        boxShadow: active
                          ? `0 12px 36px ${s.color}60, 0 0 0 3px ${s.color}25`
                          : `0 8px 20px ${s.color}18`,
                      }}
                    >
                      <s.icon size={26} className={s.text} />
                    </motion.div>
                  </div>

                  <span className={`text-[9px] font-bold tracking-[0.2em] ${s.text} uppercase mb-2`}>
                    {s.step}
                  </span>
                  <h3 className="font-display text-xl font-extrabold tracking-[-0.01em] text-white mb-2 transition-colors group-hover:text-white">
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: active ? 'rgba(240,243,255,0.92)' : 'rgba(240,243,255,0.72)' }}>
                    {s.description}
                  </p>

                  {/* Mobile arrow */}
                  {i < steps.length - 1 && (
                    <ArrowRight size={18} className="md:hidden mt-4 text-white/20 rotate-90" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

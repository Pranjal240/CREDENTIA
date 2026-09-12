'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Cpu, CheckCircle2, GraduationCap, ShieldCheck, Zap } from 'lucide-react'
import { Tilt } from '@/components/ui/tilt'

const fields = [
  { label: 'FULL NAME', value: 'Pranjal Mishra' },
  { label: 'INSTITUTION', value: 'J.C. Bose University, YMCA' },
  { label: 'PROGRAM', value: 'B.Tech · Electronics & Communication' },
  { label: 'YEAR OF PASSING', value: 'Aug 2023 – Aug 2027' },
  { label: 'CGPA', value: '7.51 / 10' },
]

export default function AIVerificationEngine() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.05 })
  const [verifiedCount, setVerifiedCount] = useState(0)
  const [confidence, setConfidence] = useState(0)
  const [cycle, setCycle] = useState(0)

  // Cycling extraction animation — restarts continuously
  useEffect(() => {
    if (!inView) return
    let step = 0
    const interval = setInterval(() => {
      step++
      if (step <= fields.length) {
        setVerifiedCount(step)
      } else if (step === fields.length + 3) {
        // Restart cycle
        step = 0
        setVerifiedCount(0)
        setCycle(c => c + 1)
      }
    }, 700)
    return () => clearInterval(interval)
  }, [inView])

  // Confidence meter animation — ticks toward target
  useEffect(() => {
    if (!inView) return
    const target = verifiedCount === fields.length ? 98 : Math.round((verifiedCount / fields.length) * 92)
    let current = confidence
    const tick = setInterval(() => {
      if (current < target) { current = Math.min(current + 2, target); setConfidence(current) }
      else if (current > target) { current = Math.max(current - 3, target); setConfidence(current) }
    }, 40)
    return () => clearInterval(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedCount, inView])

  const running = verifiedCount < fields.length

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] text-teal-400 uppercase mb-4">
            <Cpu size={11} />
            AI Verification Engine
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.02em] text-white mb-4 leading-tight">
            Watch a document
            <span className="block" style={{ background: 'linear-gradient(135deg, #2dd4bf, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              get verified
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(240,243,255,0.78)' }}>
            One document · four AI stages · live confidence readout. Refreshes automatically.
          </p>
        </motion.div>

        {/* Certificate + extraction grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Certificate mock — with 3D tilt */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-3 rounded-3xl blur-2xl opacity-40" style={{ background: 'radial-gradient(circle at center, #2dd4bf, transparent 60%)' }} />

            <Tilt rotationFactor={8} springOptions={{ damping: 18, stiffness: 160, mass: 0.5 }} className="relative rounded-2xl">
            <div className="relative rounded-2xl border border-white/[0.1] p-6 shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #faf6ec 0%, #f0e9d6 100%)' }}>
              {/* Header row */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={running ? 'running' : 'verified'}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.25 }}
                    className={`text-[9px] font-bold tracking-[0.2em] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${
                      running ? 'text-emerald-700 bg-emerald-100 border border-emerald-300' : 'text-teal-700 bg-teal-100 border border-teal-300'
                    }`}
                  >
                    {/* Triple-pulse indicator dots */}
                    <span className="relative inline-flex h-2 w-2">
                      <motion.span
                        animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                        className={`absolute inline-flex h-full w-full rounded-full ${running ? 'bg-emerald-500' : 'bg-teal-500'}`}
                      />
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${running ? 'bg-emerald-500' : 'bg-teal-500'}`} />
                    </span>
                    {running ? 'RUNNING · CYCLE ' + (cycle + 1) : 'VERIFIED'}
                  </motion.span>
                </AnimatePresence>
                <span className="text-[10px] font-bold tracking-widest text-amber-900/60">DEGREE CERTIFICATE</span>
              </div>

              {/* Certificate header */}
              <div className="text-center border-b border-amber-900/10 pb-4 mb-4">
                <div className="text-[10px] font-bold tracking-[0.2em] text-amber-900/50 uppercase mb-1">J.C. Bose University · YMCA · Faridabad</div>
                <div className="font-display text-lg font-extrabold tracking-[-0.01em] text-amber-950" style={{ fontFamily: 'serif' }}>Office of the Registrar · 2026</div>
              </div>

              {/* Body */}
              <div className="space-y-2 text-amber-950/80 text-sm mb-4" style={{ fontFamily: 'serif' }}>
                <div>This is to certify that</div>
                <div className="text-lg font-bold text-amber-950 italic">Pranjal Mishra</div>
                <div>is currently enrolled in</div>
                <div className="italic">B.Tech · Electronics &amp; Communication Engineering</div>
                <div className="text-xs">CGPA 7.51 / 10 · Aug 2023 – Aug 2027</div>
              </div>

              {/* Seal + progress meter */}
              <div className="flex items-end justify-between mt-6">
                <div className="flex-1 pr-3">
                  <div className="text-[8px] font-bold tracking-widest text-amber-900/60 mb-1.5">EXTRACTION PROGRESS</div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(120,53,15,0.12)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #14b8a6, #10b981)' }}
                      animate={{ width: `${(verifiedCount / fields.length) * 100}%` }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="text-[9px] font-bold text-emerald-700 mt-1">
                    {verifiedCount} / {fields.length} fields · {confidence}% confidence
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: running ? 360 : 0 }}
                  transition={{ duration: 12, repeat: running ? Infinity : 0, ease: 'linear' }}
                  className="w-16 h-16 rounded-full border-4 border-amber-900/30 flex flex-col items-center justify-center flex-shrink-0"
                >
                  <div className="text-[8px] font-bold tracking-widest text-amber-900/60">SEAL</div>
                  <div className="text-[8px] font-bold text-amber-900/60">2026</div>
                </motion.div>
              </div>

              {/* Scanning bar (top-to-bottom sweep) */}
              <motion.div
                animate={{ y: [0, 320, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-[3px] pointer-events-none z-20"
                style={{ background: 'linear-gradient(90deg, transparent, #2dd4bf, transparent)', boxShadow: '0 0 20px #2dd4bf, 0 0 40px #2dd4bf' }}
              />

              {/* Radar sweep overlay */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 pointer-events-none z-0 opacity-20"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 340deg, rgba(45,212,191,0.5) 355deg, transparent 360deg)',
                }}
              />
            </div>
            </Tilt>
          </motion.div>

          {/* Extracted fields panel — also with 3D tilt (reverse direction for depth) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Tilt rotationFactor={6} isReverse springOptions={{ damping: 18, stiffness: 160, mass: 0.5 }}>
            <div className="rounded-2xl border border-white/[0.08] p-6" style={{ background: 'linear-gradient(180deg, rgba(20,24,55,0.7) 0%, rgba(14,17,40,0.8) 100%)', backdropFilter: 'blur(12px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 60px -20px rgba(45,212,191,0.25)' }}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: running ? 360 : 0 }}
                    transition={{ duration: 2, repeat: running ? Infinity : 0, ease: 'linear' }}
                  >
                    <Cpu size={14} className="text-teal-400" />
                  </motion.div>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-teal-400 uppercase">Extracted by AI</span>
                </div>
                <motion.span
                  key={confidence}
                  initial={{ scale: 1.15, color: '#5eead4' }}
                  animate={{ scale: 1, color: '#2dd4bf' }}
                  transition={{ duration: 0.3 }}
                  className="text-[11px] font-extrabold tracking-wider tabular-nums"
                >
                  {confidence}% CONFIDENCE
                </motion.span>
              </div>

              {/* Field rows */}
              <div className="space-y-2 mb-5">
                {fields.map((f, i) => (
                  <motion.div
                    key={f.label}
                    animate={{ opacity: i < verifiedCount ? 1 : 0.4, x: i < verifiedCount ? 0 : -4 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg border relative overflow-hidden"
                    style={{
                      background: i < verifiedCount ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                      borderColor: i < verifiedCount ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Active row shimmer */}
                    {i === verifiedCount && running && (
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.15), transparent)' }}
                      />
                    )}
                    <div className="relative">
                      <div className="text-[8px] font-bold tracking-widest text-white/50 uppercase mb-0.5">{f.label}</div>
                      <div className="text-sm font-semibold text-white/90">{f.value}</div>
                    </div>
                    {i < verifiedCount ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                        <CheckCircle2 size={16} className="text-emerald-400 relative" />
                      </motion.div>
                    ) : i === verifiedCount && running ? (
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-teal-400 animate-spin relative" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/10 relative" />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <AnimatePresence mode="wait">
                    {!running ? (
                      <motion.div key="verified" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400">Verified · 98% confidence</span>
                      </motion.div>
                    ) : (
                      <motion.div key="scanning" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex items-center gap-2">
                        <Zap size={14} className="text-teal-400" />
                        <span className="text-xs font-semibold text-teal-400">Scanning field {verifiedCount + 1} · {fields[verifiedCount]?.label.toLowerCase()}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-[10px] text-white/50 tabular-nums">{(verifiedCount * 2.3).toFixed(1)}s</span>
              </div>
              <p className="text-[10px] mt-2" style={{ color: 'rgba(240,243,255,0.5)' }}>
                All fields cross-checked against university ERP · avg 11.4s per document
              </p>
            </div>
            </Tilt>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

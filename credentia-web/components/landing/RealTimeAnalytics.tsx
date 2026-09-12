'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Activity, ShieldAlert, FileLock2, Zap } from 'lucide-react'
import { Tilt } from '@/components/ui/tilt'

const statCards = [
  {
    icon: Activity,
    tag: 'Live change-stream',
    title: 'Postgres subscriptions per row',
    accent: '#818cf8',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-400/25',
    color: 'text-indigo-400',
  },
  {
    icon: ShieldAlert,
    tag: 'Fraud detection',
    title: 'Cross-doc consistency, 99.2% precision',
    metric: '99.2%',
    accent: '#f472b6',
    bg: 'bg-pink-500/10',
    border: 'border-pink-400/25',
    color: 'text-pink-400',
  },
  {
    icon: FileLock2,
    tag: 'Audit trail',
    title: 'Every admin override logged forever',
    metric: 'IMMUTABLE',
    accent: '#2dd4bf',
    bg: 'bg-teal-500/10',
    border: 'border-teal-400/25',
    color: 'text-teal-400',
  },
]

/* ── Rolling event feed ───────────────────────────────────────────── */
type Event = { id: number; type: 'INSERT' | 'UPDATE'; typeColor: string; msg: string }

const EVENT_POOL: Omit<Event, 'id'>[] = [
  { type: 'INSERT', typeColor: 'text-emerald-400', msg: 'documents · resume_verified · Priya Sharma (IIT-B) · ATS 91' },
  { type: 'UPDATE', typeColor: 'text-indigo-400', msg: 'profiles · trust_score = 96 · cross-check passed' },
  { type: 'INSERT', typeColor: 'text-emerald-400', msg: 'documents · aadhaar_verified · last-4 stored · full dropped' },
  { type: 'UPDATE', typeColor: 'text-violet-400', msg: 'analytics · verification_count = 12,847 · fraud_flags = 0' },
  { type: 'INSERT', typeColor: 'text-emerald-400', msg: 'documents · degree_verified · Aryan Kumar (NIT-T) · CGPA 8.9' },
  { type: 'UPDATE', typeColor: 'text-indigo-400', msg: 'profiles · profile_views += 12 · shared to 3 recruiters' },
  { type: 'INSERT', typeColor: 'text-teal-400', msg: 'documents · pcc_verified · seal_match = 98.4%' },
  { type: 'UPDATE', typeColor: 'text-pink-400', msg: 'universities · records_synced = 428 · queue_depth = 0' },
]

function LiveStream() {
  const [events, setEvents] = useState<Event[]>(() =>
    EVENT_POOL.slice(0, 4).map((e, i) => ({ ...e, id: i }))
  )
  const nextId = useRef(4)

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev => {
        const nextTemplate = EVENT_POOL[nextId.current % EVENT_POOL.length]
        const newEvent: Event = { ...nextTemplate, id: nextId.current }
        nextId.current += 1
        return [newEvent, ...prev].slice(0, 4)
      })
    }, 3200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-2 font-mono tabular-nums relative overflow-hidden" style={{ minHeight: 152 }}>
      <AnimatePresence initial={false}>
        {events.map((row, i) => (
          <motion.div
            key={row.id}
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 34 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 text-[11px] px-3 rounded-lg overflow-hidden"
            style={{ background: i === 0 ? 'rgba(129,140,248,0.08)' : 'rgba(255,255,255,0.025)' }}
          >
            <span className={`font-bold ${row.typeColor} w-14 flex-shrink-0`}>{row.type}</span>
            <span className="text-white/80 flex-1 truncate">{row.msg}</span>
            <span className="text-white/40 text-[10px] flex-shrink-0">
              {i === 0 ? 'now' : `${i * 3}s`}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

/* ── Live counter — ticks up while section in view ─────────────────── */
function LiveCounter() {
  const [count, setCount] = useState(12847)
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 3) + 1)
    }, 1800)
    return () => clearInterval(interval)
  }, [])
  return (
    <span className="tabular-nums" style={{ fontFeatureSettings: '"tnum" 1' }}>
      {count.toLocaleString('en-IN')}
    </span>
  )
}

export default function RealTimeAnalytics() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.05 })

  return (
    <section id="analytics" ref={ref} className="py-24 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.25em] text-indigo-400 uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Real-Time Analytics
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.02em] text-[rgb(var(--text-primary))] mb-4 leading-tight">
            Every verification,
            <span className="block" style={{ background: 'linear-gradient(135deg, #818cf8, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              measured live.
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(240,243,255,0.75)' }}>
            Supabase Postgres change-streams push updates the moment a document is scored. Admins, universities and companies see the same numbers at the same second — no dashboards to refresh.
          </p>
        </motion.div>

        {/* Live counter — hero metric that ticks in real-time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-center mb-8"
        >
          <div className="text-[10px] font-bold tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(240,243,255,0.5)' }}>
            Verifications completed today
          </div>
          <div
            className="font-display font-extrabold text-6xl sm:text-7xl tracking-[-0.03em]"
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #6ee7d7 50%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 20px rgba(129,140,248,0.35))',
            }}
          >
            <LiveCounter />
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs" style={{ color: 'rgba(240,243,255,0.55)' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="font-mono text-[11px]">+ new verification every ~2s</span>
          </div>
        </motion.div>

        {/* Live stream visual */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="rounded-2xl border border-white/[0.08] p-6 mb-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(20,24,55,0.65) 0%, rgba(14,17,40,0.8) 100%)',
            backdropFilter: 'blur(12px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 60px -20px rgba(129,140,248,0.25)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-indigo-400" />
              <span className="text-xs font-bold text-white/80 tracking-wider font-mono">STREAM · verifications</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 tracking-wider">LIVE</span>
            </div>
          </div>

          <LiveStream />
        </motion.div>

        {/* 3-column stat cards — each in its own 3D Tilt */}
        <div className="grid md:grid-cols-3 gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={s.tag}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.35 + i * 0.1 }}
              className="h-full"
            >
            <Tilt rotationFactor={6} springOptions={{ damping: 18, stiffness: 160, mass: 0.5 }} className="h-full">
              <div
                className={`rounded-2xl border ${s.border} p-5 relative overflow-hidden group h-full`}
                style={{
                  background: 'linear-gradient(180deg, rgba(20,24,55,0.65) 0%, rgba(14,17,40,0.8) 100%)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)`,
                  transition: 'box-shadow 300ms cubic-bezier(0.22,1,0.36,1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.14), 0 2px 4px rgba(0,0,0,0.4), 0 20px 48px -12px ${s.accent}55`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)'
                }}
              >
                <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-25 group-hover:opacity-50 blur-2xl transition-opacity duration-500" style={{ background: s.accent }} />
                <div className="flex items-center gap-2 mb-3 relative">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} border ${s.border} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <s.icon size={15} className={s.color} />
                  </div>
                  <span className={`text-[10px] font-bold tracking-[0.2em] ${s.color} uppercase`}>{s.tag}</span>
                </div>
                <p className="text-sm leading-relaxed relative" style={{ color: 'rgba(240,243,255,0.82)' }}>
                  {s.title}
                </p>
                {s.metric && (
                  <div className={`mt-3 font-display text-3xl font-extrabold tracking-[-0.02em] tabular-nums ${s.color}`}>{s.metric}</div>
                )}
              </div>
            </Tilt>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

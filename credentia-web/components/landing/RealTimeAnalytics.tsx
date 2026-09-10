'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Activity, ShieldAlert, FileLock2, Zap } from 'lucide-react'

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
    <div className="space-y-2 font-mono relative overflow-hidden" style={{ minHeight: 152 }}>
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
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[rgb(var(--text-primary))] mb-4 leading-tight">
            Every verification,
            <span className="block" style={{ background: 'linear-gradient(135deg, #818cf8, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              measured live.
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(240,243,255,0.75)' }}>
            Supabase Postgres change-streams push updates the moment a document is scored. Admins, universities and companies see the same numbers at the same second — no dashboards to refresh.
          </p>
        </motion.div>

        {/* Live stream visual */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="rounded-2xl border border-white/[0.08] p-6 mb-6 relative overflow-hidden"
          style={{ background: 'rgba(14,17,40,0.7)', backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-indigo-400" />
              <span className="text-xs font-bold text-white/80 tracking-wider">STREAM · verifications</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-400 tracking-wider">LIVE</span>
            </div>
          </div>

          <LiveStream />
        </motion.div>

        {/* 3-column stat cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={s.tag}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.35 + i * 0.1 }}
              whileHover={{ y: -4 }}
              className={`rounded-2xl border ${s.border} p-5 relative overflow-hidden group transition-all`}
              style={{ background: 'rgba(14,17,40,0.7)', backdropFilter: 'blur(12px)' }}
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-20 group-hover:opacity-40 blur-2xl transition-opacity" style={{ background: s.accent }} />
              <div className="flex items-center gap-2 mb-3 relative">
                <div className={`w-8 h-8 rounded-lg ${s.bg} border ${s.border} flex items-center justify-center`}>
                  <s.icon size={15} className={s.color} />
                </div>
                <span className={`text-[10px] font-bold tracking-[0.2em] ${s.color} uppercase`}>{s.tag}</span>
              </div>
              <p className="text-sm leading-relaxed relative" style={{ color: 'rgba(240,243,255,0.8)' }}>
                {s.title}
              </p>
              {s.metric && (
                <div className={`mt-3 text-2xl font-extrabold ${s.color}`}>{s.metric}</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

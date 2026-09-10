'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { Cpu, Shield, Zap, Building2, Search, ClipboardList, ArrowRight } from 'lucide-react'

const cells = [
  {
    tag: 'AI CORE',
    icon: Cpu,
    title: 'AI-powered analysis',
    description: 'Text and image models read every field of every document, with per-field confidence scores.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-400/20',
    accent: '#818cf8',
  },
  {
    tag: 'PRIVACY',
    icon: Shield,
    title: 'Aadhaar-safe by design',
    description: 'Only the last 4 digits are stored. Full number is dropped after extraction. Never logged.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-400/20',
    accent: '#34d399',
  },
  {
    tag: 'SPEED',
    icon: Zap,
    title: 'Under 12 seconds',
    description: 'From upload to verified — PDF parse via unpdf, R2 storage, response in one round trip.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-400/20',
    accent: '#facc15',
  },
  {
    tag: 'ERP',
    icon: Building2,
    title: 'University ERP push',
    description: 'Registrars pipe CGPA & degree data straight in. Companies see university-signed records.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-400/20',
    accent: '#2dd4bf',
  },
  {
    tag: 'HIRING',
    icon: Search,
    title: 'JD → candidate matching',
    description: 'Paste a job description. AI ranks verified candidates by relevance, skill overlap & trust score.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-400/20',
    accent: '#a78bfa',
  },
  {
    tag: 'AUDIT',
    icon: ClipboardList,
    title: 'Immutable audit log',
    description: 'Every admin override, status change and manual verification is stamped and searchable forever.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-400/20',
    accent: '#f472b6',
  },
]

export default function FullStack() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.05 })

  return (
    <section id="features" ref={ref} className="py-24 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14"
        >
          <div>
            <span className="text-[10px] font-bold tracking-[0.25em] text-indigo-400 uppercase mb-4 inline-block">
              Full Stack
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[rgb(var(--text-primary))] leading-tight max-w-2xl">
              Not just verification — a complete{' '}
              <span style={{ background: 'linear-gradient(135deg, #818cf8, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                trust platform
              </span>
            </h2>
          </div>
          <Link href="/features" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-indigo-300 border border-indigo-400/30 hover:bg-indigo-500/10 transition-all group whitespace-nowrap">
            See all features
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cells.map((c, i) => (
            <motion.div
              key={c.tag}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              whileHover={{ y: -6 }}
              className={`relative rounded-2xl border ${c.border} p-6 group overflow-hidden transition-all`}
              style={{ background: 'rgba(14,17,40,0.6)', backdropFilter: 'blur(12px)' }}
            >
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-15 group-hover:opacity-30 blur-2xl transition-opacity" style={{ background: c.accent }} />

              <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
                <c.icon size={20} className={c.color} />
              </div>

              <span className={`text-[9px] font-bold tracking-[0.2em] ${c.color} uppercase mb-2 inline-block`}>
                {c.tag}
              </span>
              <h3 className="font-heading text-lg font-extrabold text-[rgb(var(--text-primary))] mb-2 leading-snug">
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(240,243,255,0.72)' }}>
                {c.description}
              </p>

              <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40 group-hover:opacity-100 transition-opacity" style={{ background: c.accent }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

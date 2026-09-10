'use client'

import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import {
  ArrowRight, Shield, FileText, Fingerprint, GraduationCap, Link2, Settings, LayoutGrid,
  Upload, CheckCircle2, TrendingUp, Sparkles, Cpu, Users, Building2, Search, Award,
} from 'lucide-react'
import MagneticButton from './MagneticButton'

/* ── Rotating "VERIFYING NOW" tags ────────────────────────────────── */
const rotatingTags = [
  'Degree certificate',
  'Police clearance',
  'Aadhaar (last 4)',
  'Resume + ATS score',
  'CGPA from ERP',
]

/* ── Sidebar nav ──────────────────────────────────────────────────── */
const sidebarItems = [
  { icon: LayoutGrid, label: 'Overview', active: true },
  { icon: FileText, label: 'Resume' },
  { icon: Shield, label: 'Police' },
  { icon: Fingerprint, label: 'Aadhaar' },
  { icon: GraduationCap, label: 'Degree' },
  { icon: Link2, label: 'My Link' },
  { icon: Settings, label: 'Settings' },
]

/* ── Tabbed dashboard content ─────────────────────────────────────── */
type Portal = 'STUDENT' | 'UNIVERSITY' | 'COMPANY'

const portalContent: Record<Portal, {
  header: string
  stats: { label: string; value: string; sub?: string; badge: string; color: string }[]
}> = {
  STUDENT: {
    header: 'Verified profile ready',
    stats: [
      { label: 'ATS SCORE', value: '94', sub: '/100', badge: '+8', color: 'indigo' },
      { label: 'VERIFIED', value: '4', sub: 'docs', badge: '4/4', color: 'emerald' },
      { label: 'PROFILE VIEWS', value: '2,847', badge: '+142', color: 'teal' },
    ],
  },
  UNIVERSITY: {
    header: 'Registrar syncing 428 records',
    stats: [
      { label: 'RECORDS', value: '428', badge: 'SYNC', color: 'indigo' },
      { label: 'VERIFIED', value: '412', sub: '/428', badge: '96%', color: 'emerald' },
      { label: 'STUDENTS', value: '1,240', badge: '+56', color: 'teal' },
    ],
  },
  COMPANY: {
    header: '4 matches for backend hire',
    stats: [
      { label: 'MATCHES', value: '4', sub: '/45', badge: 'TOP', color: 'indigo' },
      { label: 'VERIFIED', value: '4', sub: 'docs', badge: '4/4', color: 'emerald' },
      { label: 'PROFILE VIEWS', value: '530', badge: '+142', color: 'teal' },
    ],
  },
}

function DashboardMockup() {
  const [portal, setPortal] = useState<Portal>('STUDENT')

  // Auto-rotate portal every 4s
  useEffect(() => {
    const portals: Portal[] = ['STUDENT', 'UNIVERSITY', 'COMPANY']
    const interval = setInterval(() => {
      setPortal(prev => {
        const idx = portals.indexOf(prev)
        return portals[(idx + 1) % portals.length]
      })
    }, 4500)
    return () => clearInterval(interval)
  }, [])

  const content = portalContent[portal]

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[600px]"
    >
      {/* Glow behind */}
      <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/15 via-teal-500/10 to-indigo-500/15 rounded-3xl blur-2xl" />

      {/* Browser frame */}
      <div className="relative rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl" style={{ background: 'rgba(14,17,40,0.95)' }}>
        {/* Browser top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]" style={{ background: 'rgba(8,10,25,0.9)' }}>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="px-3 py-1 rounded-md text-[10px] text-white/30 font-mono" style={{ background: 'rgba(255,255,255,0.04)' }}>
              credentiaonline.in / dashboard / {portal.toLowerCase()}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[9px] font-semibold text-red-400/80 tracking-wider">LIVE</span>
          </div>
        </div>

        {/* Portal tabs */}
        <div className="flex items-center gap-0.5 px-3 pt-3 pb-1 border-b border-white/[0.04]" style={{ background: 'rgba(10,12,28,0.6)' }}>
          <span className="text-[8px] font-bold tracking-[0.15em] text-white/25 uppercase px-2 py-1">Portal ·</span>
          {(['STUDENT', 'UNIVERSITY', 'COMPANY'] as Portal[]).map(p => (
            <button
              key={p}
              onClick={() => setPortal(p)}
              className={`text-[9px] font-bold tracking-[0.15em] px-2 py-1 rounded-md transition-colors ${
                portal === p ? 'text-indigo-300 bg-indigo-500/15' : 'text-white/30 hover:text-white/50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Dashboard content */}
        <div className="flex" style={{ minHeight: 340 }}>
          {/* Sidebar */}
          <div className="w-[130px] border-r border-white/[0.06] py-3 px-2 flex flex-col gap-0.5 flex-shrink-0" style={{ background: 'rgba(10,12,28,0.8)' }}>
            {sidebarItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                  item.active
                    ? 'bg-indigo-500/15 text-indigo-300'
                    : 'text-white/35 hover:text-white/50'
                }`}
              >
                <item.icon size={12} className={item.active ? 'text-indigo-400' : 'text-white/25'} />
                {item.label}
              </div>
            ))}
            {/* Trust Score at bottom */}
            <div className="mt-auto pt-3 border-t border-white/[0.06]">
              <div className="rounded-lg p-2" style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(45,212,191,0.1))' }}>
                <div className="flex items-center gap-1 mb-0.5">
                  <TrendingUp size={9} className="text-teal-400" />
                  <span className="text-[8px] font-bold text-white/60">Trust Score</span>
                </div>
                <div className="text-lg font-extrabold text-teal-300 leading-none">96%</div>
                <div className="text-[7px] text-white/40 mt-0.5">Top 3% verified</div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={portal}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="flex-1 p-4 overflow-hidden"
            >
              {/* Header */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-bold tracking-[0.15em] text-indigo-400/60 uppercase">Portal · {portal}</span>
                </div>
                <h3 className="text-sm font-bold text-white/90">{content.header}</h3>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {content.stats.map((stat) => (
                  <div key={stat.label} className="rounded-xl p-2.5 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center bg-${stat.color}-500/15`}>
                        <div className={`w-2 h-2 rounded-sm bg-${stat.color}-400`} />
                      </div>
                      <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-${stat.color}-500/10 text-${stat.color}-400`}>
                        {stat.badge}
                      </span>
                    </div>
                    <div className="text-[7px] font-bold tracking-wider text-white/30 uppercase mb-0.5">{stat.label}</div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg font-extrabold text-white/90">{stat.value}</span>
                      {stat.sub && <span className="text-[9px] text-white/30">{stat.sub}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Verification activity line chart */}
              <div className="rounded-xl p-2.5 border border-white/[0.06] mb-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-[10px] font-bold text-white/70">Verification activity</div>
                    <div className="text-[8px] text-white/25">Last 7 days</div>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="flex items-center gap-1 text-[7px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                      <Upload size={7} /> UPLOADS
                    </span>
                    <span className="flex items-center gap-1 text-[7px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 size={7} /> VERIFIED
                    </span>
                  </div>
                </div>
                {/* Line chart */}
                <svg viewBox="0 0 300 60" className="w-full h-14" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[10, 25, 40].map(y => (
                    <line key={y} x1="0" y1={y} x2="300" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                  ))}
                  {/* Area */}
                  <path d="M0,45 C30,40 50,32 75,28 C100,25 125,18 150,20 C175,22 200,10 225,8 C250,7 275,15 300,5 L300,60 L0,60 Z" fill="url(#areaGrad)" />
                  {/* Line */}
                  <path d="M0,45 C30,40 50,32 75,28 C100,25 125,18 150,20 C175,22 200,10 225,8 C250,7 275,15 300,5" fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" />
                  {/* Points */}
                  {[[75, 28], [150, 20], [225, 8]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="2" fill="#2dd4bf" />
                  ))}
                </svg>
              </div>

              {/* Checklist */}
              <div className="rounded-xl p-2.5 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[9px] font-bold text-white/60">Verification checklist</div>
                  <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">ALL COMPLETE</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {['Resume', 'Police', 'Aadhaar', 'Degree'].map((item) => (
                    <div key={item} className="flex flex-col items-center gap-1 py-1.5 rounded-md" style={{ background: 'rgba(16,185,129,0.05)' }}>
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      <span className="text-[7px] font-semibold text-white/50">{item}</span>
                      <span className="text-[6px] text-emerald-400/70">Verified</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Rotating VERIFYING NOW tag ───────────────────────────────────── */
function RotatingTag() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % rotatingTags.length)
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-bold tracking-[0.2em] text-white/50 uppercase">Verifying Now</span>
      </div>
      <div className="relative h-6 min-w-[180px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center"
          >
            <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-indigo-300 border border-indigo-400/20" style={{ background: 'rgba(79,70,229,0.1)' }}>
              {rotatingTags[index]}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function Hero() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const orbY1 = useTransform(scrollYProgress, [0, 1], [0, 200])
  const orbY2 = useTransform(scrollYProgress, [0, 1], [0, -150])
  const orbY3 = useTransform(scrollYProgress, [0, 1], [0, 100])
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 60])

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">
      {/* Animated orbs with parallax */}
      <motion.div style={{ y: orbY1 }} className="orb w-[500px] h-[500px] bg-indigo-500/20 -top-40 -left-40" />
      <motion.div style={{ y: orbY2 }} className="orb w-[400px] h-[400px] bg-teal-500/15 -bottom-32 -right-32" />
      <motion.div style={{ y: orbY3 }} className="orb w-[300px] h-[300px] bg-indigo-500/10 top-1/3 right-1/4" />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgb(148,158,194) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <motion.div style={{ y: contentY }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
          {/* Left side */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[rgb(var(--text-secondary))] text-sm font-medium">
                AI-verified · Aadhaar-safe · <strong className="text-[rgb(var(--text-primary))]">One link, every employer</strong>
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] mb-6 text-[rgb(var(--text-primary))]"
            >
              The Credential
              <span className="block italic font-normal my-1" style={{ fontFamily: 'var(--font-serif), "Instrument Serif", serif', background: 'linear-gradient(135deg, #a5b4fc 0%, #6ee7d7 60%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Trust Layer
              </span>
              <span className="block text-[rgb(var(--text-secondary))] text-[0.5em] font-semibold mt-2 leading-snug">
                for students, universities &amp; companies.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-base sm:text-lg max-w-lg mb-8 leading-relaxed"
              style={{ color: 'rgba(240,243,255,0.8)' }}
            >
              One AI-verified profile. Every document — resume, degree, police clearance, Aadhaar — cross-checked in seconds. Hire, admit, and apply with zero doubt.
            </motion.p>

            {/* CTA + Rotating tag */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-10"
            >
              <MagneticButton strength={0.25}>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white text-base font-semibold group transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
                  style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)' }}
                >
                  Verify a profile
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </MagneticButton>
              <RotatingTag />
            </motion.div>

            {/* Feature bullets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex flex-wrap gap-x-6 gap-y-3"
            >
              {[
                { icon: Cpu, text: 'AI-powered document extraction' },
                { icon: Shield, text: 'Only last-4 of Aadhaar stored' },
                { icon: Link2, text: 'One shareable QR + link' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-2 text-xs" style={{ color: 'rgba(240,243,255,0.7)' }}>
                  <f.icon size={13} className="text-indigo-400" />
                  <span className="font-medium">{f.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right side — Dashboard mockup */}
          <div className="flex justify-center lg:justify-end">
            <DashboardMockup />
          </div>
        </div>
      </motion.div>
    </section>
  )
}

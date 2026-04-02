'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Bot, ShieldCheck, Link2, Layers, FileSearch,
  Cpu, ScanLine, UserCheck, ArrowRight, Sparkles,
  FileText, CreditCard, GraduationCap, BadgeCheck,
  Star, Lock,
} from 'lucide-react'

/* ── Feature cards ─────────────────────────────────────────────────── */
const features = [
  {
    icon: Bot,
    tag: 'Gemini AI',
    title: 'AI Document Intelligence',
    description:
      'Our AI engine reads every document you upload — extracting skills, CGPA, graduation year, and role history automatically. Real-time cross-validation flags inconsistencies before they reach any employer.',
    bullets: [
      { icon: FileSearch, text: 'OCR-based data extraction from PDFs & images' },
      { icon: Cpu,        text: 'Cross-validation across all uploaded documents' },
      { icon: ScanLine,   text: 'Fraud detection with 99.2% precision rate' },
    ],
    accent: 'blue',
  },
  {
    icon: Layers,
    tag: 'Multi-Layer',
    title: 'All-in-One Verification Stack',
    description:
      'Police verification, Aadhaar KYC, degree certificate, and AI-scored resume — bundled into one unified credential profile. No more chasing documents across different authorities or portals.',
    bullets: [
      { icon: CreditCard,    text: 'Aadhaar-based identity confirmation (KYC)' },
      { icon: ShieldCheck,   text: 'Police clearance certificate validation' },
      { icon: GraduationCap, text: 'Degree & transcript authenticity check' },
    ],
    accent: 'emerald',
  },
  {
    icon: Cpu,
    tag: 'Industry Standard',
    title: 'ATS Score Engine',
    description:
      'Every profile receives an ATS score computed against real hiring benchmarks and job market data. Companies compare candidates instantly — no subjectivity, no guesswork.',
    bullets: [
      { icon: FileText,  text: 'Scored against real job description patterns' },
      { icon: Sparkles,  text: 'Skill gap analysis with actionable suggestions' },
      { icon: UserCheck, text: 'Percentile ranking across all verified profiles' },
    ],
    accent: 'violet',
  },
  {
    icon: Link2,
    tag: 'Zero Friction',
    title: 'Verified Profile, One Link',
    description:
      'Once verified, your entire credential profile lives at a single secure link. Share it in any job application or email — employers see everything they need, no login required.',
    bullets: [
      { icon: BadgeCheck, text: 'Tamper-proof, cryptographically signed data' },
      { icon: Lock,       text: 'Employer access without any account creation' },
      { icon: Link2,      text: 'Revoke or update access anytime from dashboard' },
    ],
    accent: 'teal',
  },
]

/* ── Verification flow ────────────────────────────────────────────── */
const steps = [
  { icon: FileText,   label: 'Upload Docs',    sub: 'Resume · Aadhaar · Degree',   accent: 'blue' },
  { icon: Bot,        label: 'AI Analyzes',    sub: 'Cross-validates in seconds',   accent: 'violet' },
  { icon: BadgeCheck, label: 'Get Verified',   sub: 'Tamper-proof certificate',     accent: 'emerald' },
  { icon: Link2,      label: 'Share Profile',  sub: 'One link · Every employer',    accent: 'teal' },
]

/* ── Colour maps ──────────────────────────────────────────────────── */
const C = {
  blue: {
    icon: 'text-blue-400',
    titleHex: '#60a5fa',
    bg:   'bg-blue-400/10',
    border: 'border-blue-400/25',
    hover: 'hover:border-blue-500/50',
    tag: 'text-blue-400 bg-blue-400/10 border-blue-400/25',
    glow: 'from-blue-500/10 via-blue-400/5',
    shadow: 'group-hover:shadow-blue-500/10',
  },
  emerald: {
    icon: 'text-emerald-400',
    titleHex: '#34d399',
    bg:   'bg-emerald-400/10',
    border: 'border-emerald-400/25',
    hover: 'hover:border-emerald-500/50',
    tag: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
    glow: 'from-emerald-500/10 via-emerald-400/5',
    shadow: 'group-hover:shadow-emerald-500/10',
  },
  violet: {
    icon: 'text-violet-400',
    titleHex: '#a78bfa',
    bg:   'bg-violet-400/10',
    border: 'border-violet-400/25',
    hover: 'hover:border-violet-500/50',
    tag: 'text-violet-400 bg-violet-400/10 border-violet-400/25',
    glow: 'from-violet-500/10 via-violet-400/5',
    shadow: 'group-hover:shadow-violet-500/10',
  },
  teal: {
    icon: 'text-teal-400',
    titleHex: '#2dd4bf',
    bg:   'bg-teal-400/10',
    border: 'border-teal-400/25',
    hover: 'hover:border-teal-500/50',
    tag: 'text-teal-400 bg-teal-400/10 border-teal-400/25',
    glow: 'from-teal-500/10 via-teal-400/5',
    shadow: 'group-hover:shadow-teal-500/10',
  },
} as const

/* ── Component ────────────────────────────────────────────────────── */
export default function PlatformFeatures() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <section ref={ref} className="py-20 relative overflow-hidden">
      {/* Ambient BG wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgb(var(--accent))]/[0.025] to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Section heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                           bg-[rgb(var(--accent))]/10 border border-[rgb(var(--accent))]/20
                           text-[rgb(var(--accent))] text-xs font-semibold mb-5">
            <Sparkles size={11} className="animate-pulse" />
            What Powers Credentia
          </span>

          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold
                         text-[rgb(var(--text-primary))] mb-4 leading-tight">
            Not Just a Platform —{' '}
            <span className="gradient-text block sm:inline">A Verification Engine</span>
          </h2>

          <p className="text-sm sm:text-base max-w-xl mx-auto leading-relaxed"
             style={{ color: 'rgba(180,195,230,0.85)' }}>
            Credentia combines <span style={{ color: '#60a5fa', fontWeight: 600 }}>AI document intelligence</span>,{' '}
            <span style={{ color: '#34d399', fontWeight: 600 }}>government-grade KYC</span>, and a{' '}
            <span style={{ color: '#2dd4bf', fontWeight: 600 }}>universal profile link</span>{' '}
            — making credential fraud a thing of the past for students and companies alike.
          </p>
        </motion.div>

        {/* ── Feature cards 2×2 grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-8">
          {features.map((feat, i) => {
            const c = C[feat.accent as keyof typeof C]
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                onHoverStart={() => setHovered(i)}
                onHoverEnd={() => setHovered(null)}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className={`glass rounded-2xl p-6 relative overflow-hidden group
                            border border-[rgb(var(--border-default))]/40 ${c.hover}
                            transition-all duration-300 shadow-xl ${c.shadow}`}
              >
                {/* Hover gradient wash */}
                <motion.div
                  animate={{ opacity: hovered === i ? 1 : 0 }}
                  transition={{ duration: 0.35 }}
                  className={`absolute inset-0 bg-gradient-to-br ${c.glow} to-transparent
                              pointer-events-none rounded-2xl`}
                />

                {/* Top: icon + tag */}
                <div className="relative flex items-start justify-between mb-5">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -6 }}
                    transition={{ type: 'spring', stiffness: 280 }}
                    className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border}
                                flex items-center justify-center flex-shrink-0`}
                  >
                    <feat.icon size={20} className={c.icon} />
                  </motion.div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.tag}`}>
                    {feat.tag}
                  </span>
                </div>

                {/* Title + description */}
                <div className="relative mb-5">
                  <h3
                    className="font-heading font-bold text-base sm:text-lg mb-2 leading-snug"
                    style={{ color: c.titleHex }}
                  >
                    {feat.title}
                  </h3>
                  <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                {/* Bullet points */}
                <ul className="relative space-y-2.5">
                  {feat.bullets.map((b, j) => (
                    <motion.li
                      key={j}
                      initial={{ opacity: 0, x: -10 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: 0.3 + i * 0.09 + j * 0.06 }}
                      className="flex items-center gap-2.5"
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center
                                      flex-shrink-0 ${c.bg} border ${c.border}`}>
                        <b.icon size={11} className={c.icon} />
                      </div>
                      <span className="text-xs text-[rgb(var(--text-muted))] font-medium leading-tight">
                        {b.text}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                {/* Bottom animated line accent */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={inView ? { scaleX: hovered === i ? 1 : 0.3 } : {}}
                  transition={{ duration: 0.4 }}
                  className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left
                              ${c.bg.replace('/10', '/60')}`}
                  style={{ background: `currentColor` }}
                />
              </motion.div>
            )
          })}
        </div>

        {/* ── Verification flow strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.48 }}
          className="glass rounded-2xl px-5 sm:px-8 py-6"
        >
          <p className="text-center text-[10px] font-bold uppercase tracking-widest
                        text-[rgb(var(--text-muted))] mb-6">
            Verification Flow — How it Works in 4 Steps
          </p>

          <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-3">
            {/* Connector line — desktop */}
            <div className="hidden sm:block absolute top-[22px] left-[13%] right-[13%] h-px
                            bg-gradient-to-r from-blue-400/30 via-violet-400/30 to-teal-400/30" />

            {steps.map((step, i) => {
              const c = C[step.accent as keyof typeof C]
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.56 + i * 0.1, type: 'spring', stiffness: 220 }}
                  className="flex flex-col items-center text-center relative z-10"
                >
                  {/* Step number badge */}
                  <div className="relative mb-3">
                    <motion.div
                      whileHover={{ scale: 1.15, y: -3 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className={`w-11 h-11 rounded-2xl ${c.bg} border ${c.border}
                                  flex items-center justify-center shadow-lg`}
                    >
                      <step.icon size={19} className={c.icon} />
                    </motion.div>
                    {/* Pulse ring on last step */}
                    {i === steps.length - 1 && (
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`absolute inset-0 rounded-2xl ${c.bg}`}
                      />
                    )}
                  </div>

                  <p className={`text-xs font-bold ${c.icon} mb-0.5`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-[rgb(var(--text-muted))] leading-snug max-w-[90px]">
                    {step.sub}
                  </p>

                  {/* Arrow between steps — mobile only */}
                  {i < steps.length - 1 && (
                    <ArrowRight
                      size={14}
                      className="sm:hidden mt-2 text-[rgb(var(--text-muted))]/40 rotate-90"
                    />
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>

      </div>
    </section>
  )
}

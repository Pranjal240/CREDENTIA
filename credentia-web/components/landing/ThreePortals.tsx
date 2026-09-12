'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { GraduationCap, Building2, Briefcase, ArrowRight, Check } from 'lucide-react'
import { Tilt } from '@/components/ui/tilt'

const portals = [
  {
    tag: 'STUDENT',
    icon: GraduationCap,
    title: 'Upload once.',
    subtitle: 'Verified forever.',
    description:
      'Groq AI reads every document, scores your resume against real ATS benchmarks, and mints a tamper-proof profile link.',
    bullets: [
      'ATS score 0–100 in 12 seconds',
      'Shareable QR + credentiaonline.in/verify/id',
      'Aadhaar last-4 stored · full number never touched',
    ],
    color: { icon: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-400/25', accent: '#818cf8' },
  },
  {
    tag: 'UNIVERSITY',
    icon: Building2,
    title: 'Push records.',
    subtitle: 'Own the truth.',
    description:
      'Your registrar syncs CGPAs, degrees and enrolment data straight into student profiles — no forged certificates possible.',
    bullets: [
      'ERP push API + bulk CSV importer',
      'Student registry & placement stats',
      'Verification-completion analytics',
    ],
    color: { icon: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-400/25', accent: '#2dd4bf' },
  },
  {
    tag: 'COMPANY',
    icon: Briefcase,
    title: 'Filter, match,',
    subtitle: 'hire with proof.',
    description:
      'Search verified talent by ATS, CGPA, university and police-clearance. Paste a JD — AI ranks candidates for you.',
    bullets: [
      'Multi-filter talent search',
      'AI job-description matching',
      'Saved candidates + analytics',
    ],
    color: { icon: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-400/25', accent: '#a78bfa' },
  },
]

export default function ThreePortals() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.05 })

  return (
    <section id="portals" ref={ref} className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[10px] font-bold tracking-[0.25em] text-indigo-400 uppercase mb-4 inline-block">
            Three Portals · One Trust Layer
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.02em] text-[rgb(var(--text-primary))] mb-5 leading-tight">
            The link between students,
            <br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              universities &amp; companies
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(240,243,255,0.78)' }}>
            Every side of hiring lives on Credentia. No emails. No PDFs. No fake certificates.
          </p>
        </motion.div>

        {/* Portal cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {portals.map((portal, i) => (
            <motion.div
              key={portal.tag}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.12 }}
            >
            <Tilt rotationFactor={8} springOptions={{ damping: 18, stiffness: 160, mass: 0.5 }} className="h-full">
            <div
              className={`relative rounded-2xl p-6 border ${portal.color.border} overflow-hidden group h-full`}
              style={{
                background: 'linear-gradient(180deg, rgba(20,24,55,0.6) 0%, rgba(14,17,40,0.75) 100%)',
                backdropFilter: 'blur(12px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)',
                transition: 'box-shadow 240ms cubic-bezier(0.22,1,0.36,1), border-color 240ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.14), 0 2px 4px rgba(0,0,0,0.4), 0 20px 50px -12px ${portal.color.accent}66`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)'
              }}
            >
              {/* Glow */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-2xl"
                style={{ background: portal.color.accent }}
              />

              {/* Tag */}
              <div className="relative flex items-center justify-between mb-6">
                <span className={`text-[9px] font-bold tracking-[0.2em] ${portal.color.icon} uppercase`}>
                  {portal.tag}
                </span>
                <div className={`w-10 h-10 rounded-xl ${portal.color.bg} border ${portal.color.border} flex items-center justify-center`}>
                  <portal.icon size={18} className={portal.color.icon} />
                </div>
              </div>

              {/* Title */}
              <h3 className="font-display text-2xl font-extrabold text-[rgb(var(--text-primary))] mb-1 leading-tight tracking-[-0.02em]">
                {portal.title}
              </h3>
              <h3 className="font-heading text-2xl font-extrabold mb-4 leading-tight" style={{ color: portal.color.accent }}>
                {portal.subtitle}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(240,243,255,0.72)' }}>
                {portal.description}
              </p>

              {/* Bullets */}
              <ul className="space-y-2.5">
                {portal.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-xs" style={{ color: 'rgba(240,243,255,0.65)' }}>
                    <Check size={14} className={`${portal.color.icon} flex-shrink-0 mt-0.5`} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* Bottom line accent */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 opacity-40 group-hover:opacity-100 transition-opacity`} style={{ background: portal.color.accent }} />
            </div>
            </Tilt>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

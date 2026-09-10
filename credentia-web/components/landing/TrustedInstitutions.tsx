'use client'

import { motion } from 'framer-motion'

const institutions = [
  'IIT Delhi', 'IIT Bombay', 'IIM Ahmedabad', 'NIT Trichy', 'BITS Pilani',
  'IISc Bangalore', 'Delhi University', 'JNU', 'IIIT Hyderabad', 'VIT Vellore',
]

const rotatingTags = [
  'Any university', 'Any recruiter', 'Any degree', 'Any certificate',
  'Any employer', 'Any student', 'Every campus in India', 'Any diploma',
]

export default function TrustedInstitutions() {
  return (
    <section className="py-16 relative overflow-hidden border-y border-white/[0.04]">
      {/* Top label */}
      <div className="text-center mb-8">
        <span className="text-[10px] font-bold tracking-[0.25em] text-[rgb(var(--text-muted))] uppercase">
          Trusted at India&apos;s Leading Institutions
        </span>
      </div>

      {/* Institution marquee */}
      <div className="relative overflow-hidden mb-10">
        <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, rgb(var(--bg-base)), transparent)' }} />
        <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, rgb(var(--bg-base)), transparent)' }} />
        <motion.div
          className="flex gap-12 whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        >
          {[...institutions, ...institutions].map((inst, i) => (
            <span key={i} className="text-lg sm:text-xl font-heading font-bold text-white/25 hover:text-white/50 transition-colors">
              {inst}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Sub-label */}
      <div className="text-center mb-6">
        <span className="text-[10px] font-bold tracking-[0.25em] text-[rgb(var(--text-muted))] uppercase">
          Works for Every Student, From Any Institution
        </span>
      </div>

      {/* Tags marquee (reverse direction) */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, rgb(var(--bg-base)), transparent)' }} />
        <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, rgb(var(--bg-base)), transparent)' }} />
        <motion.div
          className="flex gap-4 whitespace-nowrap"
          animate={{ x: ['-50%', '0%'] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        >
          {[...rotatingTags, ...rotatingTags, ...rotatingTags].map((tag, i) => (
            <span
              key={i}
              className="px-4 py-2 rounded-full text-sm font-medium text-[rgb(var(--text-secondary))] border border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              {tag}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

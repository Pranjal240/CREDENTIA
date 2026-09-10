'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, ShieldCheck, Fingerprint, Award } from 'lucide-react'

export default function CTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden border border-white/[0.08] p-10 sm:p-14 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(45,212,191,0.08), rgba(79,70,229,0.15))' }}
        >
          {/* Glow orbs */}
          <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full opacity-30 blur-3xl" style={{ background: '#4F46E5' }} />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full opacity-30 blur-3xl" style={{ background: '#2dd4bf' }} />

          <div className="relative z-10">
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[rgb(var(--text-primary))] mb-4 leading-tight">
              Ship your verified{' '}
              <span style={{ background: 'linear-gradient(135deg, #818cf8, #2dd4bf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                profile today
              </span>
            </h2>
            <p className="text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: 'rgba(240,243,255,0.85)' }}>
              Free forever for students. Universities &amp; companies onboard in under 24 hours.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white text-base font-semibold group transition-all hover:-translate-y-0.5 shadow-xl shadow-indigo-500/30"
                style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)' }}
              >
                Get verified free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register?role=university"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold border transition-all hover:-translate-y-0.5"
                style={{
                  color: '#f0f3ff',
                  borderColor: 'rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.03)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(129,140,248,0.5)'
                  e.currentTarget.style.background = 'rgba(129,140,248,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
              >
                Book university demo
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-[rgb(var(--text-muted))]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span className="font-medium">No credit card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Fingerprint size={13} className="text-indigo-400" />
                <span className="font-medium">Aadhaar-safe (last 4 only)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award size={13} className="text-teal-400" />
                <span className="font-medium">SOC 2 in progress</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

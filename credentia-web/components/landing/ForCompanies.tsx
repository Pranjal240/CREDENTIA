'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Search, Filter, Shield, GraduationCap, CreditCard, TrendingUp, Star } from 'lucide-react'

export default function ForCompanies() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [hoveredBadge, setHoveredBadge] = useState<number | null>(null)

  const benefits = [
    'Filter candidates by ATS score, CGPA, and police verification status',
    'View AI-verified credentials — no manual background checks',
    'Access verified profiles with a single shareable link',
    'Reduce hiring fraud by 95% with AI-powered document analysis',
    'Seamless integration with your existing hiring workflow',
  ]

  const badges = [
    { label: 'Police ✅', icon: Shield,        color: 'emerald', active: true },
    { label: 'Aadhaar ✅', icon: CreditCard,   color: 'teal',    active: true },
    { label: 'Degree ✅',  icon: GraduationCap, color: 'blue',    active: true },
    { label: 'CGPA: 9.2', icon: Star,          color: 'indigo',  active: true },
  ]

  return (
    <section id="for-companies" ref={ref} className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left — benefits */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgb(var(--teal))]/10 text-[rgb(var(--teal))] text-xs font-semibold mb-4">
              <Search size={12} /> FOR COMPANIES
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[rgb(var(--text-primary))] mb-6 leading-tight">
              Hire Faster.{' '}
              <span className="gradient-text">Trust More.</span>
            </h2>
            <div className="space-y-4 mb-8">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 size={18} className="text-[rgb(var(--success))] flex-shrink-0 mt-0.5" />
                  <span className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed">{b}</span>
                </motion.div>
              ))}
            </div>
            <Link href="/register" className="btn-primary px-6 py-3 text-sm inline-flex items-center gap-2 group">
              Start Hiring Smarter
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Right — animated mockup card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Background glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/10 via-teal-500/5 to-indigo-500/10 blur-2xl -z-10 scale-110" />

            <div className="glass rounded-2xl p-6 glow-card relative overflow-hidden">
              {/* Subtle animated bg orb */}
              <motion.div
                animate={{ x: [0, 10, 0], y: [0, -8, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 blur-3xl rounded-full pointer-events-none"
              />

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-between mb-5"
              >
                <h4 className="font-heading font-bold text-[rgb(var(--text-primary))]">Candidate Profile</h4>
                <motion.div whileHover={{ rotate: 15 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Filter size={16} className="text-[rgb(var(--text-muted))]" />
                </motion.div>
              </motion.div>

              {/* Identity */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4 mb-5"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25 flex-shrink-0"
                >
                  R
                </motion.div>
                <div>
                  <p className="font-heading font-bold text-[rgb(var(--text-primary))]">Rahul Sharma</p>
                  <p className="text-[rgb(var(--text-muted))] text-sm">B.Tech CSE — IIT Delhi — 2024</p>
                </div>
              </motion.div>

              {/* ATS score ring — animated */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                className="flex items-center gap-6 mb-5 p-4 rounded-xl bg-[rgb(var(--bg-base))]/50 border border-[rgb(var(--border-default))]/30 relative overflow-hidden"
              >
                <motion.div
                  animate={{ boxShadow: ['0 0 0px rgba(6,182,212,0)', '0 0 20px rgba(6,182,212,0.3)', '0 0 0px rgba(6,182,212,0)'] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  className="relative w-16 h-16 flex-shrink-0"
                >
                  <svg className="score-ring w-16 h-16">
                    <circle cx="32" cy="32" r="28" stroke="rgba(var(--border-default),0.3)" strokeWidth="4" fill="none" />
                    <motion.circle
                      cx="32" cy="32" r="28"
                      stroke="rgb(var(--accent))" strokeWidth="4" fill="none"
                      strokeLinecap="round"
                      strokeDasharray="176"
                      initial={{ strokeDashoffset: 176 }}
                      animate={inView ? { strokeDashoffset: 18 } : { strokeDashoffset: 176 }}
                      transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                    />
                  </svg>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: 1.2 }}
                    className="absolute inset-0 flex items-center justify-center font-heading font-bold text-[rgb(var(--accent))] text-sm"
                  >
                    90
                  </motion.span>
                </motion.div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[rgb(var(--text-primary))] font-semibold text-sm">ATS Score</p>
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20"
                    >
                      <TrendingUp size={8} /> Top 5%
                    </motion.span>
                  </div>
                  <p className="text-[rgb(var(--text-muted))] text-xs">of all candidates</p>
                </div>
              </motion.div>

              {/* Badges — staggered animated */}
              <div className="flex flex-wrap gap-2">
                {badges.map((b, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8, y: 8 }}
                    animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
                    transition={{ delay: 0.85 + i * 0.1, type: 'spring', stiffness: 250 }}
                    whileHover={{ scale: 1.06, y: -2 }}
                    onHoverStart={() => setHoveredBadge(i)}
                    onHoverEnd={() => setHoveredBadge(null)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium cursor-default transition-colors flex items-center gap-1.5
                      bg-[rgb(var(--success))]/10 text-[rgb(var(--success))] border border-[rgb(var(--success))]/20
                      ${hoveredBadge === i ? 'shadow-lg shadow-emerald-500/20' : ''}`}
                  >
                    <b.icon size={11} />
                    {b.label}
                  </motion.span>
                ))}
              </div>

              {/* Bottom live indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 1.3 }}
                className="mt-5 pt-4 border-t border-[rgb(var(--border-default))]/30 flex items-center gap-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span className="text-[10px] font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">
                  Profile verified &amp; publicly accessible
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

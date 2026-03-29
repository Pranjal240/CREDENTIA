'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Search, Filter, Shield } from 'lucide-react'

export default function ForCompanies() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  const benefits = [
    'Filter candidates by ATS score, CGPA, and police verification status',
    'View AI-verified credentials — no manual background checks',
    'Access verified profiles with a single shareable link',
    'Reduce hiring fraud by 95% with AI-powered document analysis',
    'Seamless integration with your existing hiring workflow',
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

          {/* Right — mockup card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="glass rounded-2xl p-6 glow-card">
              <div className="flex items-center justify-between mb-5">
                <h4 className="font-heading font-bold text-[rgb(var(--text-primary))]">Candidate Profile</h4>
                <Filter size={16} className="text-[rgb(var(--text-muted))]" />
              </div>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">R</div>
                <div>
                  <p className="font-heading font-bold text-[rgb(var(--text-primary))]">Rahul Sharma</p>
                  <p className="text-[rgb(var(--text-muted))] text-sm">B.Tech CSE — IIT Delhi — 2024</p>
                </div>
              </div>
              {/* ATS score ring */}
              <div className="flex items-center gap-6 mb-5 p-4 rounded-xl bg-[rgb(var(--bg-base))]/50">
                <div className="relative w-16 h-16">
                  <svg className="score-ring w-16 h-16">
                    <circle cx="32" cy="32" r="28" stroke="rgba(var(--border-default),0.3)" strokeWidth="4" fill="none" />
                    <circle cx="32" cy="32" r="28" stroke="rgb(var(--accent))" strokeWidth="4" fill="none" strokeDasharray="176" strokeDashoffset="18" strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-heading font-bold text-[rgb(var(--accent))] text-sm">90</span>
                </div>
                <div>
                  <p className="text-[rgb(var(--text-primary))] font-semibold text-sm">ATS Score</p>
                  <p className="text-[rgb(var(--text-muted))] text-xs">Top 5% of candidates</p>
                </div>
              </div>
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Police ✅', active: true },
                  { label: 'Aadhaar ✅', active: true },
                  { label: 'Degree ✅', active: true },
                  { label: 'CGPA: 9.2', active: true },
                ].map((b, i) => (
                  <span key={i} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${b.active ? 'bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]' : 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text-muted))]'}`}>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

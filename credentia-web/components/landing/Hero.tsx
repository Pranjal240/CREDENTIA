'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated orbs */}
      <div className="orb w-[500px] h-[500px] bg-blue-500/30 -top-40 -left-40" style={{ animationDelay: '0s' }} />
      <div className="orb w-[400px] h-[400px] bg-teal-500/20 -bottom-32 -right-32" style={{ animationDelay: '4s', animationDuration: '15s' }} />
      <div className="orb w-[300px] h-[300px] bg-indigo-500/15 top-1/3 right-1/4" style={{ animationDelay: '8s', animationDuration: '18s' }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, rgb(var(--accent)) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgb(var(--accent))]/10 border border-[rgb(var(--accent))]/20 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-[rgb(var(--success))] animate-pulse" />
          <span className="text-[rgb(var(--accent))] text-sm font-medium">India&apos;s #1 Credential Verification Platform</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="font-heading text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-6"
        >
          Verify Once.{' '}
          <span className="gradient-text-hero">Trusted Forever.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-lg sm:text-xl text-[rgb(var(--text-secondary))] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Upload your resume, police certificate, and Aadhaar — get AI-verified in minutes. Share one link with every company you apply to.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <Link href="/register" className="btn-primary px-8 py-3.5 text-base flex items-center gap-2 group">
            Start Verifying Free
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#how-it-works" className="btn-secondary px-8 py-3.5 text-base">
            See How It Works
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="flex items-center justify-center mb-10"
        >
          <div className="px-5 py-2.5 rounded-full border border-[rgb(var(--border-default))] glass flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[rgb(var(--success))] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[rgb(var(--success))]"></span>
            </span>
            <span className="text-[rgb(var(--text-secondary))] text-sm font-medium">
              Join <strong className="text-[rgb(var(--text-primary))]">50,000+</strong> students already verified
            </span>
          </div>
        </motion.div>

        {/* Floating verification badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { label: 'Resume Verified — 94/100', color: 'blue' },
            { label: 'Police Verified — Delhi', color: 'emerald' },
            { label: 'Aadhaar Verified', color: 'teal' },
          ].map((badge, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-medium text-[rgb(var(--text-primary))]`}
            >
              <Shield size={14} className={`text-${badge.color}-400`} />
              {badge.label}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

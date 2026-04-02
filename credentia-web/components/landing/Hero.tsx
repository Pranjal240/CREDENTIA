'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, ArrowRight, Zap, Lock, Share2, Bot } from 'lucide-react'

const trustPills = [
  { icon: Bot,    label: 'AI-Powered Verification',  color: 'blue',    delay: 0 },
  { icon: Lock,   label: 'Tamper-Proof Credentials', color: 'emerald', delay: 0.5 },
  { icon: Share2, label: 'One Link, Every Company',  color: 'teal',    delay: 1 },
  { icon: Zap,    label: 'Verified in Minutes',       color: 'indigo',  delay: 1.5 },
]

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

        {/* Platform trust bar — 3 real platform pillars, no fake numbers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-10"
        >
          {[
            { dot: 'bg-blue-400',    text: 'Gemini AI Document Analysis' },
            { dot: 'bg-emerald-400', text: 'Government-Grade KYC Verification' },
            { dot: 'bg-teal-400',    text: 'Fraud-Proof Credential Certificate' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.65 + i * 0.08 }}
              className="px-4 py-2 rounded-full border border-[rgb(var(--border-default))] glass flex items-center gap-2"
            >
              <span className={`w-2 h-2 rounded-full ${item.dot} flex-shrink-0`} />
              <span className="text-[rgb(var(--text-secondary))] text-xs sm:text-sm font-medium whitespace-nowrap">
                {item.text}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Feature Pills — themed, no fake data */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {trustPills.map((pill, i) => (
            /* Outer: staged entry — slides up + fades in + spring scale */
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.55,
                delay: 0.85 + i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Inner: perpetual gentle float — completely separate from entry */}
              <motion.div
                animate={{ y: [0, -7, 0] }}
                transition={{
                  duration: 3.5 + i * 0.5,
                  delay: 1.5 + i * 0.25,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                whileHover={{ scale: 1.06, transition: { duration: 0.18 } }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-sm font-medium
                           text-[rgb(var(--text-primary))] border border-${pill.color}-400/20
                           bg-${pill.color}-400/5 hover:bg-${pill.color}-400/15
                           cursor-default transition-colors duration-200`}
              >
                <pill.icon size={14} className={`text-${pill.color}-400`} />
                {pill.label}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

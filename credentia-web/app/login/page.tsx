'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { GraduationCap, Building2, Briefcase, ShieldAlert, ArrowRight, ArrowLeft } from 'lucide-react'
import { PORTAL_META } from '@/lib/auth/portalMeta'
import type { Portal } from '@/lib/auth/portalMeta'

// Icon map for the portal cards
const PortalIcon: Record<string, React.FC<{ size: number; className?: string }>> = {
  graduation: ({ size, className }) => <GraduationCap size={size} className={className} />,
  building:   ({ size, className }) => <Building2 size={size} className={className} />,
  briefcase:  ({ size, className }) => <Briefcase size={size} className={className} />,
  shield:     ({ size, className }) => <ShieldAlert size={size} className={className} />,
}

// Only show 3 public portals on the selection page — admin is hidden
const PUBLIC_PORTALS: Portal[] = ['student', 'university', 'company']

export default function PortalSelectionPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#080a19' }}
    >
      {/* Ambient blobs */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/[0.06] blur-[140px] -top-40 -right-40 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-teal-500/[0.05] blur-[120px] -bottom-32 -left-32 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Logo + heading */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="relative w-10 h-10 rounded-full overflow-hidden" style={{ boxShadow: '0 0 0 2px rgba(99,102,241,0.3)' }}>
              <Image src="/logo.png" alt="CREDENTIA" fill className="object-contain p-0.5" />
            </div>
            <span className="font-heading text-xl font-bold text-white tracking-wide">CREDENTIA</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-white mb-3">
            Choose Your Portal
          </h1>
          <p className="text-sm md:text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Select your role to sign in or create an account
          </p>
        </div>

        {/* Portal cards — 3 public portals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {PUBLIC_PORTALS.map((portalKey, i) => {
            const meta = PORTAL_META[portalKey]
            const IconComp = PortalIcon[meta.icon]
            return (
              <motion.div
                key={portalKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 * i, ease: [0.4, 0, 0.2, 1] }}
              >
                <Link
                  href={`/login/${portalKey}`}
                  className="group block rounded-2xl p-6 transition-all duration-300 hover:translate-y-[-2px]"
                  style={{
                    background: meta.gradient,
                    border: `1px solid ${meta.border}`,
                    boxShadow: `0 0 40px rgba(${meta.accentRgb}, 0.04)`,
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `rgba(${meta.accentRgb}, 0.15)`,
                      border: `1px solid rgba(${meta.accentRgb}, 0.25)`,
                    }}
                  >
                    <IconComp size={22} className="transition-colors" />
                  </div>

                  {/* Label */}
                  <h2 className="font-heading text-lg font-bold text-white mb-1.5">{meta.label}</h2>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {meta.subtext}
                  </p>

                  {/* CTA */}
                  <div
                    className="flex items-center gap-1.5 text-xs font-semibold transition-all group-hover:gap-2.5"
                    style={{ color: meta.accent }}
                  >
                    <span>Get Started</span>
                    <ArrowRight size={14} />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Admin portal — subtle, separate */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="text-center"
        >
          <Link
            href="/login/admin"
            className="inline-flex items-center gap-2 text-xs transition-colors hover:underline"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <ShieldAlert size={12} />
            <span>Admin Access</span>
          </Link>
        </motion.div>

        {/* Back to site */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            <ArrowLeft size={14} />
            Back to Credentia
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

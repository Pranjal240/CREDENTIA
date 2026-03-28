'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const badges = [
  '✅ Resume Verified — 94/100',
  '✅ Police Verified — Delhi',
  '✅ Aadhaar Verified',
]

const avatarColors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500']

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient orbs */}
      <div className="orb w-[600px] h-[600px] bg-purple-600/20 top-10 -left-20 animate-float-1" />
      <div className="orb w-[400px] h-[400px] bg-[#F5C542]/10 bottom-20 -right-20 animate-float-2" />
      <div className="orb w-[300px] h-[300px] bg-blue-600/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />

      <div className="relative z-10 max-w-4xl mx-auto text-center px-4 pt-24 pb-16">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#F5C542]/30 text-[#F5C542] text-sm px-4 py-1.5 mb-6"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          🇮🇳 India&apos;s #1 Credential Platform
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="font-syne font-extrabold text-5xl sm:text-6xl md:text-7xl leading-tight mb-6"
        >
          <span className="dark:text-white text-gray-900">Verify Once.</span>
          <br />
          <span className="text-[#F5C542]">Trusted Forever.</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-lg sm:text-xl text-[#9999AA] max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          Upload your resume, police certificate, and Aadhaar — get AI-verified in minutes.
          Share one link with every company you apply to.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
        >
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-xl bg-[#F5C542] text-black font-semibold text-lg hover:bg-[#D4A017] hover:scale-105 transition-all shadow-lg shadow-[#F5C542]/20"
          >
            Start Verifying Free →
          </Link>
          <Link
            href="#how-it-works"
            className="px-8 py-3.5 rounded-xl border border-[#F5C542]/50 text-[#F5C542] font-medium text-lg hover:bg-[#F5C542]/10 transition-all"
          >
            See How It Works
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center justify-center gap-3 mb-14"
        >
          <div className="flex -space-x-2">
            {avatarColors.map((color, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full ${color} border-2 dark:border-[#0A0A0F] border-white flex items-center justify-center text-white text-xs font-bold`}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span className="text-sm dark:text-[#9999AA] text-gray-500">
            Join <strong className="dark:text-white text-gray-900">50,000+</strong> verified students
          </span>
        </motion.div>

        {/* Floating badge chips */}
        <div className="flex flex-wrap justify-center gap-4">
          {badges.map((badge, i) => (
            <motion.div
              key={badge}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: [0, -8, 0],
              }}
              transition={{
                opacity: { delay: 0.6 + i * 0.1, duration: 0.5 },
                y: {
                  delay: 0.6 + i * 0.1,
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatDelay: i * 0.3,
                },
              }}
              className="rounded-full dark:bg-[#13131A] bg-white border border-[#F5C542]/20 dark:text-white text-gray-800 text-sm px-5 py-2.5 shadow-lg dark:shadow-none font-medium"
            >
              {badge}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

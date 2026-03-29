'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#0A0A0F] overflow-hidden pt-16">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[#7C3AED]/20 blur-[120px] -top-40 -left-40 animate-[drift_10s_ease-in-out_infinite]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-[#F5C542]/10 blur-[100px] -bottom-40 -right-40 animate-[counterDrift_13s_ease-in-out_infinite]" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#2563EB]/15 blur-[80px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>

      <style jsx>{`
        @keyframes drift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(60px, 40px); } }
        @keyframes counterDrift { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-50px, -30px); } }
      `}</style>

      <div className="relative z-10 max-w-4xl mx-auto px-5 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#F5C542]/30 bg-[#F5C542]/5 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-[#F5C542]">🇮🇳 India&apos;s #1 Credential Platform</span>
        </motion.div>

        {/* H1 */}
        <h1 className="font-syne text-5xl md:text-7xl lg:text-[80px] font-extrabold leading-tight mb-6">
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="block text-white"
          >
            Verify Once.
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="block text-[#F5C542]"
          >
            Trusted Forever.
          </motion.span>
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-lg md:text-xl text-[#9999AA] max-w-2xl mx-auto mb-10"
        >
          Upload your resume, police certificate, and Aadhaar — get AI-verified in minutes. Share one link with every company you apply to.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Link
            href="/register"
            className="bg-[#F5C542] text-black font-bold h-14 px-8 rounded-xl hover:bg-[#D4A017] hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,197,66,0.3)] flex items-center gap-2 text-base"
          >
            Start Verifying Free →
          </Link>
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="border border-[#F5C542] text-[#F5C542] h-14 px-8 rounded-xl hover:bg-[#F5C542]/10 transition-all flex items-center gap-2 text-base"
          >
            See How It Works
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex items-center justify-center gap-3 mb-14"
        >
          <div className="flex -space-x-2">
            {['#EF4444', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6'].map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0A0F] flex items-center justify-center text-xs font-bold text-white" style={{ background: c }}>
                {['A', 'R', 'S', 'P', 'K'][i]}
              </div>
            ))}
          </div>
          <span className="text-sm text-[#9999AA]">Join <strong className="text-white">50,000+</strong> students already verified</span>
        </motion.div>

        {/* Floating verification badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {[
            '✅ Resume Verified — 94/100',
            '✅ Police Verified — Delhi',
            '✅ Aadhaar Verified',
          ].map((text, i) => (
            <div
              key={i}
              className="glass rounded-full px-5 py-2.5 border border-[#F5C542]/20 text-sm text-white animate-float"
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              {text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function CTA() {
  return (
    <section className="py-24 bg-gradient-to-b from-[#13131A] to-[#1C1C26] relative overflow-hidden">
      {/* Golden orb glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#F5C542]/5 blur-[120px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Floating golden particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#F5C542]/40 animate-float"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${4 + Math.random() * 4}s`,
          }}
        />
      ))}

      <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-syne text-4xl md:text-[52px] font-extrabold text-white mb-5 leading-tight"
        >
          Ready to Get Verified?
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-[#9999AA] text-lg mb-10 max-w-lg mx-auto"
        >
          Join 50,000+ students. Get your credentials verified today — free.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="bg-[#F5C542] text-black font-bold h-14 px-8 rounded-xl hover:bg-[#D4A017] hover:scale-105 transition-all shadow-[0_0_30px_rgba(245,197,66,0.3)] flex items-center gap-2"
          >
            Get Started Free →
          </Link>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="border border-[#F5C542]/50 text-[#F5C542] h-14 px-8 rounded-xl hover:bg-[#F5C542]/10 transition-all flex items-center gap-2"
          >
            See Demo
          </button>
        </motion.div>
      </div>
    </section>
  )
}

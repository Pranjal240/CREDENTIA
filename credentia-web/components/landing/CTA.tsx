'use client'

import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

export default function CTA() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="py-24 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-teal-600" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Floating dots */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
              className="absolute w-2 h-2 rounded-full bg-white/30"
              style={{ top: `${20 + Math.random() * 60}%`, left: `${10 + Math.random() * 80}%` }}
            />
          ))}

          <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20 text-center">
            <Sparkles size={32} className="text-white/80 mx-auto mb-4" />
            <h2 className="font-syne text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
              Ready to Transform Your Credentials?
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              Join thousands of students and companies who trust CREDENTIA for instant, AI-powered verification.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all text-base flex items-center gap-2 group shadow-lg">
                Get Started Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/login" className="text-white/90 font-medium px-8 py-3.5 rounded-xl border border-white/30 hover:bg-white/10 transition-all text-base">
                Sign In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'
import { UserPlus, Cpu, Share2 } from 'lucide-react'

const steps = [
  { num: 1, icon: UserPlus, title: 'Register & Upload', desc: 'Create your account in 30 seconds. Upload resume, police certificate, or paste a link.' },
  { num: 2, icon: Cpu, title: 'AI Verifies Everything', desc: 'Groq AI model (llama-3.3-70b) analyzes your documents instantly. Extracts data, checks authenticity, gives confidence scores.' },
  { num: 3, icon: Share2, title: 'Share Your Profile', desc: 'Get one verified link. Paste it on your resume, LinkedIn, emails. Every company trusts CREDENTIA.' },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-[#0A0A0F] to-[#13131A]">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#F5C542] text-sm font-semibold uppercase tracking-widest">How It Works</span>
          <h2 className="font-syne text-3xl md:text-5xl font-extrabold text-white mt-3">
            Three Steps to Total Trust
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-[#F5C542]/0 via-[#F5C542]/40 to-[#F5C542]/0" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="text-center relative"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F5C542] to-[#D4A017] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,197,66,0.3)] relative z-10">
                <span className="text-2xl font-extrabold text-black font-syne">{step.num}</span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#1C1C26] flex items-center justify-center mx-auto mb-4 border border-[#2A2A3A]">
                <step.icon size={20} className="text-[#F5C542]" />
              </div>
              <h3 className="font-syne text-xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-[#9999AA] text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

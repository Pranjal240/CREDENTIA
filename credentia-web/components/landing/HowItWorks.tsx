'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Upload, Cpu, Share2 } from 'lucide-react'

const steps = [
  { icon: Upload, num: '01', title: 'Upload Documents', desc: 'Upload your resume, police certificate, Aadhaar, or degree. Or just paste a link.' },
  { icon: Cpu, num: '02', title: 'AI Verifies Instantly', desc: 'Groq AI analyzes your documents in seconds. Get ATS scores, authenticity checks, and fraud detection.' },
  { icon: Share2, num: '03', title: 'Share One Link', desc: 'Get a verified profile link. Share it with any company — they see all your credentials in one place.' },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="how-it-works" ref={ref} className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgb(var(--accent))]/[0.02] to-transparent" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[rgb(var(--text-primary))] mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-[rgb(var(--text-secondary))] text-lg">Three simple steps to a verified professional profile</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-[rgb(var(--accent))]/20 via-[rgb(var(--accent))]/40 to-[rgb(var(--accent))]/20" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="text-center relative"
            >
              <div className="relative inline-flex mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgb(var(--accent))] to-[rgb(var(--teal))] flex items-center justify-center glow-blue">
                  <step.icon size={28} className="text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[rgb(var(--bg-base))] border-2 border-[rgb(var(--accent))] flex items-center justify-center text-[rgb(var(--accent))] text-xs font-bold">
                  {step.num.replace('0', '')}
                </span>
              </div>
              <h3 className="font-heading text-xl font-bold text-[rgb(var(--text-primary))] mb-2">{step.title}</h3>
              <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

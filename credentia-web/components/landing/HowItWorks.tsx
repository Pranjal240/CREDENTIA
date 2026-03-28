'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Upload, Bot, Share2 } from 'lucide-react'

const steps = [
  {
    number: '01',
    Icon: Upload,
    title: 'Register & Upload',
    desc: 'Create your account in 30 seconds. Upload your resume, police certificate, or paste a link.',
  },
  {
    number: '02',
    Icon: Bot,
    title: 'AI Verifies Everything',
    desc: 'Our Groq AI model analyzes your documents instantly — extracts data, checks authenticity, gives scores.',
  },
  {
    number: '03',
    Icon: Share2,
    title: 'Share Your Profile',
    desc: 'Get one verified link. Paste it everywhere — resume, LinkedIn, emails. Companies trust CREDENTIA.',
  },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 dark:bg-[#0D0D15] bg-[#F0F0F5]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="font-syne font-bold text-4xl sm:text-5xl dark:text-white text-gray-900 mb-4"
          >
            How CREDENTIA Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg dark:text-[#9999AA] text-gray-500"
          >
            3 simple steps to verified credibility
          </motion.p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Connecting line — desktop only */}
          <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-0.5 dark:bg-[#2A2A3A] bg-gray-200">
            <motion.div
              className="h-full bg-[#F5C542]"
              initial={{ width: '0%' }}
              animate={isInView ? { width: '100%' } : {}}
              transition={{ delay: 0.5, duration: 1.5, ease: 'easeOut' }}
            />
          </div>

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 * i, duration: 0.5 }}
              className="flex flex-col items-center text-center p-8 dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 relative"
            >
              {/* Number circle */}
              <div className="w-16 h-16 rounded-full bg-[#F5C542] flex items-center justify-center mb-6 relative z-10">
                <step.Icon className="w-7 h-7 text-black" />
              </div>
              <span className="text-sm font-bold text-[#F5C542] mb-2">STEP {step.number}</span>
              <h3 className="font-syne font-bold text-xl dark:text-white text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-sm dark:text-[#9999AA] text-gray-500 leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

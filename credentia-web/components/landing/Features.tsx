'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  Brain,
  Shield,
  Fingerprint,
  GraduationCap,
  Link2,
  Building2,
} from 'lucide-react'

const features = [
  {
    Icon: Brain,
    gradient: 'from-purple-600 to-blue-600',
    title: 'AI Resume Scoring',
    desc: 'Upload PDF or paste a link. Groq AI gives ATS score, finds missing keywords, and rates authenticity.',
  },
  {
    Icon: Shield,
    gradient: 'from-red-600 to-orange-500',
    title: 'Police Verification',
    desc: 'Upload certificate or paste a link. AI extracts and validates — no manual process needed.',
  },
  {
    Icon: Fingerprint,
    gradient: 'from-green-600 to-teal-500',
    title: 'Aadhaar Verified',
    desc: 'Upload Aadhaar front/back. Full number never stored — privacy-first approach.',
  },
  {
    Icon: GraduationCap,
    gradient: 'from-blue-600 to-indigo-600',
    title: 'University ERP',
    desc: 'Universities share academic records. Companies see university-verified CGPA and degrees.',
  },
  {
    Icon: Link2,
    gradient: 'from-yellow-500 to-orange-500',
    title: 'One Verified Link',
    desc: 'credentiaonline.in/verify/your-id — paste everywhere. Anyone can verify you instantly.',
  },
  {
    Icon: Building2,
    gradient: 'from-pink-600 to-purple-600',
    title: 'Smart Hiring Filters',
    desc: 'Companies filter by police status, verification score, ATS score, CGPA, and university.',
  },
]

export default function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="features" ref={ref} className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="text-[#F5C542] font-medium text-sm uppercase tracking-wider mb-4"
          >
            Platform Features
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-heading font-bold text-4xl sm:text-5xl dark:text-white text-gray-900 mb-4"
          >
            Everything You Need
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg dark:text-[#9999AA] text-gray-500"
          >
            One platform. All verifications. One shareable link.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              className="group dark:bg-[#13131A] bg-white rounded-2xl p-7 border dark:border-[#2A2A3A] border-gray-100 hover:scale-[1.03] hover:dark:border-[#F5C542]/50 hover:border-[#F5C542]/50 hover:shadow-[0_0_30px_rgba(245,197,66,0.1)] transition-all duration-200 cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5`}
              >
                <feature.Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg dark:text-white text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-sm dark:text-[#9999AA] text-gray-500 leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

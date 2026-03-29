'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { FileText, Shield, CreditCard, GraduationCap, Link2, BarChart3 } from 'lucide-react'

const features = [
  { icon: FileText, title: 'AI Resume Scoring', desc: 'Groq AI analyzes your PDF, gives ATS score 0-100, finds missing keywords and strengths.', gradient: 'from-blue-500 to-blue-600' },
  { icon: Shield, title: 'Police Verification', desc: 'Upload certificate or paste link. AI extracts certificate number, authority, district — no manual process.', gradient: 'from-emerald-500 to-emerald-600' },
  { icon: CreditCard, title: 'Aadhaar Verified', desc: 'Upload front/back. AI extracts details. Full number NEVER stored — only last 4 digits.', gradient: 'from-teal-500 to-teal-600' },
  { icon: GraduationCap, title: 'University ERP', desc: 'Universities push academic records directly. Companies see CGPA, degree, branch — verified.', gradient: 'from-indigo-500 to-indigo-600' },
  { icon: Link2, title: 'One Verified Link', desc: 'credentiaonline.in/verify/your-id — paste everywhere. Instant trust.', gradient: 'from-violet-500 to-violet-600' },
  { icon: BarChart3, title: 'Smart Hiring', desc: 'Companies filter by police status, ATS score, CGPA, university. Hire with zero doubt.', gradient: 'from-cyan-500 to-cyan-600' },
]

export default function Features() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" ref={ref} className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[rgb(var(--text-primary))] mb-4">
            Everything You Need to{' '}
            <span className="gradient-text">Get Verified</span>
          </h2>
          <p className="text-[rgb(var(--text-secondary))] text-lg max-w-2xl mx-auto">
            One platform. All your credentials. AI-powered verification in minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-2xl p-7 card-hover group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon size={22} className="text-white" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))] mb-2">{f.title}</h3>
              <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

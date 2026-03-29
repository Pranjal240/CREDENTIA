'use client'

import { motion } from 'framer-motion'
import { Bot, Shield, Fingerprint, GraduationCap, Link2, Building2 } from 'lucide-react'

const features = [
  { icon: Bot, title: 'AI Resume Scoring', desc: 'Groq AI analyzes your PDF, gives ATS score 0-100, finds missing keywords.', gradient: 'from-purple-500 to-blue-500' },
  { icon: Shield, title: 'Police Verification', desc: 'Upload certificate or paste link. AI extracts certificate number, authority, district — no manual process.', gradient: 'from-red-500 to-orange-500' },
  { icon: Fingerprint, title: 'Aadhaar Verified', desc: 'Upload front/back. AI extracts details. Full number NEVER stored — only last 4 digits.', gradient: 'from-green-500 to-teal-500' },
  { icon: GraduationCap, title: 'University ERP', desc: 'Universities push academic records directly. Companies see CGPA, degree, branch — verified.', gradient: 'from-blue-500 to-indigo-500' },
  { icon: Link2, title: 'One Verified Link', desc: 'credentiaonline.in/verify/your-id — paste everywhere. Instant trust.', gradient: 'from-yellow-500 to-orange-500' },
  { icon: Building2, title: 'Smart Hiring', desc: 'Companies filter by police status, ATS score, CGPA, university. Hire with zero doubt.', gradient: 'from-pink-500 to-purple-500' },
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-[#0A0A0F]">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-[#F5C542] text-sm font-semibold uppercase tracking-widest">Features</span>
          <h2 className="font-syne text-3xl md:text-5xl font-extrabold text-white mt-3">
            Everything You Need to Get Verified
          </h2>
          <p className="text-[#9999AA] mt-4 max-w-xl mx-auto">
            One platform. All your credentials. AI-powered verification in minutes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-[#13131A]/80 backdrop-blur-sm border border-[#2A2A3A] rounded-2xl p-7 hover:border-[#F5C542]/50 hover:shadow-[0_0_30px_rgba(245,197,66,0.1)] hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon size={24} className="text-white" />
              </div>
              <h3 className="font-syne text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-[#9999AA] text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle2, FileText, Shield, CreditCard, GraduationCap } from 'lucide-react'

const bullets = [
  'See police verification status instantly',
  'Filter by ATS score, CGPA, verified skills',
  'No document fraud — AI-verified only',
  'Build trusted talent pipelines',
]

export default function ForCompanies() {
  return (
    <section id="companies" className="py-24 bg-[#0A0A0F]">
      <div className="max-w-6xl mx-auto px-5 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-[#F5C542] text-sm font-semibold uppercase tracking-widest">For Companies</span>
          <h2 className="font-syne text-3xl md:text-4xl font-extrabold text-white mt-3 mb-6">
            Hire With Confidence, Not Hope
          </h2>
          <div className="space-y-4 mb-8">
            {bullets.map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-[#22C55E] mt-0.5 flex-shrink-0" />
                <span className="text-[#CCCCDD] text-sm">{text}</span>
              </div>
            ))}
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-[#F5C542] text-black font-bold h-12 px-7 rounded-xl hover:bg-[#D4A017] transition-all hover:scale-105 shadow-[0_0_20px_rgba(245,197,66,0.2)]"
          >
            Start Hiring →
          </Link>
        </motion.div>

        {/* Right — Mockup candidate card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="glass rounded-2xl p-6 border border-[#2A2A3A] max-w-sm mx-auto">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F5C542] to-[#D4A017] flex items-center justify-center text-black font-bold text-xl">
                PK
              </div>
              <div>
                <h4 className="font-syne font-bold text-white">Pranjal Kumar</h4>
                <p className="text-xs text-[#9999AA]">B.Tech CSE — AKTU 2025</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: FileText, label: 'Resume', status: '✅ 94/100', color: 'text-green-400' },
                { icon: Shield, label: 'Police', status: '✅ Verified', color: 'text-green-400' },
                { icon: CreditCard, label: 'Aadhaar', status: '✅ Verified', color: 'text-green-400' },
                { icon: GraduationCap, label: 'Degree', status: '✅ CGPA 8.2', color: 'text-green-400' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-[#1C1C26] rounded-xl px-4 py-3 border border-[#2A2A3A]">
                  <div className="flex items-center gap-2.5">
                    <item.icon size={15} className="text-[#9999AA]" />
                    <span className="text-sm text-[#CCCCDD]">{item.label}</span>
                  </div>
                  <span className={`text-xs font-semibold ${item.color}`}>{item.status}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-[#9999AA]">Verified by CREDENTIA</span>
              <div className="w-6 h-6 rounded-full bg-[#F5C542] flex items-center justify-center">
                <CheckCircle2 size={14} className="text-black" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

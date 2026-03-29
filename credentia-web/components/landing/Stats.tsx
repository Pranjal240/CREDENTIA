'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import CountUp from 'react-countup'
import { Users, Building2, Target, GraduationCap } from 'lucide-react'

const stats = [
  { icon: Users, value: 50000, suffix: '+', label: 'Students Verified', color: 'text-blue-400' },
  { icon: Building2, value: 1200, suffix: '+', label: 'Companies Hiring', color: 'text-teal-400' },
  { icon: Target, value: 99.2, suffix: '%', label: 'Verification Accuracy', decimals: 1, color: 'text-emerald-400' },
  { icon: GraduationCap, value: 500, suffix: '+', label: 'Universities Connected', color: 'text-indigo-400' },
]

export default function Stats() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgb(var(--accent))]/[0.02] to-transparent" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass rounded-2xl p-6 text-center card-hover"
            >
              <stat.icon size={24} className={`${stat.color} mx-auto mb-3`} />
              <div className="font-syne text-3xl md:text-4xl font-extrabold text-[rgb(var(--text-primary))] mb-1">
                {inView ? (
                  <CountUp end={stat.value} duration={2.5} decimals={stat.decimals || 0} separator="," />
                ) : '0'}
                <span className="text-[rgb(var(--accent))]">{stat.suffix}</span>
              </div>
              <p className="text-[rgb(var(--text-muted))] text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

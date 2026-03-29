'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import CountUp from 'react-countup'

const stats = [
  { value: 50000, suffix: '+', label: 'Students Verified' },
  { value: 1200, suffix: '+', label: 'Companies Hiring' },
  { value: 300, suffix: '+', label: 'Universities' },
  { value: 99.2, suffix: '%', label: 'Accuracy', decimals: 1 },
]

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section ref={ref} className="bg-[#13131A] border-y border-[#2A2A3A] py-14">
      <div className="max-w-6xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`text-center ${i < stats.length - 1 ? 'md:border-r md:border-[#2A2A3A]' : ''}`}
          >
            <div className="font-syne text-3xl md:text-4xl font-extrabold text-white mb-1">
              {inView ? (
                <CountUp
                  end={stat.value}
                  suffix={stat.suffix}
                  duration={2.5}
                  decimals={stat.decimals || 0}
                  separator=","
                />
              ) : (
                '0'
              )}
            </div>
            <p className="text-sm text-[#9999AA]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

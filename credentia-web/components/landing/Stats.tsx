'use client'

import CountUp from 'react-countup'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

const stats = [
  { end: 50000, suffix: '+', label: 'Students Verified', decimals: 0 },
  { end: 1200, suffix: '+', label: 'Companies Using', decimals: 0 },
  { end: 300, suffix: '+', label: 'Universities', decimals: 0 },
  { end: 99.2, suffix: '%', label: 'Accuracy Rate', decimals: 1 },
]

export default function Stats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  return (
    <section ref={ref} className="dark:bg-[#13131A] bg-[#F8F8FC] border-y dark:border-[#2A2A3A] border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center ${i < stats.length - 1 ? 'md:border-r dark:border-r-[#2A2A3A] border-r-gray-100' : ''}`}
            >
              <div className="font-heading font-extrabold text-4xl sm:text-5xl dark:text-white text-gray-900 mb-2">
                {isInView ? (
                  <CountUp
                    end={stat.end}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                    duration={2.5}
                    enableScrollSpy={false}
                  />
                ) : (
                  '0'
                )}
              </div>
              <div className="text-sm dark:text-[#9999AA] text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

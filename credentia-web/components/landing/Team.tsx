'use client'

import { useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

const team = [
  {
    name: 'Pranjal Mishra',
    role: 'Founder & CEO',
    img: '/team/pranjal.png',
    bio: 'Visionary entrepreneur dedicated to building India\'s trust infrastructure for the next generation. Leading the charge to eliminate hiring fraud and empower students with verifiable credentials.',
    linkedin: '#',
  },
  {
    name: 'Kriti Ahlawat',
    role: 'Co-Founder & COO',
    img: '/team/kriti.png',
    bio: 'Driving strategic operations and forging partnerships across India\'s education and corporate landscape. Passionate about creating seamless verification experiences at scale.',
    linkedin: '#',
  },
  {
    name: 'Nihal Kumar',
    role: 'CTO',
    img: '/team/nihal.png',
    bio: 'Architecting scalable AI-powered verification systems using cutting-edge technologies. Expert in building secure, high-throughput platforms that handle millions of document verifications.',
    linkedin: '#',
  },
  {
    name: 'Pragya Mishra',
    role: 'Head of Operations',
    img: '/team/pragya.png',
    bio: 'Ensuring seamless verification workflows and exceptional user experiences. Managing end-to-end operations from university onboarding to enterprise client success.',
    linkedin: '#',
  },
]

export default function Team() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <section id="team" ref={ref} className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgb(var(--accent))]/[0.02] to-transparent" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="font-syne text-3xl sm:text-4xl font-extrabold text-[rgb(var(--text-primary))] mb-4">
            Meet Our <span className="gradient-text">Team</span>
          </h2>
          <p className="text-[rgb(var(--text-secondary))] text-lg">The people building India&apos;s most trusted credential platform</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              onClick={() => setSelected(i)}
              className="text-center cursor-pointer group"
            >
              <div className="relative w-28 h-28 md:w-32 md:h-32 mx-auto mb-4">
                {/* Gradient ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-teal-400 to-indigo-500 p-[3px] group-hover:p-[2px] transition-all group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <div className="w-full h-full rounded-full bg-[rgb(var(--bg-base))] p-[3px]">
                    <div className="relative w-full h-full rounded-full overflow-hidden">
                      <Image
                        src={member.img}
                        alt={member.name}
                        fill
                        className="object-cover object-top group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="font-syne text-sm md:text-base font-bold text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--accent))] transition-colors">{member.name}</h3>
              <p className="text-[rgb(var(--text-muted))] text-xs md:text-sm">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="glass-strong rounded-3xl p-8 max-w-md w-full relative"
            >
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[rgb(var(--bg-elevated))] flex items-center justify-center text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors">
                <X size={16} />
              </button>
              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 ring-3 ring-[rgb(var(--accent))]/30">
                  <Image src={team[selected].img} alt={team[selected].name} fill className="object-cover object-top" />
                </div>
                <h3 className="font-syne text-xl font-bold text-[rgb(var(--text-primary))] mb-1">{team[selected].name}</h3>
                <p className="text-[rgb(var(--accent))] text-sm font-medium mb-4">{team[selected].role}</p>
                <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed">{team[selected].bio}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

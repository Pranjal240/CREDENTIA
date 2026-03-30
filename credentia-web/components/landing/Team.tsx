'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X } from 'lucide-react'

const team = [
  {
    name: 'Pranjal Mishra',
    role: 'Founder & Developer',
    img: '/team/Pranjal Mishra.png',
    bio: 'Visionary entrepreneur dedicated to building India\'s trust infrastructure for the next generation. Leading the charge to eliminate hiring fraud and empower students with verifiable credentials.',
    linkedin: '#',
    objectPosition: 'object-center',
  },
  {
    name: 'KRITI AHLAWAT',
    role: 'Founder & COO',
    img: '/team/KRITI AHLAWAT.png',
    bio: 'Driving strategic operations and forging partnerships across India\'s education and corporate landscape. Passionate about creating seamless verification experiences at scale.',
    linkedin: '#',
    objectPosition: 'object-center',
  },
  {
    name: 'Nihal Kumar',
    role: 'Founder & Developer',
    img: '/team/NIHAL Kumar.png',
    bio: 'Architecting scalable AI-powered verification systems using cutting-edge technologies. Expert in building secure, high-throughput platforms that handle millions of document verifications.',
    linkedin: '#',
    objectPosition: 'object-center',
  },
  {
    name: 'Pragya Mishra',
    role: 'Founder & Head of Operations',
    img: '/team/Pragya Mishra.png',
    bio: 'Ensuring seamless verification workflows and exceptional user experiences. Managing end-to-end operations from university onboarding to enterprise client success.',
    linkedin: '#',
    objectPosition: 'object-[55%_20%]',
  },
]

export default function Team() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <section id="team" ref={ref} className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-transparent" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
            Meet Our <span className="gradient-text">Founders</span>
          </h2>
          <p style={{ color: 'rgb(var(--text-secondary))' }} className="text-lg">The people building India&apos;s most trusted credential platform</p>
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
              <div className="relative w-28 h-28 md:w-36 md:h-36 mx-auto mb-4">
                {/* Glow ring */}
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-500 via-teal-400 to-indigo-500 opacity-60 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
                {/* Border ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-teal-400 to-indigo-500 p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#0A0A0F]">
                    <img
                      src={member.img}
                      alt={member.name}
                      className={`w-full h-full object-cover transition-all duration-700 group-hover:brightness-110 group-hover:scale-105 ${member.objectPosition}`}
                    />
                  </div>
                </div>
              </div>
              <h3 className="font-heading text-sm md:text-base font-bold group-hover:text-blue-400 transition-colors" style={{ color: 'rgb(var(--text-primary))' }}>{member.name}</h3>
              <p className="text-xs md:text-sm mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Glassmorphism Zoom Modal */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 40 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(40px) saturate(180%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Close */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-white/20"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
              >
                <X size={18} />
              </button>

              {/* Image area */}
              <div className="relative w-full aspect-[4/5] bg-gradient-to-br from-blue-600/20 via-transparent to-teal-600/20">
                <img
                  src={team[selected].img}
                  alt={team[selected].name}
                  className={`w-full h-full object-cover transition-transform duration-1000 ${team[selected].objectPosition}`}
                />
                {/* Bottom gradient fade into bio */}
                <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, rgba(10,10,15,0.95), transparent)' }} />
              </div>

              {/* Bio area */}
              <div className="px-6 pb-6 -mt-14 relative z-10">
                <h3 className="font-heading text-2xl font-bold text-white mb-1">{team[selected].name}</h3>
                <p className="text-sm font-semibold text-blue-400 mb-3">{team[selected].role}</p>
                <p className="text-sm leading-relaxed text-white/60">{team[selected].bio}</p>
                {team[selected].linkedin && team[selected].linkedin !== '#' && (
                  <a
                    href={team[selected].linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-medium text-blue-400 transition-all hover:bg-blue-500/20"
                    style={{ background: 'rgba(59,130,246,0.1)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

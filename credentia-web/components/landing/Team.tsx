'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { X } from 'lucide-react'

const team = [
  {
    name: 'Pranjal Mishra',
    role: 'Founder & Developer',
    img: '/team/pranjal.png',
    bio: 'Visionary entrepreneur dedicated to building India\'s trust infrastructure for the next generation. Leading the charge to eliminate hiring fraud and empower students with verifiable credentials.',
    linkedin: '#',
  },
  {
    name: 'Kriti Ahlawat',
    role: 'Founder & COO',
    img: '/team/kriti.png',
    bio: 'Driving strategic operations and forging partnerships across India\'s education and corporate landscape. Passionate about creating seamless verification experiences at scale.',
    linkedin: '#',
  },
  {
    name: 'Nihal Kumar',
    role: 'Founder & Developer',
    img: '/team/nihal.png',
    bio: 'Architecting scalable AI-powered verification systems using cutting-edge technologies. Expert in building secure, high-throughput platforms that handle millions of document verifications.',
    linkedin: '#',
  },
  {
    name: 'Pragya Mishra',
    role: 'Founder & Head of Operations',
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
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/[0.02] to-transparent" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>
            Meet Our <span className="gradient-text">Team</span>
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
              <div className="relative w-28 h-28 md:w-32 md:h-32 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 via-teal-400 to-indigo-500 p-[3px] group-hover:p-[2px] transition-all group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <div className="w-full h-full rounded-full overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(var(--accent), 0.1), rgba(var(--teal), 0.1))' }}>
                    <div className="relative w-full h-full rounded-full overflow-hidden m-[3px] mr-0 mb-0" style={{ width: 'calc(100% - 6px)', height: 'calc(100% - 6px)' }}>
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
              <h3 className="font-heading text-sm md:text-base font-bold transition-colors" style={{ color: 'rgb(var(--text-primary))' }}>{member.name}</h3>
              <p className="text-xs md:text-sm" style={{ color: 'rgb(var(--text-muted))' }}>{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full-screen Zoom Modal */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-lg w-full rounded-3xl overflow-hidden"
              style={{ background: 'rgb(var(--bg-card))', border: '1px solid rgba(var(--border-default), 0.5)' }}
            >
              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(0,0,0,0.5)', color: 'white' }}
              >
                <X size={20} />
              </button>

              {/* Large Image */}
              <div className="relative w-full aspect-square max-h-[400px]" style={{ background: 'linear-gradient(135deg, rgba(var(--accent), 0.1), rgba(var(--teal), 0.1))' }}>
                <Image
                  src={team[selected].img}
                  alt={team[selected].name}
                  fill
                  className="object-contain p-4 drop-shadow-2xl"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
                {/* Gradient overlay at bottom to merge with info box */}
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[rgb(var(--bg-card))] to-transparent pointer-events-none" />
              </div>

              {/* Info */}
              <div className="px-6 pb-6 -mt-8 relative z-10 text-center md:text-left">
                <h3 className="font-heading text-2xl font-bold mb-1" style={{ color: 'rgb(var(--text-primary))' }}>{team[selected].name}</h3>
                <p className="text-sm font-medium mb-4" style={{ color: 'rgb(var(--accent))' }}>{team[selected].role}</p>
                <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>{team[selected].bio}</p>
                {team[selected].linkedin && team[selected].linkedin !== '#' && (
                  <a href={team[selected].linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: 'rgba(var(--accent), 0.1)', color: 'rgb(var(--accent))' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    Connect on LinkedIn
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

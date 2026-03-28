'use client'

import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'



const team = [
  {
    name: 'Pranjal',
    role: 'Founder & Lead Developer',
    image: '/owner/Pranjal.jpg',
    bio: 'Full-stack engineer driving the technical vision behind Credentia.',
    linkedin: '#',
  },
  {
    name: 'Nihal',
    role: 'Co-Founder & Developer',
    image: '/owner/Nihal.jpg',
    bio: 'Backend architect building scalable verification infrastructure.',
    linkedin: '#',
  },
  {
    name: 'Kriti',
    role: 'Co-Founder & Strategy',
    image: '/owner/KRITI.jpeg',
    bio: 'Shaping product strategy and driving the business roadmap forward.',
    linkedin: '#',
  },
  {
    name: 'Pragya',
    role: 'Co-Founder & Design',
    image: '/owner/Pragya.jpg',
    bio: 'Crafting intuitive experiences and ensuring design excellence.',
    linkedin: '#',
  },
]

export default function Team() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="team" ref={ref} className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="orb w-[500px] h-[500px] bg-purple-600/10 -top-40 -left-40" />
      <div className="orb w-[400px] h-[400px] bg-[#F5C542]/8 -bottom-40 -right-40" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className="text-[#F5C542] font-medium text-sm uppercase tracking-wider mb-4"
          >
            Our Team
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="font-heading font-bold text-4xl sm:text-5xl dark:text-white text-gray-900 mb-4"
          >
            Meet the Founders
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg dark:text-[#9999AA] text-gray-500 max-w-2xl mx-auto"
          >
            The passionate minds building India&apos;s most trusted credential verification platform.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15 * i, duration: 0.6 }}
              className="group relative"
            >
              <div className="flex flex-col items-center text-center p-6">
                {/* Circular photo with gradient ring on hover */}
                <div className="relative w-36 h-36 mx-auto mb-5">
                  {/* Gradient ring — visible on hover */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F5C542] via-purple-500 to-blue-500 p-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-full h-full rounded-full dark:bg-[#0A0A0F] bg-[#F4F4F8]" />
                  </div>
                  {/* Static border */}
                  <div className="absolute inset-0 rounded-full border-3 border-[#F5C542]/30 group-hover:border-transparent transition-colors duration-500" />
                  {/* Image */}
                  <div className="absolute inset-[3px] rounded-full overflow-hidden">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover object-top"
                      sizes="144px"
                    />
                  </div>
                </div>

                {/* Name & role */}
                <h3 className="font-heading font-bold text-lg dark:text-white text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-[#F5C542] font-medium mb-2">{member.role}</p>
                <p className="text-xs dark:text-[#9999AA] text-gray-500 leading-relaxed mb-4 px-2">
                  {member.bio}
                </p>

                {/* LinkedIn */}
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs dark:text-[#9999AA] text-gray-400 hover:text-[#F5C542] transition-colors"
                  aria-label={`${member.name} LinkedIn`}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  <span>Connect</span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

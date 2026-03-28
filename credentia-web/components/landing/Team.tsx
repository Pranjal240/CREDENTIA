'use client'

import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'


const team = [
  {
    name: 'Pranjal',
    role: 'Founder & Senior Developer',
    image: '/owner/Pranjal.jpg',
  },
  {
    name: 'Nihal',
    role: 'Founder & Senior Developer',
    image: '/owner/Nihal.jpg',
  },
  {
    name: 'KRITI',
    role: 'Founder',
    image: '/owner/KRITI.jpeg',
  },
  {
    name: 'Pragya',
    role: 'Founder',
    image: '/owner/Pragya.jpg',
  },
]

export default function Team() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="team" ref={ref} className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            className="font-syne font-bold text-4xl sm:text-5xl dark:text-white text-gray-900 mb-4"
          >
            Meet Our Team
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            className="text-lg dark:text-[#9999AA] text-gray-500"
          >
            The minds behind CREDENTIA
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i }}
              className="group relative dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6 text-center hover:-translate-y-1 hover:dark:border-[#F5C542] hover:border-[#F5C542] transition-all duration-300 cursor-pointer"
            >
              {/* Photo */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-4">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>

              {/* Name & role */}
              <h3 className="font-syne font-bold text-lg dark:text-white text-gray-900 mb-1">
                {member.name}
              </h3>
              <p className="text-sm dark:text-[#9999AA] text-gray-500 mb-3">{member.role}</p>

              {/* LinkedIn icon */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href="#"
                  className="text-[#F5C542] hover:scale-110 transition-transform inline-block"
                  aria-label={`${member.name} LinkedIn`}
                >
                  <span className="text-[#F5C542] text-lg">💼</span>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

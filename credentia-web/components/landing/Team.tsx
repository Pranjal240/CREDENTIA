'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'

const team = [
  {
    name: 'Pranjal',
    image: '/owner/Pranjal.jpg',
    role: 'Founder & Lead Developer',
    desc: 'Full-stack engineer driving the technical vision behind Credentia.',
  },
  {
    name: 'Nihal',
    image: '/owner/Nihal.jpg',
    role: 'Co-Founder & Developer',
    desc: 'Backend architect building scalable verification infrastructure.',
  },
  {
    name: 'Kriti',
    image: '/owner/KRITI.jpeg',
    role: 'Co-Founder & Strategy',
    desc: 'Shaping product strategy and driving the business roadmap forward.',
  },
  {
    name: 'Pragya',
    image: '/owner/Pragya.jpg',
    role: 'Co-Founder & Design',
    desc: 'Crafting intuitive experiences and ensuring design excellence.',
  },
]

export default function Team() {
  return (
    <section id="team" className="py-24 bg-[#0A0A0F]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#F5C542] text-sm font-semibold tracking-widest uppercase">Our Team</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4" style={{fontFamily:'var(--font-syne, sans-serif)'}}>
            Meet the Founders
          </h2>
          <p className="text-[#9999AA] text-lg max-w-xl mx-auto">
            The passionate minds building India&apos;s most trusted credential verification platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex flex-col items-center text-center group"
            >
              {/* Photo */}
              <div className="relative mb-5">
                <div className="w-32 h-32 rounded-full overflow-hidden ring-2 ring-[#2A2A3A] group-hover:ring-[#F5C542] transition-all duration-300 shadow-xl">
                  <Image
                    src={member.image}
                    alt={member.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover object-top"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.style.background = '#1C1C26'
                        parent.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:800;color:#F5C542;">${member.name[0]}</div>`
                      }
                    }}
                  />
                </div>
                {/* Golden glow ring on hover */}
                <div className="absolute inset-0 rounded-full ring-4 ring-[#F5C542]/40 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>

              <h3 className="text-white font-bold text-lg" style={{fontFamily:'var(--font-syne, sans-serif)'}}>
                {member.name}
              </h3>
              <p className="text-[#F5C542] text-xs font-semibold tracking-wide mt-1 mb-2">
                {member.role}
              </p>
              <p className="text-[#9999AA] text-xs leading-relaxed mb-3">
                {member.desc}
              </p>
              <button className="flex items-center gap-1.5 text-[#9999AA] hover:text-[#F5C542] text-xs transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/></svg>
                Connect
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

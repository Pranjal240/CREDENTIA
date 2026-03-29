'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

const team = [
  { name: 'Pranjal', image: '/owner/Pranjal.jpg', role: 'Founder & Lead Developer', bio: 'Full-stack engineer driving CREDENTIA\u0027s technical vision. Passionate about solving India\u0027s credential trust problem.' },
  { name: 'Nihal', image: '/owner/Nihal.jpg', role: 'Co-Founder & Backend', bio: 'Backend architect building the scalable infrastructure behind CREDENTIA\u0027s AI verification engine.' },
  { name: 'Kriti', image: '/owner/KRITI.jpeg', role: 'Co-Founder & Strategy', bio: 'Shaping CREDENTIA\u0027s product roadmap and driving partnerships with universities and companies across India.' },
  { name: 'Pragya', image: '/owner/Pragya.jpg', role: 'Co-Founder & Design', bio: 'Crafting the visual identity and user experience that makes CREDENTIA feel premium and trustworthy.' },
]

export default function Team() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <section id="team" className="py-24 bg-[#0A0A0F]">
      <div className="max-w-6xl mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-[#F5C542] text-sm font-semibold uppercase tracking-widest">Our Team</span>
          <h2 className="font-syne text-3xl md:text-5xl font-extrabold text-white mt-3">
            The Minds Behind CREDENTIA
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="text-center group cursor-pointer"
              onClick={() => setSelected(i)}
            >
              <div className="relative w-36 h-36 mx-auto mb-4 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-4 group-hover:ring-[#F5C542] group-hover:ring-offset-4 group-hover:ring-offset-[#0A0A0F] transition-all duration-300 group-hover:shadow-[0_0_40px_rgba(245,197,66,0.4)]">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover object-top"
                  onError={(e) => {
                    const t = e.currentTarget as HTMLImageElement
                    t.style.display = 'none'
                    const p = t.parentElement
                    if (p) p.innerHTML = `<div style="width:100%;height:100%;background:#1C1C26;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:#F5C542;">${member.name[0]}</div>`
                  }}
                />
              </div>
              <h4 className="font-syne font-bold text-white text-lg">{member.name}</h4>
              <p className="text-[#9999AA] text-sm mt-1">{member.role}</p>
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="glass rounded-3xl p-8 max-w-sm w-full mx-4 relative"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-[#9999AA] hover:text-white">
                <X size={20} />
              </button>
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden ring-4 ring-[#F5C542] ring-offset-4 ring-offset-[#13131A]">
                  <Image
                    src={team[selected].image}
                    alt={team[selected].name}
                    fill
                    className="object-cover object-top"
                    onError={(e) => {
                      const t = e.currentTarget as HTMLImageElement
                      t.style.display = 'none'
                      const p = t.parentElement
                      if (p) p.innerHTML = `<div style="width:100%;height:100%;background:#1C1C26;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;font-weight:800;color:#F5C542;">${team[selected].name[0]}</div>`
                    }}
                  />
                </div>
                <h3 className="font-syne text-2xl font-extrabold text-white">{team[selected].name}</h3>
                <p className="text-[#F5C542] text-sm font-medium mt-1">{team[selected].role}</p>
                <p className="text-[#9999AA] text-sm mt-4 leading-relaxed">{team[selected].bio}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

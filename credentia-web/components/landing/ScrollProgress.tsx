'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-[100] origin-left pointer-events-none"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, #4F46E5 0%, #818cf8 40%, #2dd4bf 100%)',
        boxShadow: '0 0 10px rgba(129,140,248,0.5)',
      }}
    />
  )
}

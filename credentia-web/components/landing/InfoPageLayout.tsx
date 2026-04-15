'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { ArrowLeft, Sun, Moon, AlertTriangle, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import Footer from './Footer'

interface InfoPageLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export default function InfoPageLayout({ children, title, subtitle }: InfoPageLayoutProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showLightWarning, setShowLightWarning] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <>
    <main className="gradient-bg min-h-screen">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[140px]" />
      </div>

      {/* Top Nav */}
      <nav className="sticky top-0 z-50 glass-strong">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-[rgb(var(--accent))]/30 group-hover:ring-[rgb(var(--accent))]/60 transition-all">
              <Image src="/logo.png" alt="CREDENTIA" fill className="object-contain p-0.5" />
            </div>
            <span className="font-heading text-lg font-extrabold tracking-tight text-[rgb(var(--text-primary))]">
              CREDENTIA
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={() => {
                  if (theme === 'dark') {
                    setTheme('light')
                    setShowLightWarning(true)
                    setTimeout(() => setShowLightWarning(false), 10000)
                  } else {
                    setTheme('dark')
                    setShowLightWarning(false)
                  }
                }}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--accent))]/5 transition-all"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            )}
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--accent))]/5 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative pt-16 pb-12 text-center px-4"
      >
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-[rgb(var(--text-primary))] mb-4">
          {title.split(' ').map((word, i) => (
            i === title.split(' ').length - 1 ? (
              <span key={i} className="gradient-text-hero"> {word}</span>
            ) : (
              <span key={i}>{i > 0 ? ' ' : ''}{word}</span>
            )
          ))}
        </h1>
        <p className="text-lg text-[rgb(var(--text-secondary))] max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      </motion.section>

      {/* Page Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-20"
      >
        {children}
      </motion.div>

      <Footer />
    </main>

    {/* Light Mode Warning Toast */}
    <AnimatePresence>
      {showLightWarning && mounted && theme === 'light' && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-[200] w-[400px] max-w-[calc(100vw-32px)]"
        >
          <div className="relative rounded-2xl p-[1px]" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.5), rgba(251,191,36,0.3), rgba(245,158,11,0.5))' }}>
            <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'rgba(253,250,245,0.97)', backdropFilter: 'blur(20px)' }}>
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)' }} />
              <button onClick={() => setShowLightWarning(false)} className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors z-10" style={{ color: 'rgba(120,100,70,0.5)' }}>
                <X size={14} />
              </button>
              <div className="flex items-start gap-3.5 relative z-10">
                <motion.div animate={{ rotate: [0, -8, 8, -4, 0] }} transition={{ duration: 0.6, delay: 0.3 }} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <AlertTriangle size={20} style={{ color: '#d97706' }} />
                </motion.div>
                <div className="flex-1 min-w-0 pr-5">
                  <p className="font-heading font-bold text-sm" style={{ color: '#92400e' }}>Light Mode — In Development</p>
                  <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'rgba(120,90,50,0.7)' }}>Light mode is still being perfected. For the best experience, we recommend <strong style={{ color: '#78350f' }}>Dark Mode</strong>.</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 mt-4 relative z-10">
                <button onClick={() => setShowLightWarning(false)} className="flex-1 h-9 rounded-xl text-xs font-semibold transition-all hover:opacity-80" style={{ background: 'rgba(245,158,11,0.08)', color: '#b45309', border: '1px solid rgba(245,158,11,0.2)' }}>Continue in Light</button>
                <button onClick={() => { setTheme('dark'); setShowLightWarning(false) }} className="flex-1 h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: '#e0e7ff', boxShadow: '0 4px 16px rgba(30,27,75,0.3)' }}>
                  <Moon size={13} /> Switch to Dark
                </button>
              </div>
              <motion.div initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 10, ease: 'linear' }} className="absolute bottom-0 left-0 right-0 h-[3px] origin-left" style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}

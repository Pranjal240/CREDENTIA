'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { ArrowLeft, Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'
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
  useEffect(() => { setMounted(true) }, [])

  return (
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
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
  )
}

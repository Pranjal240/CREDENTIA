'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'For Companies', href: '#companies' },
  { label: 'Our Team', href: '#team' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5 shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full overflow-hidden relative">
            <Image src="/logo.jpg" alt="CREDENTIA" width={36} height={36} className="object-cover" onError={(e) => { const t = e.currentTarget; t.style.display = 'none' }} />
          </div>
          <span className="font-bold text-lg text-[#F5C542] font-syne tracking-tight">CREDENTIA</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map(link => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href.replace('#', ''))}
              className="text-sm text-[#9999AA] hover:text-white transition-colors duration-200"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-9 h-9 rounded-xl bg-[#1C1C26] flex items-center justify-center text-[#9999AA] hover:text-[#F5C542] transition-colors"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
          <Link href="/login" className="text-sm text-[#9999AA] hover:text-white transition-colors px-4 py-2 rounded-xl border border-[#2A2A3A] hover:border-[#F5C542]/30">
            Login
          </Link>
          <Link href="/register" className="text-sm bg-[#F5C542] text-black font-semibold px-5 py-2 rounded-xl hover:bg-[#D4A017] transition-all hover:scale-105 shadow-[0_0_20px_rgba(245,197,66,0.2)]">
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-[#2A2A3A] overflow-hidden"
          >
            <div className="px-5 py-4 space-y-3">
              {navLinks.map(link => (
                <button
                  key={link.label}
                  onClick={() => scrollTo(link.href.replace('#', ''))}
                  className="block w-full text-left text-[#9999AA] hover:text-white py-2 text-sm"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex gap-3 pt-3 border-t border-[#2A2A3A]">
                <Link href="/login" className="flex-1 text-center text-sm py-2.5 rounded-xl border border-[#2A2A3A] text-[#9999AA]">Login</Link>
                <Link href="/register" className="flex-1 text-center text-sm py-2.5 rounded-xl bg-[#F5C542] text-black font-semibold">Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

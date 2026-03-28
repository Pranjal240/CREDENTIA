'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#team', label: 'Our Team' },
]

export default function Navbar() {
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const el = document.querySelector(href)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      setMobileOpen(false)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 dark:bg-[#0A0A0F]/85 bg-white/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5C542] flex items-center justify-center">
              <span className="text-black font-black text-sm">C</span>
            </div>
            <span className="font-[family-name:var(--font-syne)] font-extrabold text-xl text-[#F5C542] tracking-tight">
              CREDENTIA
            </span>
          </Link>

          {/* Center Nav — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="relative text-sm font-medium dark:text-[#9999AA] text-gray-600 hover:dark:text-white hover:text-black transition-colors group cursor-pointer"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F5C542] group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full dark:text-[#9999AA] text-gray-500 hover:dark:text-white hover:text-black transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              href="/login"
              className="hidden sm:block px-4 py-2 rounded-xl text-sm font-medium border dark:border-[#2A2A3A] border-gray-200 dark:text-white text-gray-800 hover:dark:bg-[#1C1C26] hover:bg-gray-50 transition-all"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#F5C542] text-black hover:bg-[#D4A017] hover:scale-105 transition-all"
            >
              Get Started
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 dark:text-white text-gray-800"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t dark:border-[#2A2A3A] border-gray-100 dark:bg-[#0A0A0F] bg-white"
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className="text-sm font-medium dark:text-[#9999AA] text-gray-600 hover:dark:text-white hover:text-black transition-colors cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/login"
                className="text-sm font-medium dark:text-white text-gray-800"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

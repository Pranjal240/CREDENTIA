'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'For Companies', href: '#for-companies' },
  { label: 'Our Team', href: '#team' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showLightWarning, setShowLightWarning] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Fetch user role from the DB profile (not the JWT — JWT metadata is unreliable)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return
      supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.role) {
            setUserRole(profile.role)
          }
        })
    })
  }, [])

  return (
    <>
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-strong shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-[rgb(var(--accent))]/30 group-hover:ring-[rgb(var(--accent))]/60 transition-all">
              <Image src="/logo.png" alt="CREDENTIA" fill className="object-contain p-0.5" />
            </div>
            <span className="font-heading text-lg font-extrabold tracking-tight text-[rgb(var(--text-primary))]">
              CREDENTIA
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--accent))]/5 rounded-lg transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
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
                <motion.div key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </motion.div>
              </button>
            )}
            {userRole ? (
              <Link
                href={`/dashboard/${userRole}`}
                className="btn-primary px-5 py-2.5 text-sm"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="btn-primary px-5 py-2.5 text-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center text-[rgb(var(--text-primary))]"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-strong border-t border-[rgb(var(--border-default))]/30"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--accent))]/5 transition-all"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 space-y-2">
                {userRole ? (
                  <Link href={`/dashboard/${userRole}`} className="block w-full text-center btn-primary px-4 py-2.5 text-sm">Go to Dashboard</Link>
                ) : (
                  <>
                    <Link href="/login" className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-medium border border-[rgb(var(--border-default))] text-[rgb(var(--text-primary))] hover:border-[rgb(var(--accent))]/50 transition-all">Login</Link>
                    <Link href="/register" className="block w-full text-center btn-primary px-4 py-2.5 text-sm">Get Started</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>

    {/* ── Light Mode Development Warning Toast ── */}
    <AnimatePresence>
      {showLightWarning && mounted && theme === 'light' && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-[200] w-[400px] max-w-[calc(100vw-32px)] overflow-hidden"
        >
          <div
            className="relative rounded-2xl p-[1px]"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.5), rgba(251,191,36,0.3), rgba(245,158,11,0.5))' }}
          >
            <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'rgba(253,250,245,0.97)', backdropFilter: 'blur(20px)' }}>
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)' }} />

              <button
                onClick={() => setShowLightWarning(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg transition-colors z-10"
                style={{ color: 'rgba(120,100,70,0.5)' }}
              >
                <X size={14} />
              </button>

              <div className="flex items-start gap-3.5 relative z-10">
                <motion.div
                  animate={{ rotate: [0, -8, 8, -4, 0] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  <AlertTriangle size={20} style={{ color: '#d97706' }} />
                </motion.div>
                <div className="flex-1 min-w-0 pr-5">
                  <p className="font-heading font-bold text-sm" style={{ color: '#92400e' }}>Light Mode — In Development</p>
                  <p className="text-xs leading-relaxed mt-1.5" style={{ color: 'rgba(120,90,50,0.7)' }}>
                    Light mode is still being perfected. For the best experience, we recommend <strong style={{ color: '#78350f' }}>Dark Mode</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 mt-4 relative z-10">
                <button
                  onClick={() => setShowLightWarning(false)}
                  className="flex-1 h-9 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: 'rgba(245,158,11,0.08)', color: '#b45309', border: '1px solid rgba(245,158,11,0.2)' }}
                >
                  Continue in Light
                </button>
                <button
                  onClick={() => { setTheme('dark'); setShowLightWarning(false) }}
                  className="flex-1 h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: '#e0e7ff', boxShadow: '0 4px 16px rgba(30,27,75,0.3)' }}
                >
                  <Moon size={13} /> Switch to Dark
                </button>
              </div>

              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 10, ease: 'linear' }}
                className="absolute bottom-0 left-0 right-0 h-[3px] origin-left"
                style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}

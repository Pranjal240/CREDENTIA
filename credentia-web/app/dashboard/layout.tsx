'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, Shield, CreditCard, GraduationCap, Link2,
  ChevronLeft, ChevronRight, LogOut, Menu, X, Home, Users, Settings,
  BookmarkCheck, BarChart3, ClipboardList, Building2, Briefcase,
  ScrollText, Search
} from 'lucide-react'

const sidebarLinks: Record<string, { label: string; icon: any; href: string }[]> = {
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/student' },
    { label: 'Overview', icon: ClipboardList, href: '/dashboard/student/overview' },
    { label: 'Resume', icon: FileText, href: '/dashboard/student/resume' },
    { label: 'Police', icon: Shield, href: '/dashboard/student/police' },
    { label: 'Aadhaar', icon: CreditCard, href: '/dashboard/student/aadhaar' },
    { label: 'Degree', icon: GraduationCap, href: '/dashboard/student/degree' },
    { label: 'My Verifications', icon: BookmarkCheck, href: '/dashboard/student/saved' },
    { label: 'My Link', icon: Link2, href: '/dashboard/student/my-link' },
    { label: 'Settings', icon: Settings, href: '/dashboard/student/settings' },
    { label: 'Home', icon: Home, href: '/' },
  ],
  company: [
    { label: 'Talent Search', icon: Search, href: '/dashboard/company' },
    { label: 'Saved Candidates', icon: BookmarkCheck, href: '/dashboard/company/saved' },
    { label: 'Analytics', icon: BarChart3, href: '/dashboard/company/analytics' },
    { label: 'Settings', icon: Settings, href: '/dashboard/company/settings' },
    { label: 'Home', icon: Home, href: '/' },
  ],
  university: [
    { label: 'Student Registry', icon: Users, href: '/dashboard/university' },
    { label: 'Analytics', icon: BarChart3, href: '/dashboard/university/analytics' },
    { label: 'Settings', icon: Settings, href: '/dashboard/university/settings' },
    { label: 'Home', icon: Home, href: '/' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/admin' },
    { label: 'Analytics', icon: BarChart3, href: '/dashboard/admin/analytics' },
    { label: 'All Users', icon: Users, href: '/dashboard/admin/users' },
    { label: 'Verifications', icon: Shield, href: '/dashboard/admin/verifications' },
    { label: 'Audit Logs', icon: ScrollText, href: '/dashboard/admin/audit' },
    { label: 'Universities', icon: Building2, href: '/dashboard/admin/outreach' },
    { label: 'Companies', icon: Briefcase, href: '/dashboard/admin/companies' },
    { label: 'Settings', icon: Settings, href: '/dashboard/admin/settings' },
    { label: 'Home', icon: Home, href: '/' },
  ],
}

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  student:    { bg: 'rgba(59,130,246,0.12)',  text: 'rgba(96,165,250,0.9)',   border: 'rgba(59,130,246,0.2)' },
  company:    { bg: 'rgba(16,185,129,0.12)',  text: 'rgba(52,211,153,0.9)',   border: 'rgba(16,185,129,0.2)' },
  university: { bg: 'rgba(139,92,246,0.12)', text: 'rgba(167,139,250,0.9)',  border: 'rgba(139,92,246,0.2)' },
  admin:      { bg: 'rgba(239,68,68,0.12)',   text: 'rgba(248,113,113,0.9)', border: 'rgba(239,68,68,0.2)' },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [role, setRole] = useState<string>('student')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Sidebar width values — used in JS for the main margin, NOT transition-all
  const SIDEBAR_OPEN = 260
  const SIDEBAR_CLOSED = 72

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login/student'); return }
      setUser(authUser)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
      if (prof) { setProfile(prof); setRole(prof.role) }
      setLoading(false)
    }
    init()
  }, [router])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const handleLogout = async () => {
    // Sign out then redirect to the user's specific portal login page.
    // This ensures they land back at the correct portal, not a generic page.
    const portalRole = role || 'student'
    await supabase.auth.signOut()
    router.push(`/login/${portalRole}`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0F]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs text-white/30 font-medium tracking-wider">LOADING</span>
        </div>
      </div>
    )
  }

  const links = sidebarLinks[role] || sidebarLinks.student
  const rc = roleColors[role] || roleColors.student
  const sidebarWidth = collapsed ? SIDEBAR_CLOSED : SIDEBAR_OPEN

  return (
    <div className="min-h-screen flex bg-[#0A0A0F] overflow-x-hidden">

      {/* ── Desktop Sidebar ── */}
      {/* 
        FIX: Using width transition ONLY on the aside.
        The main content uses marginLeft with a matching transition.
        We do NOT use transition-all (which triggers layout recalculation on EVERY property).
        will-change: width helps the browser pre-composite the animation.
      */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 overflow-hidden"
        style={{
          width: sidebarWidth,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'width',
          background: 'linear-gradient(180deg, rgba(14,17,40,0.98) 0%, rgba(8,10,25,1) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center px-4 gap-2.5 flex-shrink-0 overflow-hidden"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/10">
            <Image src="/logo.png" alt="C" fill className="object-contain p-0.5" />
          </div>
          <span
            className="font-heading text-sm font-bold tracking-wide text-white whitespace-nowrap overflow-hidden"
            style={{
              opacity: collapsed ? 0 : 1,
              transform: collapsed ? 'translateX(-8px)' : 'translateX(0)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              maxWidth: collapsed ? 0 : 200,
            }}
          >
            CREDENTIA
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {links.map((link) => {
            // Exact match for root dashboard pages, prefix match for sub-pages
            const isExact = pathname === link.href
            const isPrefix =
              !isExact &&
              link.href !== '/' &&
              link.href !== '/dashboard/student' &&
              link.href !== '/dashboard/company' &&
              link.href !== '/dashboard/university' &&
              link.href !== '/dashboard/admin' &&
              pathname.startsWith(link.href)
            const active = isExact || isPrefix

            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium group relative overflow-hidden whitespace-nowrap"
                style={{
                  color: active ? 'white' : 'rgba(255,255,255,0.45)',
                  background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                title={collapsed ? link.label : undefined}
              >
                {/* Active indicator bar — simple CSS, NOT layoutId (which causes reflows) */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-500"
                    style={{ boxShadow: '0 0 12px rgba(59,130,246,0.6)' }}
                  />
                )}
                <link.icon
                  size={18}
                  className="flex-shrink-0"
                  style={{ color: active ? '#60a5fa' : undefined, transition: 'color 0.15s ease' }}
                />
                <span
                  className="overflow-hidden"
                  style={{
                    opacity: collapsed ? 0 : 1,
                    maxWidth: collapsed ? 0 : 180,
                    transition: 'opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {link.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 space-y-1 flex-shrink-0 overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {profile && (
            <div
              className="px-3 py-2 mb-2 overflow-hidden"
              style={{
                opacity: collapsed ? 0 : 1,
                maxHeight: collapsed ? 0 : 60,
                transition: 'opacity 0.2s ease, max-height 0.3s ease',
              }}
            >
              <p className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Signed in as</p>
              <p className="text-xs text-white/70 font-medium truncate mt-0.5">{profile.full_name || user?.email?.split('@')[0]}</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors hover:bg-white/5 overflow-hidden"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            <span
              style={{
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 100,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.2s ease, max-width 0.3s ease',
              }}
            >
              Collapse
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors hover:bg-red-500/10 overflow-hidden"
            style={{ color: 'rgba(239,68,68,0.7)' }}
          >
            <LogOut size={18} />
            <span
              style={{
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 100,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.2s ease, max-width 0.3s ease',
              }}
            >
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4"
        style={{
          background: 'rgba(10,10,15,0.97)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button onClick={() => setMobileOpen(true)} className="p-1.5 text-white/50 hover:text-white/80 transition-colors">
          <Menu size={20} />
        </button>
        <span className="font-heading font-bold text-xs tracking-widest text-white/80">CREDENTIA</span>
        <button onClick={handleLogout} className="p-1.5 text-red-400/60 hover:text-red-400 transition-colors">
          <LogOut size={18} />
        </button>
      </div>

      {/* ── Mobile Sidebar ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="fixed left-0 top-0 bottom-0 w-[260px] z-50 md:hidden flex flex-col"
              style={{
                background: 'linear-gradient(180deg, rgba(14,17,40,0.99) 0%, rgba(8,10,25,1) 100%)',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                willChange: 'transform',
              }}
            >
              <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-white/10">
                    <Image src="/logo.png" alt="C" fill className="object-contain" />
                  </div>
                  <span className="font-heading font-bold text-sm text-white tracking-wide">CREDENTIA</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white/80 transition-colors p-1">
                  <X size={20} />
                </button>
              </div>

              {/* Role badge */}
              <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <p className="text-[10px] text-white/25 uppercase tracking-wider">Signed in as</p>
                <p className="text-xs text-white/70 font-medium mt-0.5 truncate">{profile?.full_name || user?.email?.split('@')[0] || 'User'}</p>
                <span
                  className="mt-1.5 inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}
                >
                  {role}
                </span>
              </div>

              <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
                {links.map((link) => {
                  const active = pathname === link.href
                  return (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors relative"
                      style={{
                        color: active ? 'white' : 'rgba(255,255,255,0.45)',
                        background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                      }}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-500" />
                      )}
                      <link.icon size={18} style={{ color: active ? '#60a5fa' : undefined }} />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ──
        FIX: Use explicit marginLeft with its own transition (NOT transition-all).
        transition-all was the bug: it applies to EVERY CSS property, so when
        the sidebar animates width, the browser recalculates layout on every
        frame, causing the "jump" affect. By specifying ONLY margin-left in the
        transition, we isolate the reflow to a single property.
      */}
      <main
        className="flex-1 overflow-x-hidden mt-14 md:mt-0 min-w-0"
        style={{
          marginLeft: `${sidebarWidth}px`,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'margin-left',
        }}
      >
        {/* Top bar */}
        <div
          className="hidden md:flex items-center justify-between h-14 px-6 sticky top-0 z-30"
          style={{
            background: 'rgba(8,10,25,0.92)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">Welcome,</span>
            <span className="font-heading font-semibold text-sm text-white/80">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </span>
          </div>
          <span
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}
          >
            {role}
          </span>
        </div>

        {/* Page content */}
        <div className="p-4 md:p-6 page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}

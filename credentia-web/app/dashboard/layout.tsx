'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, Shield, CreditCard, GraduationCap, Link2,
  ChevronLeft, ChevronRight, LogOut, Menu, X, Home, Users, Settings,
  BookmarkCheck, BarChart3, ClipboardList, Building2, Briefcase,
  ScrollText, Bell, Search
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
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/company' },
    { label: 'Talent Search', icon: Search, href: '/dashboard/company' },
    { label: 'Saved Candidates', icon: BookmarkCheck, href: '/dashboard/company/saved' },
    { label: 'Analytics', icon: BarChart3, href: '/dashboard/company/analytics' },
    { label: 'Settings', icon: Settings, href: '/dashboard/company/settings' },
    { label: 'Home', icon: Home, href: '/' },
  ],
  university: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/university' },
    { label: 'Student Registry', icon: Users, href: '/dashboard/university' },
    { label: 'Analytics', icon: BarChart3, href: '/dashboard/university/analytics' },
    { label: 'Settings', icon: Settings, href: '/dashboard/university/settings' },
    { label: 'Home', icon: Home, href: '/' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/admin' },
    { label: 'All Users', icon: Users, href: '/dashboard/admin/users' },
    { label: 'Verifications', icon: Shield, href: '/dashboard/admin/verifications' },
    { label: 'Audit Logs', icon: ScrollText, href: '/dashboard/admin/audit' },
    { label: 'Universities', icon: Building2, href: '/dashboard/admin/outreach' },
    { label: 'Companies', icon: Briefcase, href: '/dashboard/admin/companies' },
    { label: 'Settings', icon: Settings, href: '/dashboard/admin/settings' },
    { label: 'Home', icon: Home, href: '/' },
  ],
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

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (prof) { setProfile(prof); setRole(prof.role) }
      setLoading(false)
    }
    init()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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

  const roleColors: Record<string, { bg: string; text: string; border: string }> = {
    student: { bg: 'rgba(59,130,246,0.12)', text: 'rgba(96,165,250,0.9)', border: 'rgba(59,130,246,0.2)' },
    company: { bg: 'rgba(16,185,129,0.12)', text: 'rgba(52,211,153,0.9)', border: 'rgba(16,185,129,0.2)' },
    university: { bg: 'rgba(139,92,246,0.12)', text: 'rgba(167,139,250,0.9)', border: 'rgba(139,92,246,0.2)' },
    admin: { bg: 'rgba(239,68,68,0.12)', text: 'rgba(248,113,113,0.9)', border: 'rgba(239,68,68,0.2)' },
  }

  const rc = roleColors[role] || roleColors.student

  return (
    <div className="min-h-screen flex bg-[#0A0A0F]">

      {/* ── Desktop Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40"
        style={{
          background: 'linear-gradient(180deg, rgba(14,17,40,0.95) 0%, rgba(8,10,25,0.98) 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 gap-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/10">
            <Image src="/logo.png" alt="C" fill className="object-contain p-0.5" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="font-heading text-sm font-bold tracking-wide text-white"
              >
                CREDENTIA
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== '/' && link.href !== '/dashboard/student' && link.href !== '/dashboard/company' && link.href !== '/dashboard/university' && link.href !== '/dashboard/admin' && pathname.startsWith(link.href))
            const exactActive = pathname === link.href
            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative group"
                style={{
                  color: exactActive ? 'white' : 'rgba(255,255,255,0.45)',
                  background: exactActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                }}
                title={collapsed ? link.label : undefined}
              >
                {exactActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-blue-500"
                    style={{ boxShadow: '0 0 12px rgba(59,130,246,0.6)' }}
                  />
                )}
                <link.icon size={18} className={`flex-shrink-0 transition-colors ${exactActive ? 'text-blue-400' : 'group-hover:text-white/70'}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={exactActive ? '' : 'group-hover:text-white/70'}
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!collapsed && profile && (
            <div className="px-3 py-2 mb-2">
              <p className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Signed in as</p>
              <p className="text-xs text-white/70 font-medium truncate mt-0.5">{profile.full_name || user?.email?.split('@')[0]}</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all hover:bg-white/5"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && 'Collapse'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all hover:bg-red-500/10"
            style={{ color: 'rgba(239,68,68,0.7)' }}
          >
            <LogOut size={18} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </motion.aside>

      {/* ── Mobile Header ── */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4"
        style={{
          background: 'rgba(10,10,15,0.95)',
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

      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] z-50 md:hidden flex flex-col"
              style={{
                background: 'linear-gradient(180deg, rgba(14,17,40,0.98) 0%, rgba(8,10,25,1) 100%)',
                borderRight: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="font-heading font-bold text-sm text-white tracking-wide">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="text-white/40 hover:text-white/80 transition-colors"><X size={20} /></button>
              </div>
              <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
                {links.map((link) => {
                  const active = pathname === link.href
                  return (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        color: active ? 'white' : 'rgba(255,255,255,0.45)',
                        background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                      }}
                    >
                      <link.icon size={18} className={active ? 'text-blue-400' : ''} />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'} mt-14 md:mt-0`}>
        {/* Top bar */}
        <div
          className="hidden md:flex items-center justify-between h-14 px-6"
          style={{
            background: 'rgba(10,10,15,0.8)',
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

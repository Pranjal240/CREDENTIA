'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, Shield, CreditCard, GraduationCap, Link2, Building2, Users,
  ChevronLeft, ChevronRight, LogOut, Bell, Settings, Menu, X
} from 'lucide-react'

const sidebarLinks: Record<string, { label: string; icon: any; href: string }[]> = {
  student: [
    { label: 'Overview', icon: LayoutDashboard, href: '/dashboard/student' },
    { label: 'Resume', icon: FileText, href: '/dashboard/student/resume' },
    { label: 'Police', icon: Shield, href: '/dashboard/student/police' },
    { label: 'Aadhaar', icon: CreditCard, href: '/dashboard/student/aadhaar' },
    { label: 'Degree', icon: GraduationCap, href: '/dashboard/student/degree' },
    { label: 'My Link', icon: Link2, href: '/dashboard/student/my-link' },
  ],
  company: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/company' },
    { label: 'Candidates', icon: Users, href: '/dashboard/company/candidates' },
    { label: 'Settings', icon: Settings, href: '/dashboard/company/settings' },
  ],
  university: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/university' },
    { label: 'Students', icon: Users, href: '/dashboard/university/students' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/admin' },
    { label: 'Police Queue', icon: Shield, href: '/dashboard/admin/police' },
    { label: 'Companies', icon: Building2, href: '/dashboard/admin/companies' },
    { label: 'Universities', icon: GraduationCap, href: '/dashboard/admin/universities' },
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'rgb(var(--bg-base))' }}>
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const links = sidebarLinks[role] || sidebarLinks.student

  return (
    <div className="min-h-screen flex" style={{ background: 'rgb(var(--bg-base))' }}>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3 }}
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-40 border-r"
        style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 gap-2.5 border-b" style={{ borderColor: 'rgba(var(--border-default), 0.3)' }}>
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="C" fill className="object-contain p-0.5" />
          </div>
          {!collapsed && <span className="font-syne text-base font-extrabold" style={{ color: 'rgb(var(--text-primary))' }}>CREDENTIA</span>}
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'text-white'
                    : ''
                }`}
                style={{
                  color: active ? 'white' : 'rgb(var(--text-secondary))',
                  background: active ? 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-hover)))' : 'transparent',
                }}
                title={collapsed ? link.label : undefined}
              >
                <link.icon size={20} className="flex-shrink-0" />
                {!collapsed && link.label}
              </Link>
            )
          })}
        </nav>

        {/* Collapse + Logout */}
        <div className="p-3 space-y-1 border-t" style={{ borderColor: 'rgba(var(--border-default), 0.3)' }}>
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all" style={{ color: 'rgb(var(--text-muted))' }}>
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!collapsed && 'Collapse'}
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-red-500/5" style={{ color: 'rgb(var(--danger))' }}>
            <LogOut size={20} />
            {!collapsed && 'Sign Out'}
          </button>
        </div>
      </motion.aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 border-b" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
        <button onClick={() => setMobileOpen(true)} className="p-1.5"><Menu size={20} style={{ color: 'rgb(var(--text-primary))' }} /></button>
        <span className="font-syne font-bold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>CREDENTIA</span>
        <button onClick={handleLogout} className="p-1.5"><LogOut size={18} style={{ color: 'rgb(var(--danger))' }} /></button>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/40 z-40 md:hidden" />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="fixed left-0 top-0 bottom-0 w-[260px] z-50 md:hidden border-r" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
              <div className="h-14 flex items-center justify-between px-4 border-b" style={{ borderColor: 'rgba(var(--border-default), 0.3)' }}>
                <span className="font-syne font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Menu</span>
                <button onClick={() => setMobileOpen(false)}><X size={20} style={{ color: 'rgb(var(--text-muted))' }} /></button>
              </div>
              <nav className="py-4 px-2 space-y-1">
                {links.map((link) => {
                  const active = pathname === link.href
                  return (
                    <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium" style={{ color: active ? 'white' : 'rgb(var(--text-secondary))', background: active ? 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-hover)))' : 'transparent' }}>
                      <link.icon size={20} />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? 'md:ml-[72px]' : 'md:ml-[260px]'} mt-14 md:mt-0`}>
        {/* Top bar */}
        <div className="hidden md:flex items-center justify-between h-16 px-6 border-b" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.3)' }}>
          <div>
            <span className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>Welcome back,</span>
            <span className="font-syne font-bold text-sm ml-1" style={{ color: 'rgb(var(--text-primary))' }}>
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-medium capitalize" style={{ background: 'rgba(var(--accent), 0.1)', color: 'rgb(var(--accent))' }}>
              {role}
            </span>
            <button className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ color: 'rgb(var(--text-muted))' }}>
              <Bell size={18} />
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 md:p-6 page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}

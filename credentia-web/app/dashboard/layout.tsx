'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, FileText, Shield, CreditCard,
  GraduationCap, Link2, LogOut, Users, Building2,
  BarChart3, Settings, Menu, X
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

const studentNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/student' },
  { icon: FileText, label: 'Resume', href: '/dashboard/student/resume' },
  { icon: Shield, label: 'Police Verify', href: '/dashboard/student/police' },
  { icon: CreditCard, label: 'Aadhaar', href: '/dashboard/student/aadhaar' },
  { icon: GraduationCap, label: 'Degree', href: '/dashboard/student/degree' },
  { icon: Link2, label: 'My Link', href: '/dashboard/student/my-link' },
]

const companyNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/company' },
  { icon: Users, label: 'Candidates', href: '/dashboard/company/candidates' },
  { icon: Settings, label: 'Settings', href: '/dashboard/company/settings' },
]

const universityNav = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/university' },
  { icon: Users, label: 'Students', href: '/dashboard/university/students' },
]

const adminNav = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard/admin' },
  { icon: Shield, label: 'Police Verified', href: '/dashboard/admin/police-verified' },
  { icon: Building2, label: 'Companies', href: '/dashboard/admin/companies' },
  { icon: GraduationCap, label: 'Universities', href: '/dashboard/admin/universities' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/admin/analytics' },
]

function getNav(role: string) {
  if (role === 'company') return companyNav
  if (role === 'university') return universityNav
  if (role === 'admin') return adminNav
  return studentNav
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setUser(user)
      setProfile(p)
      setLoading(false)
    }
    init()
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#F5C542] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const role = profile?.role || 'student'
  const nav = getNav(role)
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-[#13131A] border border-[#2A2A3A] flex items-center justify-center text-white"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-64 bg-[#13131A] border-r border-[#2A2A3A] flex flex-col fixed h-full z-40 transition-transform duration-300`}>
        <div className="p-5 border-b border-[#2A2A3A]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5C542] flex items-center justify-center flex-shrink-0">
              <span className="text-black font-black text-sm">C</span>
            </div>
            <span className="font-bold text-lg text-[#F5C542] font-syne tracking-tight">CREDENTIA</span>
          </Link>
        </div>

        <div className="px-5 py-3 border-b border-[#2A2A3A]">
          <span className="text-xs uppercase tracking-widest text-[#9999AA] font-semibold">{role} portal</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map(item => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard/' + role)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#F5C542]/10 text-[#F5C542] border border-[#F5C542]/20'
                    : 'text-[#9999AA] hover:text-white hover:bg-[#1C1C26]'
                }`}
              >
                <item.icon size={17} className={isActive ? 'text-[#F5C542]' : 'group-hover:text-[#F5C542] transition-colors'} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#2A2A3A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F5C542] to-[#D4A017] flex items-center justify-center text-black font-bold text-sm flex-shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{displayName}</p>
              <p className="text-[#9999AA] text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#9999AA] hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="md:ml-64 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}

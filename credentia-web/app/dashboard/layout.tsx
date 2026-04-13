'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, FileText, Shield, CreditCard, GraduationCap, Link2,
  ChevronLeft, ChevronRight, LogOut, Menu, X, Home, Users, Settings,
  BookmarkCheck, BarChart3, ClipboardList, Building2, Briefcase,
  ScrollText, Search, Sun, Moon, Headphones
} from 'lucide-react'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import { SupportChat } from '@/components/SupportChat'

const sidebarLinks: Record<string, { label: string; icon: any; href: string }[]> = {
  student: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard/student' },
    { label: 'Overview', icon: ClipboardList, href: '/dashboard/student/overview' },
    { label: 'Resume', icon: FileText, href: '/dashboard/student/resume' },
    { label: 'Police', icon: Shield, href: '/dashboard/student/police' },
    { label: 'Aadhaar', icon: CreditCard, href: '/dashboard/student/aadhaar' },
    { label: 'Degree', icon: GraduationCap, href: '/dashboard/student/degree' },
    { label: 'Company Apply', icon: Briefcase, href: '/dashboard/student/apply' },
    { label: 'My Verifications', icon: BookmarkCheck, href: '/dashboard/student/saved' },
    { label: 'My Link', icon: Link2, href: '/dashboard/student/my-link' },
    { label: 'Settings', icon: Settings, href: '/dashboard/student/settings' },
    { label: 'Support', icon: Headphones, href: '#support' },
    { label: 'Home', icon: Home, href: '/' },
  ],
  company: [
    { label: 'Talent Search', icon: Search, href: '/dashboard/company' },
    { label: 'Applicants', icon: Users, href: '/dashboard/company/applicants' },
    { label: 'Saved Candidates', icon: BookmarkCheck, href: '/dashboard/company/saved' },
    { label: 'Analytics', icon: BarChart3, href: '/dashboard/company/analytics' },
    { label: 'Settings', icon: Settings, href: '/dashboard/company/settings' },
    { label: 'Support', icon: Headphones, href: '#support' },
    { label: 'Home', icon: Home, href: '/' },
  ],
  university: [
    { label: 'Student Registry', icon: Users, href: '/dashboard/university' },
    { label: 'Analytics', icon: BarChart3, href: '/dashboard/university/analytics' },
    { label: 'Settings', icon: Settings, href: '/dashboard/university/settings' },
    { label: 'Support', icon: Headphones, href: '#support' },
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
    { label: 'Support Inbox', icon: Headphones, href: '/dashboard/admin/support' },
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
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [role, setRole] = useState<string>('student')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isDesktop, setIsDesktop] = useState(true)
  const [supportChatOpen, setSupportChatOpen] = useState(false)

  // Avoid hydration mismatch for theme toggle
  useEffect(() => { setMounted(true) }, [])

  // Sidebar width values — used in JS for the main margin, NOT transition-all
  const SIDEBAR_OPEN = 260
  const SIDEBAR_CLOSED = 72

  // Track viewport for sidebar margin — mobile has NO margin
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Infer role from pathname as an immediate fallback — avoids wrong sidebar during load
  const inferredRole = (() => {
    if (pathname.startsWith('/dashboard/admin')) return 'admin'
    if (pathname.startsWith('/dashboard/university')) return 'university'
    if (pathname.startsWith('/dashboard/company')) return 'company'
    return 'student'
  })()

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          // No session at all — must redirect to login
          router.push(`/login/${inferredRole}`)
          return
        }

        const authUser = session.user
        if (!isMounted) return
        setUser(authUser)

        // Fetch profile — but a failure here should NOT kick the user out.
        // The user is authenticated; we just couldn't load extra profile data.
        try {
          const { data: prof, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (!isMounted) return

          if (prof && !profError) {
            let entityName = null
            if (prof.role === 'company') {
              const { data: c } = await supabase.from('companies').select('company_name').eq('id', authUser.id).single()
              entityName = c?.company_name
            } else if (prof.role === 'university') {
              const { data: u } = await supabase.from('universities').select('university_name').eq('id', authUser.id).single()
              entityName = u?.university_name
            } else if (prof.role === 'student') {
              const { data: s } = await supabase.from('students').select('name').eq('id', authUser.id).single()
              entityName = s?.name
            }
            // Inject display_name directly into the profile object
            setProfile({ ...prof, display_name: entityName || prof.full_name })
            setRole(prof.role)
          } else {
            // Profile fetch failed — use URL-inferred role as fallback
            setRole(inferredRole)
          }
        } catch {
          // Profile fetch network error — still proceed with inferred role
          if (isMounted) setRole(inferredRole)
        }

        if (isMounted) setLoading(false)
      } catch (err) {
        console.error('[Dashboard Layout] Auth init error:', err)
        if (isMounted) {
          // Even on error, use URL-inferred role and show the dashboard.
          // Only redirect if the error is specifically about missing session.
          setRole(inferredRole)
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      isMounted = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch profile and entity data in real-time
  useEffect(() => {
    if (!user?.id) return
    
    // Subscribe to profile updates (e.g. avatar changes)
    const profChannel = supabase.channel('sidebar_profile_sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, (payload: any) => {
        if (payload.new) setProfile((prev: any) => prev ? { ...prev, ...payload.new, display_name: prev.display_name || payload.new.full_name } : payload.new)
      })
      .subscribe()
      
    // Subscribe to specific role tables for name updates
    const getTableName = () => role === 'company' ? 'companies' : role === 'university' ? 'universities' : 'students'
    const nameField = role === 'company' ? 'company_name' : role === 'university' ? 'university_name' : 'name'
    
    const roleChannel = supabase.channel('sidebar_entity_sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: getTableName(), filter: `id=eq.${user.id}` }, (payload: any) => {
        if (payload.new && payload.new[nameField]) {
          setProfile((prev: any) => prev ? { ...prev, display_name: payload.new[nameField] } : null)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(profChannel); supabase.removeChannel(roleChannel) }
  }, [user?.id, role])

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
      <div className="min-h-screen flex items-center justify-center bg-base transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs text-text-muted font-medium tracking-wider">LOADING</span>
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
          background: 'var(--c-sidebar-bg)',
          borderRight: '1px solid rgba(var(--border-default), 0.3)',
        }}
      >
        {/* Logo */}
        <div
          className="h-16 flex items-center px-4 gap-2.5 flex-shrink-0 overflow-hidden"
          style={{ borderBottom: '1px solid rgba(var(--border-default), 0.3)' }}
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-border">
            <Image src="/logo.png" alt="C" fill className="object-contain p-0.5" />
          </div>
          <span
            className="font-heading text-sm font-bold tracking-wide text-text-primary whitespace-nowrap overflow-hidden"
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
            const isSupportLink = link.href === '#support'

            if (isSupportLink) {
              return (
                <button
                  key={link.href + link.label}
                  onClick={() => setSupportChatOpen(prev => !prev)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium group relative overflow-hidden whitespace-nowrap"
                  style={{
                    color: supportChatOpen ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                    background: supportChatOpen ? 'rgba(var(--accent-rgb), 0.15)' : 'transparent',
                    transition: 'background 0.15s ease, color 0.15s ease',
                  }}
                  title={collapsed ? link.label : undefined}
                >
                  {supportChatOpen && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-500"
                      style={{ boxShadow: '0 0 12px rgba(59,130,246,0.6)' }}
                    />
                  )}
                  <link.icon
                    size={18}
                    className="flex-shrink-0"
                    style={{ color: supportChatOpen ? '#60a5fa' : undefined, transition: 'color 0.15s ease' }}
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
                </button>
              )
            }

            return (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium group relative overflow-hidden whitespace-nowrap"
                style={{
                  color: active ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                  background: active ? 'rgba(var(--accent-rgb), 0.15)' : 'transparent',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                title={collapsed ? link.label : undefined}
              >
                {/* Active indicator bar */}
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
        <div className="p-3 space-y-1 flex-shrink-0 overflow-hidden" style={{ borderTop: '1px solid rgba(var(--border-default), 0.3)' }}>
          {profile && (
            <div
              className="px-3 py-2 mb-2 flex items-center gap-3 overflow-hidden"
              style={{
                opacity: collapsed ? 0 : 1,
                maxHeight: collapsed ? 0 : 60,
                transition: 'opacity 0.2s ease, max-height 0.3s ease',
              }}
            >
              <ProfileAvatar 
                profile={profile} 
                userId={user?.id}
                onUploadSuccess={(url) => setProfile({ ...profile, avatar_url: url })}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-[11px] text-text-muted uppercase tracking-wider font-medium">Signed in as</p>
                <p className="font-medium text-text-primary text-xs truncate w-full">{profile?.display_name || profile?.full_name || user?.email?.split('@')[0]}</p>
              </div>
            </div>
          )}
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5 overflow-hidden text-text-muted"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {mounted && (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />)}
            <span
              style={{
                opacity: collapsed ? 0 : 1,
                maxWidth: collapsed ? 0 : 120,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.2s ease, max-width 0.3s ease',
              }}
            >
              {mounted && (theme === 'dark' ? 'Switch to Light' : 'Switch to Dark')}
            </span>
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5 overflow-hidden text-text-muted"
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
          background: 'var(--c-mobile-header-bg)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(var(--border-default), 0.3)',
        }}
      >
        <button onClick={() => setMobileOpen(true)} className="p-1.5 text-text-muted hover:text-text-primary transition-colors">
          <Menu size={20} />
        </button>
        <span className="font-heading font-bold text-xs tracking-widest text-text-primary">CREDENTIA</span>
        <div className="flex items-center gap-2">
          {profile && (
            <div className="mr-1 transform scale-90">
              <ProfileAvatar 
                profile={profile} 
                userId={user?.id}
                onUploadSuccess={(url) => setProfile({ ...profile, avatar_url: url })}
                size="sm"
              />
            </div>
          )}
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 text-text-muted hover:text-text-primary transition-colors"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
          <button onClick={handleLogout} className="p-1.5 text-red-500/80 hover:text-red-600 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
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
                background: 'var(--c-sidebar-bg)',
                borderRight: '1px solid rgba(var(--border-default), 0.3)',
                willChange: 'transform',
              }}
            >
              <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: '1px solid rgba(var(--border-default), 0.3)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-border">
                    <Image src="/logo.png" alt="C" fill className="object-contain" />
                  </div>
                  <span className="font-heading font-bold text-sm text-text-primary tracking-wide">CREDENTIA</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-text-muted hover:text-text-primary transition-colors p-1">
                  <X size={20} />
                </button>
              </div>

              {/* Role badge */}
              <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(var(--border-default), 0.2)' }}>
                <ProfileAvatar 
                  profile={profile} 
                  userId={user?.id}
                  onUploadSuccess={(url) => setProfile({ ...profile, avatar_url: url })}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">Signed in as</p>
                  <p className="text-xs text-text-primary font-medium mt-0.5 truncate">{profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || 'User'}</p>
                  <span
                    className="mt-1.5 inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}
                  >
                    {role}
                  </span>
                </div>
              </div>

              <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
                {links.map((link) => {
                  const active = pathname === link.href
                  const isSupportLink = link.href === '#support'

                  if (isSupportLink) {
                    return (
                      <button
                        key={link.href + link.label}
                        onClick={() => {
                          setSupportChatOpen(prev => !prev)
                          setMobileOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors relative"
                        style={{
                          color: supportChatOpen ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                          background: supportChatOpen ? 'rgba(var(--accent-rgb), 0.15)' : 'transparent',
                        }}
                      >
                        {supportChatOpen && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-500" />
                        )}
                        <link.icon size={18} style={{ color: supportChatOpen ? '#60a5fa' : undefined }} />
                        {link.label}
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors relative"
                      style={{
                        color: active ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))',
                        background: active ? 'rgba(var(--accent-rgb), 0.15)' : 'transparent',
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
          marginLeft: isDesktop ? `${sidebarWidth}px` : 0,
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'margin-left',
        }}
      >
        {/* Top bar */}
        <div
          className="hidden md:flex items-center justify-between h-14 px-6 sticky top-0 z-30"
          style={{
            background: 'var(--c-topbar-bg)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(var(--border-default), 0.3)',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mr-2"
              style={{ background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}
            >
              {role}
            </span>
            <span className="text-xs text-text-muted hidden sm:inline">Welcome,</span>
            <span className="font-heading font-semibold text-sm text-text-primary hidden sm:inline">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </span>
            {profile && (
              <ProfileAvatar 
                profile={profile} 
                userId={user?.id}
                onUploadSuccess={(url) => setProfile({ ...profile, avatar_url: url })}
                size="sm"
              />
            )}
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 md:p-6 page-enter">
          {children}
        </div>
      </main>

      {/* Support Chat Widget — visible on all portals except admin */}
      {role !== 'admin' && user && profile && (
        <SupportChat
          userId={user.id}
          userRole={role}
          userName={profile.full_name || user.email?.split('@')[0] || 'User'}
          userEmail={profile.email || user.email || ''}
          externalOpen={supportChatOpen}
          onOpenChange={setSupportChatOpen}
        />
      )}
    </div>
  )
}

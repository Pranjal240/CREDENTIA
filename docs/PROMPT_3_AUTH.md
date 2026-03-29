# PROMPT 3 — AUTHENTICATION SYSTEM
# Paste into Antigravity (Claude Opus 4.6). Attach 01_PROJECT_OVERVIEW.md.

---

Build CREDENTIA's complete authentication system. This includes login page, register page, auth callback, and role-based routing. Everything must actually work — Google OAuth and email/password both.

ADMIN RULE: Only `pranjalmishra2409@gmail.com` can access admin dashboard. Any other email trying to reach /dashboard/admin gets redirected to their role dashboard.

---

## FILE 1 — `credentia-web/app/login/page.tsx`

This is the main login page at `/login`.

Design: Full-screen dark bg #0A0A0F, centered card with glassmorphism, golden CREDENTIA logo at top.

**Role Selection (shown first):**
4 large role cards before the form appears:
- 🎓 Student — "Verify your credentials"
- 🏢 Company — "Find verified talent"
- 🏫 University — "Manage your students"
- 🔐 Admin — "Platform management" (subtle, no description)

When user clicks a role card, the card animates out and the login form slides in. A "← Back" button returns to role selection.

**Login Form (appears after role selection):**
- Role badge at top showing selected role
- Email input
- Password input with show/hide toggle
- "Sign In" yellow button (full working)
- "Forgot password?" link
- Divider "or"
- "Continue with Google" button (ONLY for Student and Company roles — hide for University and Admin)
- "Don't have an account? Sign up" → /register

**Logic:**
```typescript
const handleLogin = async (e) => {
  e.preventDefault()
  setLoading(true)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) { setError(error.message); setLoading(false); return }
  
  // Get role from profiles table
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
  const role = profile?.role || 'student'
  
  // Admin protection
  if (role === 'admin' && data.user.email !== 'pranjalmishra2409@gmail.com') {
    await supabase.auth.signOut()
    setError('Unauthorized access.')
    setLoading(false)
    return
  }
  
  router.push(`/dashboard/${role}`)
  router.refresh()
}

const handleGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` }
  })
}
```

**Beautiful UI details:**
- Role cards: glass cards with large emoji, role name, description, hover scale
- Selected role: golden border + bg-[#F5C542]/10
- Form inputs: dark bg with golden focus border
- Sign In button: bg-[#F5C542] with loading spinner
- Error: red rounded alert box
- Framer Motion: role cards fade out, form slides in from right

---

## FILE 2 — `credentia-web/app/register/page.tsx`

Register page at `/register`.

Same design as login. Steps:
1. Role selection (Student / Company / University — NO Admin option)
2. Registration form:
   - Full Name
   - Email
   - Password (min 6 chars)
   - Confirm Password
   - Role is pre-set from step 1

Logic:
```typescript
const handleRegister = async (e) => {
  e.preventDefault()
  if (password !== confirmPassword) { setError('Passwords do not match'); return }
  if (password.length < 6) { setError('Password must be 6+ characters'); return }
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role: selectedRole },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  })
  
  if (error) { setError(error.message); return }
  setSuccess(true) // Show "Check your email" screen
}
```

Success screen: Nice animated card with 📧 emoji, "Check your email!" message, email shown, "Back to Login" button.

---

## FILE 3 — `credentia-web/app/auth/callback/route.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/login?error=' + error, request.url))
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set(name, value, options) { try { cookieStore.set({ name, value, ...options }) } catch {} },
          remove(name, options) { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
        },
      }
    )

    const { data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (data.user) {
      // Check if admin email trying to access
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      
      const role = profile?.role || 'student'
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login', request.url))
}
```

---

## FILE 4 — `credentia-web/app/dashboard/layout.tsx`

Shared layout for all dashboard pages. This provides the sidebar and ensures auth:

```typescript
'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, FileText, Shield, CreditCard,
  GraduationCap, Link2, LogOut, Users, Building2,
  BarChart3, Settings, University
} from 'lucide-react'
import { getInitials } from '@/lib/utils'

// Nav items per role
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
  { icon: University, label: 'Universities', href: '/dashboard/admin/universities' },
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
      {/* Sidebar */}
      <aside className="w-64 bg-[#13131A] border-r border-[#2A2A3A] flex flex-col fixed h-full z-20">
        {/* Logo */}
        <div className="p-5 border-b border-[#2A2A3A]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5C542] flex items-center justify-center flex-shrink-0">
              <span className="text-black font-black text-sm">C</span>
            </div>
            <span className="font-bold text-lg text-[#F5C542] font-syne tracking-tight">CREDENTIA</span>
          </Link>
        </div>

        {/* Role badge */}
        <div className="px-5 py-3 border-b border-[#2A2A3A]">
          <span className="text-xs uppercase tracking-widest text-[#9999AA] font-semibold">{role} portal</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
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

        {/* User profile + logout */}
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

      {/* Main content */}
      <main className="ml-64 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}
```

---

## FILE 5 — `credentia-web/app/dashboard/page.tsx`

Redirect to the right dashboard based on role:

```typescript
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export default async function DashboardRoot() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role || 'student'
  
  redirect(`/dashboard/${role}`)
}
```

---

## FILE 6 — Stub pages (create these empty stubs so build passes)

Create minimal stub files for:
- `credentia-web/app/dashboard/student/page.tsx` → `export default function Page() { return <div>Loading...</div> }`
- `credentia-web/app/dashboard/company/page.tsx` → same stub
- `credentia-web/app/dashboard/university/page.tsx` → same stub
- `credentia-web/app/dashboard/admin/page.tsx` → same stub

These will be replaced in Prompt 4 and 5.

---

## FINAL

Run `npm run build` and fix all errors. Build must pass.

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Eye, EyeOff, GraduationCap, Building2, School, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Role = 'student' | 'company' | 'university' | 'admin'

const tabs: { id: Role; label: string; icon: React.ReactNode }[] = [
  { id: 'student', label: 'Student', icon: <GraduationCap size={16} /> },
  { id: 'company', label: 'Company', icon: <Building2 size={16} /> },
  { id: 'university', label: 'University', icon: <School size={16} /> },
  { id: 'admin', label: 'Admin', icon: <Lock size={16} /> },
]

const floatingBadges = ['✅ Resume Score: 94/100', '✅ Police Verified — Delhi', '🎓 Degree Verified — B.Tech CSE']

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Role>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ROLE_ROUTES: Record<string, string> = {
    student: '/dashboard/student',
    company: '/dashboard/company',
    university: '/dashboard/university',
    admin: '/dashboard/admin',
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      router.push(ROLE_ROUTES[profile?.role || 'student'])
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (oauthError) {
      setError('Google login is not available right now. Please use email/password.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden md:flex md:w-[55%] relative bg-gradient-to-br from-[#0A0A0F] to-[#1C1C26] items-center justify-center p-12 overflow-hidden">
        <div className="orb w-80 h-80 bg-purple-600/20 top-10 left-10 animate-float-1" />
        <div className="orb w-60 h-60 bg-[#F5C542]/10 bottom-10 right-10 animate-float-2" />
        <div className="relative z-10 text-center">
          <h1 className="font-syne font-extrabold text-5xl text-[#F5C542] mb-4">CREDENTIA</h1>
          <p className="text-[#9999AA] text-lg mb-12">Verify Once. Trusted Forever.</p>
          <div className="flex flex-col gap-4">
            {floatingBadges.map((badge, i) => (
              <motion.div
                key={badge}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.7, ease: 'easeInOut' }}
                className="rounded-full bg-[#13131A] border border-[#F5C542]/20 text-white text-sm px-6 py-3"
              >
                {badge}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 dark:bg-[#13131A] bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <h2 className="font-syne font-bold text-3xl dark:text-white text-gray-900 mb-2">
            Welcome Back 👋
          </h2>
          <p className="dark:text-[#9999AA] text-gray-500 mb-8">Sign in to your CREDENTIA account</p>

          {/* Role tabs */}
          <div className="relative flex border-b dark:border-[#2A2A3A] border-gray-200 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'dark:text-white text-gray-900'
                    : 'dark:text-[#9999AA] text-gray-400'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            {/* Sliding indicator */}
            <motion.div
              className="absolute bottom-0 h-0.5 bg-[#F5C542]"
              animate={{
                left: `${tabs.findIndex((t) => t.id === activeTab) * 25}%`,
                width: '25%',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9999AA]" size={16} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-[#0A0A0F] bg-gray-50 border dark:border-[#2A2A3A] border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-[#F5C542] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9999AA]" size={16} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 rounded-xl dark:bg-[#0A0A0F] bg-gray-50 border dark:border-[#2A2A3A] border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-[#F5C542] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9999AA] hover:text-white"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#F5C542] text-black font-semibold hover:bg-[#D4A017] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                `Login as ${tabs.find((t) => t.id === activeTab)?.label}`
              )}
            </button>

            {/* Google */}
            <div className="relative text-center">
              <span className="text-xs dark:text-[#9999AA] text-gray-400 bg-transparent px-2">or continue with</span>
            </div>
            <button
              type="button"
              onClick={handleGoogle}
              className="w-full py-3 rounded-xl border dark:border-[#2A2A3A] border-gray-200 dark:text-white text-gray-800 text-sm font-medium hover:dark:bg-[#1C1C26] hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-sm dark:text-[#9999AA] text-gray-500">
              New here?{' '}
              <Link href="/register" className="text-[#F5C542] hover:underline">
                Create account →
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

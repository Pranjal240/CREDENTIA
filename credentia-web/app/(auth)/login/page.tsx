'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Role = 'student' | 'company' | 'university' | 'admin'

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Role>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Get role and redirect
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = profile?.role || 'student'
      router.push(`/dashboard/${role}`)
      router.refresh()
    }
  }

  const handleGoogleInfo = async () => {
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
      },
    })
    if (oauthError) {
      setError(oauthError.message)
    }
  }

  const roleNames = {
    student: 'Student',
    company: 'Company',
    university: 'University',
    admin: 'Admin'
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#13131A] border border-[#2A2A3A] rounded-2xl shadow-2xl overflow-hidden p-8">
        
        {/* LOGO */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <div className="w-16 h-16 rounded-full bg-[#1C1C26] border border-[#2A2A3A] flex items-center justify-center hover:border-[#F5C542] transition-colors mb-4 content-center shadow-[0_0_15px_rgba(245,197,66,0.1)]">
               <span className="font-[family-name:var(--font-syne)] font-black text-2xl text-[#F5C542]">C</span>
            </div>
          </Link>
          <Link href="/">
            <h1 className="font-[family-name:var(--font-syne)] font-extrabold text-3xl text-[#F5C542] tracking-tight">CREDENTIA</h1>
          </Link>
          <p className="text-[#9999AA] text-sm mt-2 font-[family-name:var(--font-dm-sans)]">Welcome back, please sign in</p>
        </div>

        {/* ROLE TABS */}
        <div className="flex bg-[#1C1C26] rounded-xl p-1 mb-8 overflow-x-auto no-scrollbar border border-[#2A2A3A]">
          {(Object.keys(roleNames) as Role[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-max px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 font-[family-name:var(--font-dm-sans)] ${
                activeTab === tab
                  ? 'bg-[#F5C542] text-black shadow-lg shadow-[#F5C542]/20'
                  : 'text-[#9999AA] hover:text-white hover:bg-[#2A2A3A]'
              }`}
            >
              {roleNames[tab]}
            </button>
          ))}
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl mb-6 font-[family-name:var(--font-dm-sans)]">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5 font-[family-name:var(--font-dm-sans)]">
              Email Address ({roleNames[activeTab]})
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`your.${activeTab}@example.com`}
              required
              className="w-full bg-[#0A0A0F] border border-[#2A2A3A] rounded-xl px-4 py-3 text-white placeholder:text-[#4A4A5A] focus:outline-none focus:border-[#F5C542] focus:ring-1 focus:ring-[#F5C542] transition-colors font-[family-name:var(--font-dm-sans)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5 font-[family-name:var(--font-dm-sans)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#0A0A0F] border border-[#2A2A3A] rounded-xl px-4 py-3 text-white placeholder:text-[#4A4A5A] focus:outline-none focus:border-[#F5C542] focus:ring-1 focus:ring-[#F5C542] transition-colors font-[family-name:var(--font-dm-sans)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F5C542] hover:bg-[#e0b030] text-black font-bold rounded-xl px-4 py-3.5 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center font-[family-name:var(--font-dm-sans)]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-b border-[#2A2A3A]"></div>
          <span className="px-4 text-xs text-[#4A4A5A] font-[family-name:var(--font-dm-sans)]">OR</span>
          <div className="flex-1 border-b border-[#2A2A3A]"></div>
        </div>

        {/* GOOGLE OAUTH */}
        <button
          onClick={handleGoogleInfo}
          type="button"
          className="w-full bg-[#1C1C26] hover:bg-[#2A2A3A] border border-[#2A2A3A] text-white font-medium rounded-xl px-4 py-3 transition-colors flex items-center justify-center gap-3 font-[family-name:var(--font-dm-sans)]"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-[#9999AA] font-[family-name:var(--font-dm-sans)]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-[#F5C542] hover:text-white font-medium transition-colors">
            Register here
          </Link>
        </p>

      </div>
    </div>
  )
}

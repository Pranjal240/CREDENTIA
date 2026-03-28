'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const roles = ['Student', 'Company', 'University', 'Admin']

export default function LoginPage() {
  const router = useRouter()
  const [activeRole, setActiveRole] = useState('Student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
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

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#F5C542] flex items-center justify-center">
            <span className="text-black font-black text-base">C</span>
          </div>
          <span className="font-bold text-2xl text-[#F5C542] tracking-tight" style={{fontFamily:'var(--font-syne, sans-serif)'}}>
            CREDENTIA
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1" style={{fontFamily:'var(--font-syne, sans-serif)'}}>
            Welcome back
          </h1>
          <p className="text-[#9999AA] text-sm mb-6">Sign in to your CREDENTIA account</p>

          {/* Role tabs */}
          <div className="flex gap-1 bg-[#0A0A0F] rounded-xl p-1 mb-6">
            {roles.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setActiveRole(role)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeRole === role
                    ? 'bg-[#F5C542] text-black'
                    : 'text-[#9999AA] hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-[#9999AA] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder={`${activeRole.toLowerCase()}@example.com`}
                className="w-full bg-[#0A0A0F] border border-[#2A2A3A] rounded-xl px-4 py-3 text-white placeholder-[#555566] focus:outline-none focus:border-[#F5C542] transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9999AA] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0A0A0F] border border-[#2A2A3A] rounded-xl px-4 py-3 pr-12 text-white placeholder-[#555566] focus:outline-none focus:border-[#F5C542] transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9999AA] hover:text-white"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F5C542] hover:bg-[#D4A017] text-black font-bold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#2A2A3A]" />
            <span className="text-[#555566] text-xs">or continue with</span>
            <div className="flex-1 h-px bg-[#2A2A3A]" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-[#1C1C26] hover:bg-[#2A2A3A] border border-[#2A2A3A] text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-3 text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-[#9999AA] text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#F5C542] hover:underline font-medium">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

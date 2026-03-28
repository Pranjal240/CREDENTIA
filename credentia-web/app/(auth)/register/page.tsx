'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

const roles = [
  { value: 'student', label: 'Student', desc: 'Get your credentials verified' },
  { value: 'company', label: 'Company', desc: 'Hire verified candidates' },
  { value: 'university', label: 'University', desc: 'Manage student records' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4">
        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-10 text-center max-w-md w-full">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-white mb-3" style={{fontFamily:'var(--font-syne)'}}>Check your email!</h2>
          <p className="text-[#9999AA] mb-6">We sent a verification link to <span className="text-white font-medium">{email}</span>. Click it to activate your account.</p>
          <Link href="/login" className="block w-full bg-[#F5C542] text-black font-bold py-3 rounded-xl text-center hover:bg-[#D4A017] transition">
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#F5C542] flex items-center justify-center">
            <span className="text-black font-black text-base">C</span>
          </div>
          <span className="font-bold text-2xl text-[#F5C542] tracking-tight" style={{fontFamily:'var(--font-syne, sans-serif)'}}>
            CREDENTIA
          </span>
        </div>

        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1" style={{fontFamily:'var(--font-syne, sans-serif)'}}>
            Create account
          </h1>
          <p className="text-[#9999AA] text-sm mb-6">Join thousands of verified professionals</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm text-[#9999AA] mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                placeholder="Pranjal Kumar"
                className="w-full bg-[#0A0A0F] border border-[#2A2A3A] rounded-xl px-4 py-3 text-white placeholder-[#555566] focus:outline-none focus:border-[#F5C542] transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9999AA] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[#0A0A0F] border border-[#2A2A3A] rounded-xl px-4 py-3 text-white placeholder-[#555566] focus:outline-none focus:border-[#F5C542] transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9999AA] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Min 6 characters"
                className="w-full bg-[#0A0A0F] border border-[#2A2A3A] rounded-xl px-4 py-3 text-white placeholder-[#555566] focus:outline-none focus:border-[#F5C542] transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-[#9999AA] mb-2">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      role === r.value
                        ? 'border-[#F5C542] bg-[#F5C542]/10 text-[#F5C542]'
                        : 'border-[#2A2A3A] text-[#9999AA] hover:border-[#F5C542]/50'
                    }`}
                  >
                    <div className="font-semibold text-sm">{r.label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F5C542] hover:bg-[#D4A017] text-black font-bold py-3 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[#9999AA] text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#F5C542] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

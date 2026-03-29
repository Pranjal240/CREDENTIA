'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'

const roles = [
  { id: 'student', emoji: '🎓', label: 'Student', desc: 'Verify your credentials' },
  { id: 'company', emoji: '🏢', label: 'Company', desc: 'Find verified talent' },
  { id: 'university', emoji: '🏫', label: 'University', desc: 'Manage your students' },
  { id: 'admin', emoji: '🔐', label: 'Admin', desc: '' },
]

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'role' | 'form'>('role')
  const [selectedRole, setSelectedRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    const role = profile?.role || 'student'

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

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#7C3AED]/10 blur-[100px] -top-20 -left-20" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[#F5C542]/8 blur-[80px] -bottom-20 -right-20" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#F5C542] flex items-center justify-center mx-auto mb-3">
            <span className="text-black font-black text-xl">C</span>
          </div>
          <h1 className="font-syne text-2xl font-extrabold text-white">Welcome Back</h1>
          <p className="text-[#9999AA] text-sm mt-1">Sign in to your CREDENTIA account</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'role' ? (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <p className="text-[#9999AA] text-sm text-center mb-5">Select your role</p>
              <div className="grid grid-cols-2 gap-3">
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRole(r.id); setStep('form') }}
                    className="glass rounded-xl p-5 border border-[#2A2A3A] hover:border-[#F5C542]/50 hover:bg-[#F5C542]/5 transition-all text-left group"
                  >
                    <span className="text-2xl block mb-2">{r.emoji}</span>
                    <span className="font-syne font-bold text-white text-sm block">{r.label}</span>
                    {r.desc && <span className="text-[#9999AA] text-xs">{r.desc}</span>}
                  </button>
                ))}
              </div>
              <p className="text-center mt-6 text-sm text-[#9999AA]">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-[#F5C542] hover:underline">Sign up</Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <button onClick={() => setStep('role')} className="flex items-center gap-1.5 text-[#9999AA] text-sm hover:text-white mb-5 transition-colors">
                <ArrowLeft size={14} /> Back
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5C542]/10 border border-[#F5C542]/20 text-[#F5C542] text-xs font-medium mb-5">
                {roles.find(r => r.id === selectedRole)?.emoji} {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-[#9999AA] text-xs font-medium block mb-1.5">Email</label>
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-[#1C1C26] border border-[#2A2A3A] text-white text-sm focus:border-[#F5C542] focus:ring-1 focus:ring-[#F5C542]/30 outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-[#9999AA] text-xs font-medium block mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full h-12 px-4 pr-11 rounded-xl bg-[#1C1C26] border border-[#2A2A3A] text-white text-sm focus:border-[#F5C542] focus:ring-1 focus:ring-[#F5C542]/30 outline-none transition-all"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9999AA] hover:text-white">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full h-12 bg-[#F5C542] text-black font-bold rounded-xl hover:bg-[#D4A017] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
                </button>
              </form>

              {(selectedRole === 'student' || selectedRole === 'company') && (
                <>
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-[#2A2A3A]" />
                    <span className="text-[#9999AA] text-xs">or</span>
                    <div className="flex-1 h-px bg-[#2A2A3A]" />
                  </div>
                  <button
                    onClick={handleGoogle}
                    className="w-full h-12 rounded-xl border border-[#2A2A3A] bg-[#1C1C26] text-white text-sm font-medium hover:border-[#F5C542]/30 transition-all flex items-center justify-center gap-2.5"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </button>
                </>
              )}

              <p className="text-center mt-5 text-sm text-[#9999AA]">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-[#F5C542] hover:underline">Sign up</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

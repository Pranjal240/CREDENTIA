'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

const roles = [
  { id: 'student', emoji: '🎓', label: 'Student', desc: 'Verify your credentials' },
  { id: 'company', emoji: '🏢', label: 'Company', desc: 'Find verified talent' },
  { id: 'university', emoji: '🏫', label: 'University', desc: 'Manage your students' },
]

export default function RegisterPage() {
  const [step, setStep] = useState<'role' | 'form' | 'success'>('role')
  const [selectedRole, setSelectedRole] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be 6+ characters'); return }

    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: selectedRole },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })

    if (err) { setError(err.message); setLoading(false); return }
    setStep('success')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[#2563EB]/10 blur-[100px] -top-20 -right-20" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-[#F5C542]/8 blur-[80px] -bottom-20 -left-20" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#F5C542] flex items-center justify-center mx-auto mb-3">
            <span className="text-black font-black text-xl">C</span>
          </div>
          <h1 className="font-syne text-2xl font-extrabold text-white">Create Account</h1>
          <p className="text-[#9999AA] text-sm mt-1">Join CREDENTIA — get verified instantly</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'role' && (
            <motion.div key="role" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-[#9999AA] text-sm text-center mb-5">I am a...</p>
              <div className="space-y-3">
                {roles.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRole(r.id); setStep('form') }}
                    className="w-full glass rounded-xl p-5 border border-[#2A2A3A] hover:border-[#F5C542]/50 hover:bg-[#F5C542]/5 transition-all text-left flex items-center gap-4 group"
                  >
                    <span className="text-3xl">{r.emoji}</span>
                    <div>
                      <span className="font-syne font-bold text-white block">{r.label}</span>
                      <span className="text-[#9999AA] text-xs">{r.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-center mt-6 text-sm text-[#9999AA]">
                Already have an account?{' '}
                <Link href="/login" className="text-[#F5C542] hover:underline">Sign in</Link>
              </p>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <button onClick={() => setStep('role')} className="flex items-center gap-1.5 text-[#9999AA] text-sm hover:text-white mb-5 transition-colors">
                <ArrowLeft size={14} /> Back
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5C542]/10 border border-[#F5C542]/20 text-[#F5C542] text-xs font-medium mb-5">
                {roles.find(r => r.id === selectedRole)?.emoji} {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-[#9999AA] text-xs font-medium block mb-1.5">Full Name</label>
                  <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-[#1C1C26] border border-[#2A2A3A] text-white text-sm focus:border-[#F5C542] focus:ring-1 focus:ring-[#F5C542]/30 outline-none transition-all"
                    placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-[#9999AA] text-xs font-medium block mb-1.5">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-[#1C1C26] border border-[#2A2A3A] text-white text-sm focus:border-[#F5C542] focus:ring-1 focus:ring-[#F5C542]/30 outline-none transition-all"
                    placeholder="you@example.com" />
                </div>
                <div>
                  <label className="text-[#9999AA] text-xs font-medium block mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full h-12 px-4 pr-11 rounded-xl bg-[#1C1C26] border border-[#2A2A3A] text-white text-sm focus:border-[#F5C542] focus:ring-1 focus:ring-[#F5C542]/30 outline-none transition-all"
                      placeholder="Min 6 characters" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9999AA] hover:text-white">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[#9999AA] text-xs font-medium block mb-1.5">Confirm Password</label>
                  <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-[#1C1C26] border border-[#2A2A3A] text-white text-sm focus:border-[#F5C542] focus:ring-1 focus:ring-[#F5C542]/30 outline-none transition-all"
                    placeholder="••••••••" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full h-12 bg-[#F5C542] text-black font-bold rounded-xl hover:bg-[#D4A017] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                </button>
              </form>

              <p className="text-center mt-5 text-sm text-[#9999AA]">
                Already have an account?{' '}
                <Link href="/login" className="text-[#F5C542] hover:underline">Sign in</Link>
              </p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="glass rounded-2xl p-8 border border-[#2A2A3A]">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <h3 className="font-syne text-xl font-bold text-white mb-2">Check your email!</h3>
                <p className="text-[#9999AA] text-sm mb-1">We sent a confirmation link to:</p>
                <p className="text-[#F5C542] font-medium text-sm mb-6">{email}</p>
                <Link href="/login" className="inline-flex items-center gap-2 bg-[#1C1C26] text-white text-sm px-5 py-2.5 rounded-xl border border-[#2A2A3A] hover:border-[#F5C542]/30 transition-all">
                  Back to Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

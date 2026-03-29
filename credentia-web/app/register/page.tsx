'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

const roles = [
  { id: 'student', emoji: '🎓', label: 'Student', desc: 'Verify your credentials', color: 'from-blue-500 to-blue-600' },
  { id: 'company', emoji: '🏢', label: 'Company', desc: 'Find verified talent', color: 'from-teal-500 to-teal-600' },
  { id: 'university', emoji: '🏫', label: 'University', desc: 'Manage your students', color: 'from-indigo-500 to-indigo-600' },
]

export default function RegisterPage() {
  const [step, setStep] = useState<'role' | 'form' | 'success'>('role')
  const [selectedRole, setSelectedRole] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPw) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: selectedRole },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (err) { setError(err.message); setLoading(false); return }
      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'rgb(var(--bg-base))' }}>
      <div className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] -top-40 -right-40" />
      <div className="absolute w-[300px] h-[300px] rounded-full bg-teal-500/8 blur-[80px] -bottom-20 -left-20" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-500/30">
              <Image src="/logo.png" alt="CREDENTIA" fill className="object-contain p-0.5" />
            </div>
            <span className="font-syne text-xl font-extrabold" style={{ color: 'rgb(var(--text-primary))' }}>CREDENTIA</span>
          </Link>
          <h1 className="font-syne text-2xl font-extrabold" style={{ color: 'rgb(var(--text-primary))' }}>Create Account</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>Get started with CREDENTIA</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'role' && (
            <motion.div key="role" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-sm text-center mb-5" style={{ color: 'rgb(var(--text-secondary))' }}>I am a...</p>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRole(r.id); setStep('form'); setError('') }}
                    className="rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.01] flex items-center gap-4 border"
                    style={{ background: 'rgba(var(--bg-card), 0.8)', borderColor: 'rgba(var(--border-default), 0.6)' }}
                  >
                    <span className="text-3xl">{r.emoji}</span>
                    <div>
                      <span className="font-syne font-bold block" style={{ color: 'rgb(var(--text-primary))' }}>{r.label}</span>
                      <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{r.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-center mt-6 text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                Already have an account?{' '}
                <Link href="/login" className="font-medium hover:underline" style={{ color: 'rgb(var(--accent))' }}>Sign in</Link>
              </p>
            </motion.div>
          )}

          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <button onClick={() => setStep('role')} className="flex items-center gap-1.5 text-sm mb-5" style={{ color: 'rgb(var(--text-secondary))' }}>
                <ArrowLeft size={14} /> Back
              </button>

              {error && (
                <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Full Name</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-12 px-4 rounded-xl text-sm" style={{ background: 'rgb(var(--bg-input))', border: '1px solid rgba(var(--border-default), 0.8)', color: 'rgb(var(--text-primary))' }} placeholder="Your full name" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-12 px-4 rounded-xl text-sm" style={{ background: 'rgb(var(--bg-input))', border: '1px solid rgba(var(--border-default), 0.8)', color: 'rgb(var(--text-primary))' }} placeholder="you@example.com" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 px-4 rounded-xl text-sm" style={{ background: 'rgb(var(--bg-input))', border: '1px solid rgba(var(--border-default), 0.8)', color: 'rgb(var(--text-primary))' }} placeholder="Min. 6 characters" />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Confirm Password</label>
                  <input type="password" required value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className="w-full h-12 px-4 rounded-xl text-sm" style={{ background: 'rgb(var(--bg-input))', border: '1px solid rgba(var(--border-default), 0.8)', color: 'rgb(var(--text-primary))' }} placeholder="Repeat password" />
                </div>
                <button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-hover)))' }}>
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                </button>
              </form>
              <p className="text-center mt-5 text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                Already have an account?{' '}
                <Link href="/login" className="font-medium hover:underline" style={{ color: 'rgb(var(--accent))' }}>Sign in</Link>
              </p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: 'rgb(var(--success))' }} />
              <h2 className="font-syne text-xl font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>Check Your Email</h2>
              <p className="text-sm mb-6" style={{ color: 'rgb(var(--text-secondary))' }}>
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
              </p>
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm" style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-hover)))', color: 'white' }}>
                Go to Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

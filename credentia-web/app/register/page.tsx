'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Loader2, CheckCircle2, GraduationCap, Building2, Briefcase, ArrowRight } from 'lucide-react'
import CustomCursor from '@/components/landing/CustomCursor'

const roles = [
  { id: 'student', Icon: GraduationCap, label: 'Student', desc: 'Verify your credentials', accent: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)' },
  { id: 'company', Icon: Briefcase, label: 'Company', desc: 'Find verified talent', accent: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.25)' },
  { id: 'university', Icon: Building2, label: 'University', desc: 'Manage your students', accent: '#2dd4bf', bg: 'rgba(45,212,191,0.1)', border: 'rgba(45,212,191,0.25)' },
]

export default function RegisterPage() {
  const [step, setStep] = useState<'role' | 'form' | 'success'>('role')
  const [selectedRole, setSelectedRole] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    
    const portal = selectedRole || 'student'

    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?portal=${portal}`,
      },
    })
    
    if (oauthErr) {
      setError(oauthErr.message)
      setGoogleLoading(false)
    }
  }

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
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback?portal=${selectedRole}`,
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
      <CustomCursor />
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/15 blur-[140px] -top-40 -right-40"
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-[400px] h-[400px] rounded-full bg-teal-500/10 blur-[120px] -bottom-32 -left-32"
      />
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgb(148,158,194) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-500/30">
              <Image src="/logo.png" alt="CREDENTIA" fill className="object-contain p-0.5" />
            </div>
            <span className="font-heading text-xl font-extrabold" style={{ color: 'rgb(var(--text-primary))' }}>CREDENTIA</span>
          </Link>
          <h1 className="font-heading text-2xl font-extrabold" style={{ color: 'rgb(var(--text-primary))' }}>Create Account</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>Get started with CREDENTIA</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'role' && (
            <motion.div key="role" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <p className="text-sm text-center mb-5" style={{ color: 'rgba(240,243,255,0.7)' }}>I am a...</p>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((r, i) => (
                  <motion.button
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i }}
                    whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedRole(r.id); setStep('form'); setError('') }}
                    className="group rounded-2xl p-5 text-left transition-colors duration-300 flex items-center gap-4 border relative overflow-hidden"
                    style={{ background: 'rgba(14,17,40,0.6)', backdropFilter: 'blur(12px)', borderColor: r.border }}
                  >
                    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-15 group-hover:opacity-30 blur-2xl transition-opacity" style={{ background: r.accent }} />
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10" style={{ background: r.bg, border: `1px solid ${r.border}` }}>
                      <r.Icon size={22} style={{ color: r.accent }} />
                    </div>
                    <div className="flex-1 relative z-10">
                      <span className="font-heading font-bold block text-base" style={{ color: 'rgb(var(--text-primary))' }}>{r.label}</span>
                      <span className="text-xs" style={{ color: 'rgba(240,243,255,0.6)' }}>{r.desc}</span>
                    </div>
                    <ArrowRight size={16} className="text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all relative z-10" />
                  </motion.button>
                ))}
              </div>
              <p className="text-center mt-6 text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                Already have an account?{' '}
                <Link href={`/login/${selectedRole || 'student'}`} className="font-medium hover:underline" style={{ color: 'rgb(var(--accent))' }}>Sign in</Link>
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
                <button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-bold text-white transition-all disabled:opacity-50 hover:-translate-y-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #4F46E5, #4338CA)' }}>
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                </button>
              </form>
              
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: 'rgba(var(--border-default), 0.5)' }} />
                <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(var(--border-default), 0.5)' }} />
              </div>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full h-12 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                style={{ background: 'rgb(var(--bg-card))', border: '1px solid rgba(var(--border-default), 0.8)', color: 'rgb(var(--text-primary))' }}
              >
                {googleLoading ? <Loader2 size={18} className="animate-spin" /> : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Continue with Google
                  </>
                )}
              </button>
              <p className="text-center mt-5 text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                Already have an account?{' '}
                <Link href={`/login/${selectedRole || 'student'}`} className="font-medium hover:underline" style={{ color: 'rgb(var(--accent))' }}>Sign in</Link>
              </p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: 'rgb(var(--success))' }} />
              <h2 className="font-heading text-xl font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>Check Your Email</h2>
              <p className="text-sm mb-6" style={{ color: 'rgb(var(--text-secondary))' }}>
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
              </p>
              <Link href={`/login/${selectedRole || 'student'}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm" style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-hover)))', color: 'white' }}>
                Go to Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'

const roles = [
  { id: 'student', emoji: '🎓', label: 'Student', desc: 'Verify your credentials' },
  { id: 'company', emoji: '🏢', label: 'Company', desc: 'Find verified talent' },
  { id: 'university', emoji: '🏫', label: 'University', desc: 'Manage your students' },
  { id: 'admin', emoji: '🔐', label: 'Admin', desc: 'Platform management' },
]

import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080a19] flex items-center justify-center p-4">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'role' | 'form'>('role')
  const [selectedRole, setSelectedRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        const role = profile?.role || 'student'
        router.replace(`/dashboard/${role}`)
      }
    }
    checkSession()

    // Show error from URL params (e.g. OAuth errors)
    const urlError = searchParams.get('error')
    if (urlError) setError(urlError)
  }, [router, searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        if (err.message === 'Invalid login credentials') {
          setError('Wrong email or password. If you haven\'t signed up yet, click "Sign up" below.')
        } else {
          setError(err.message)
        }
        setLoading(false)
        return
      }

      if (!data.user) {
        setError('Login failed — no user returned.')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      const role = profile?.role || 'student'

      if (selectedRole === 'admin' && role !== 'admin') {
        await supabase.auth.signOut()
        setError('Unauthorized: Admin access is restricted.')
        setLoading(false)
        return
      }

      router.push(`/dashboard/${role}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    
    // Store the selected role in a cookie before redirecting
    if (selectedRole) {
      document.cookie = `pending_oauth_role=${selectedRole}; path=/; max-age=600; Secure; SameSite=Lax`
    }

    // ALWAYS use window.location.origin — NOT the env variable.
    // This ensures the redirect returns to the EXACT same domain (www vs non-www)
    // so the PKCE code_verifier cookie is accessible during the callback.
    const { error: oauthErr } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (oauthErr) {
      setError(oauthErr.message)
      setGoogleLoading(false)
    }
  }

  const selectedMeta = roles.find((r) => r.id === selectedRole)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'rgb(var(--bg-base))' }}>
      <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] -top-40 -left-40" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-[100px] -bottom-32 -right-32" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-500/30">
              <Image src="/logo.png" alt="CREDENTIA" fill className="object-contain p-0.5" />
            </div>
            <span className="font-heading text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>CREDENTIA</span>
          </Link>
          <h1 className="font-heading text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Welcome Back</h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>Sign in to your account</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'role' ? (
            <motion.div key="role" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <p className="text-sm text-center mb-5" style={{ color: 'rgb(var(--text-secondary))' }}>Select your role to continue</p>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => { setSelectedRole(r.id); setStep('form'); setError('') }}
                    className="rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] border"
                    style={{ background: 'rgba(var(--bg-card), 0.8)', borderColor: 'rgba(var(--border-default), 0.6)' }}
                  >
                    <span className="text-2xl block mb-2">{r.emoji}</span>
                    <span className="font-heading font-bold text-sm block" style={{ color: 'rgb(var(--text-primary))' }}>{r.label}</span>
                    <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{r.desc}</span>
                  </button>
                ))}
              </div>

              {/* Quick Google login */}
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px" style={{ background: 'rgba(var(--border-default), 0.5)' }} />
                  <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>or continue with</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(var(--border-default), 0.5)' }} />
                </div>
                <button
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
              </div>

              <p className="text-center mt-6 text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-medium hover:underline" style={{ color: 'rgb(var(--accent))' }}>Sign up</Link>
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              <button onClick={() => { setStep('role'); setError('') }} className="flex items-center gap-1.5 text-sm mb-5 transition-colors" style={{ color: 'rgb(var(--text-secondary))' }}>
                <ArrowLeft size={14} /> Back
              </button>

              {selectedMeta && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-5" style={{ background: 'rgba(var(--accent), 0.1)', color: 'rgb(var(--accent))' }}>
                  {selectedMeta.emoji} {selectedMeta.label}
                </div>
              )}

              {error && (
                <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Email</label>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl text-sm transition-all"
                    style={{ background: 'rgb(var(--bg-input))', border: '1px solid rgba(var(--border-default), 0.8)', color: 'rgb(var(--text-primary))' }}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'rgb(var(--text-secondary))' }}>Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 px-4 pr-11 rounded-xl text-sm transition-all"
                      style={{ background: 'rgb(var(--bg-input))', border: '1px solid rgba(var(--border-default), 0.8)', color: 'rgb(var(--text-primary))' }}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-muted))' }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full h-12 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-hover)))' }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
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
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-medium hover:underline" style={{ color: 'rgb(var(--accent))' }}>Sign up</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

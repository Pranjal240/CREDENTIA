'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Building2, School, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Role = 'student' | 'company' | 'university'

const roles = [
  {
    id: 'student' as Role,
    icon: '🎓',
    title: "I'm a Student",
    desc: 'Upload and verify your credentials',
    color: 'from-purple-600 to-blue-600',
  },
  {
    id: 'company' as Role,
    icon: '🏢',
    title: "I'm a Company",
    desc: 'Find verified candidates for your team',
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'university' as Role,
    icon: '🏫',
    title: "I'm a University",
    desc: 'Manage student academic records',
    color: 'from-green-600 to-teal-600',
  },
  {
    id: null,
    icon: '🔐',
    title: "I'm an Admin",
    desc: 'Contact us to get admin access',
    color: 'from-gray-600 to-gray-700',
    disabled: true,
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    university: '',
    rollNumber: '',
    companyName: '',
    industry: '',
    universityName: '',
    state: '',
  })

  const handleField = (k: string, v: string) => setFormData((f) => ({ ...f, [k]: v }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const displayName =
      selectedRole === 'company'
        ? formData.companyName
        : selectedRole === 'university'
        ? formData.universityName
        : formData.fullName
    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { full_name: displayName, role: selectedRole } },
    })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }
    const ROUTES: Record<string, string> = {
      student: '/dashboard/student',
      company: '/dashboard/company',
      university: '/dashboard/university',
    }
    router.push(ROUTES[selectedRole || 'student'])
    setLoading(false)
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl dark:bg-[#0A0A0F] bg-gray-50 border dark:border-[#2A2A3A] border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-[#F5C542] transition-colors'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 dark:bg-[#0A0A0F] bg-gray-50">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="font-syne font-extrabold text-3xl text-[#F5C542]">
            CREDENTIA
          </Link>
          <p className="dark:text-[#9999AA] text-gray-500 mt-2">Create your free account</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s ? 'bg-[#F5C542] text-black' : 'dark:bg-[#2A2A3A] bg-gray-200 dark:text-[#9999AA] text-gray-400'
                }`}
              >
                {s}
              </div>
              {s < 2 && <div className={`w-20 h-0.5 ${step > s ? 'bg-[#F5C542]' : 'dark:bg-[#2A2A3A] bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2 className="font-syne font-bold text-2xl dark:text-white text-gray-900 text-center mb-2">
                Choose your role
              </h2>
              <p className="text-center dark:text-[#9999AA] text-gray-500 mb-8">
                Step 1 of 2 — Select who you are
              </p>
              <div className="grid grid-cols-2 gap-4">
                {roles.map((role) => (
                  <button
                    key={role.title}
                    disabled={!!role.disabled}
                    onClick={() => {
                      if (!role.disabled && role.id) {
                        setSelectedRole(role.id)
                        setStep(2)
                      }
                    }}
                    className={`p-6 rounded-2xl border text-left transition-all ${
                      role.disabled
                        ? 'opacity-40 cursor-not-allowed dark:bg-[#13131A] bg-white dark:border-[#2A2A3A] border-gray-100'
                        : 'dark:bg-[#13131A] bg-white dark:border-[#2A2A3A] border-gray-100 hover:border-[#F5C542] hover:scale-[1.02] cursor-pointer'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-2xl mb-4`}>
                      {role.icon}
                    </div>
                    <h3 className="font-syne font-bold dark:text-white text-gray-900 mb-1">{role.title}</h3>
                    <p className="text-xs dark:text-[#9999AA] text-gray-500">{role.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep(1)} className="text-[#9999AA] hover:text-white transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="font-syne font-bold text-2xl dark:text-white text-gray-900">
                    Create your account
                  </h2>
                  <p className="dark:text-[#9999AA] text-gray-500 text-sm">
                    Step 2 of 2 — Fill in your details as a{' '}
                    <span className="text-[#F5C542] capitalize">{selectedRole}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4 dark:bg-[#13131A] bg-white rounded-2xl p-6 border dark:border-[#2A2A3A] border-gray-100">
                {selectedRole === 'student' && (
                  <>
                    <input className={inputClass} placeholder="Full Name" value={formData.fullName} onChange={(e) => handleField('fullName', e.target.value)} required />
                    <input className={inputClass} type="email" placeholder="Email" value={formData.email} onChange={(e) => handleField('email', e.target.value)} required />
                    <input className={inputClass} placeholder="University Name" value={formData.university} onChange={(e) => handleField('university', e.target.value)} />
                    <input className={inputClass} placeholder="Roll Number (optional)" value={formData.rollNumber} onChange={(e) => handleField('rollNumber', e.target.value)} />
                  </>
                )}
                {selectedRole === 'company' && (
                  <>
                    <input className={inputClass} placeholder="Company Name" value={formData.companyName} onChange={(e) => handleField('companyName', e.target.value)} required />
                    <input className={inputClass} type="email" placeholder="Work Email" value={formData.email} onChange={(e) => handleField('email', e.target.value)} required />
                    <input className={inputClass} placeholder="Industry" value={formData.industry} onChange={(e) => handleField('industry', e.target.value)} />
                  </>
                )}
                {selectedRole === 'university' && (
                  <>
                    <input className={inputClass} placeholder="University Name" value={formData.universityName} onChange={(e) => handleField('universityName', e.target.value)} required />
                    <input className={inputClass} type="email" placeholder="Official Email" value={formData.email} onChange={(e) => handleField('email', e.target.value)} required />
                    <input className={inputClass} placeholder="State" value={formData.state} onChange={(e) => handleField('state', e.target.value)} />
                  </>
                )}

                <div className="relative">
                  <input
                    className={inputClass + ' pr-12'}
                    type={showPass ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleField('password', e.target.value)}
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9999AA]">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <input
                  className={inputClass}
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleField('confirmPassword', e.target.value)}
                  required
                />

                {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#F5C542] text-black font-semibold hover:bg-[#D4A017] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Create Account'}
                </button>

                <p className="text-center text-sm dark:text-[#9999AA] text-gray-500">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#F5C542] hover:underline">Login</Link>
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

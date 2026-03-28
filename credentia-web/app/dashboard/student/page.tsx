'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Bell, User, Settings, LogOut, ChevronRight, ArrowUpRight,
  FileText, Link2, FileCheck, Eye, CheckSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, Cell, ResponsiveContainer } from 'recharts'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const barData = DAYS.map((day, i) => ({ day, value: Math.floor(Math.random() * 5), active: i === new Date().getDay() }))

export default function StudentDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<{ full_name: string; email: string; avatar_url?: string } | null>(null)
  const [student, setStudent] = useState<{ ats_score: number; verification_score: number; cgpa?: number; share_token?: string; police_verified: boolean; aadhaar_verified: boolean } | null>(null)
  const [verifications, setVerifications] = useState<{ type: string; status: string; updated_at: string }[]>([])
  const [menuOpen, setMenuOpen] = useState(false)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] || 'Student'

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data: s } = await supabase.from('students').select('*').eq('id', user.id).single()
      setStudent(s)
      const { data: v } = await supabase.from('verifications').select('*').eq('student_id', user.id)
      setVerifications(v || [])
    }
    load()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getVerifStatus = (type: string) => verifications.find((v) => v.type === type)?.status || 'not_submitted'
  const doneCount = verifications.filter((v) => ['admin_verified', 'ai_approved'].includes(v.status)).length

  const navTabs = [
    { href: '/dashboard/student', label: 'Dashboard', active: true },
    { href: '/dashboard/student/resume', label: 'Resume' },
    { href: '/dashboard/student/police', label: 'Police Verify' },
    { href: '/dashboard/student/aadhaar', label: 'Aadhaar' },
    { href: '/dashboard/student/degree', label: 'Degree' },
    { href: '/dashboard/student/my-link', label: 'My Link' },
  ]

  const tasks = [
    { type: 'resume', label: 'Resume Uploaded', icon: <FileText size={14} /> },
    { type: 'aadhaar', label: 'Aadhaar Verified', icon: <User size={14} /> },
    { type: 'police', label: 'Police Certificate', icon: <FileCheck size={14} /> },
    { type: 'degree', label: 'Degree Certificate', icon: <FileCheck size={14} /> },
    { type: 'marksheet_10th', label: '10th Marksheet', icon: <FileText size={14} /> },
    { type: 'marksheet_12th', label: '12th Marksheet', icon: <FileText size={14} /> },
  ]

  const atsScore = student?.ats_score || 0
  const verScore = student?.verification_score || 0

  return (
    <div className="min-h-screen dark:bg-[#0A0A0F] bg-[#F4F4F8]">
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 dark:bg-[#0A0A0F]/90 bg-white/90 backdrop-blur-xl border-b dark:border-[#2A2A3A] border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-syne font-extrabold text-xl text-[#F5C542]">CREDENTIA</Link>

          {/* Tabs */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {navTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  tab.active
                    ? 'bg-[#F5C542] text-black'
                    : 'dark:text-[#9999AA] text-gray-500 hover:dark:text-white hover:text-gray-900'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button className="relative p-2 dark:text-[#9999AA] text-gray-500">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-full bg-[#F5C542] flex items-center justify-center text-black font-bold text-sm"
              >
                {firstName[0]}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-48 dark:bg-[#1C1C26] bg-white border dark:border-[#2A2A3A] border-gray-100 rounded-xl shadow-xl overflow-hidden z-50">
                  <button className="w-full flex items-center gap-2 px-4 py-3 text-sm dark:text-white text-gray-800 hover:dark:bg-[#2A2A3A] hover:bg-gray-50">
                    <User size={14} /> Profile
                  </button>
                  <button className="w-full flex items-center gap-2 px-4 py-3 text-sm dark:text-white text-gray-800 hover:dark:bg-[#2A2A3A] hover:bg-gray-50">
                    <Settings size={14} /> Settings
                  </button>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:dark:bg-[#2A2A3A] hover:bg-gray-50">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <h2 className="font-syne font-bold text-3xl dark:text-white text-gray-900">
            {greeting}, {firstName}! 👋
          </h2>
          <p className="dark:text-[#9999AA] text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </motion.div>

        {/* Hero Banner — animated gradient */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="relative w-full h-44 rounded-2xl overflow-hidden mb-6" style={{ background: 'linear-gradient(135deg, #1C1C26 0%, #2A1A40 40%, #13131A 100%)' }}>
          {/* Floating orbs */}
          <div className="absolute w-64 h-64 rounded-full bg-purple-600/20 -top-16 -right-16 animate-pulse" />
          <div className="absolute w-40 h-40 rounded-full bg-[#F5C542]/10 bottom-0 right-1/4 animate-bounce" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F]/70 to-transparent" />
          <div className="absolute top-1/2 left-8 -translate-y-1/2">
            <p className="text-[#F5C542] text-sm font-medium mb-1 tracking-widest uppercase">CREDENTIA PLATFORM</p>
            <h2 className="text-white text-2xl font-bold font-syne">{greeting}, {firstName}! 👋</h2>
            <p className="text-gray-400 text-sm mt-2">Your profile is <span className="text-[#F5C542] font-bold">{verScore}%</span> verified</p>
          </div>
          <div className="absolute top-4 right-6 text-6xl opacity-20">🎓</div>
        </motion.div>

        {/* Metrics Row */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Resume', pct: atsScore, color: 'bg-[#F5C542]', text: `${atsScore}%` },
              { label: 'Police', pct: student?.police_verified ? 100 : 0, color: 'bg-orange-500', text: student?.police_verified ? 'Verified' : 'Pending' },
              { label: 'Aadhaar', pct: student?.aadhaar_verified ? 100 : 0, color: 'bg-green-500', text: student?.aadhaar_verified ? 'Verified ✅' : '0%' },
              { label: 'Degree', pct: 0, color: 'bg-gray-500', text: '0%' },
            ].map((p) => (
              <div key={p.label} className="flex items-center gap-3 dark:bg-[#13131A] bg-white rounded-full px-4 py-2 border dark:border-[#2A2A3A] border-gray-100">
                <span className="text-xs font-medium dark:text-[#9999AA] text-gray-500">{p.label}</span>
                <div className="w-20 h-1.5 dark:bg-[#2A2A3A] bg-gray-200 rounded-full">
                  <div className={`h-full ${p.color} rounded-full transition-all`} style={{ width: `${p.pct}%` }} />
                </div>
                <span className="text-xs dark:text-white text-gray-700 font-medium">{p.text}</span>
              </div>
            ))}
          </div>
          {/* KPIs */}
          <div className="flex items-center gap-6">
            {[
              { icon: <User size={16} />, value: verScore, label: 'Verify Score' },
              { icon: <Eye size={16} />, value: 0, label: 'Profile Views' },
              { icon: <CheckSquare size={16} />, value: `${doneCount}/6`, label: 'Docs Done' },
            ].map((kpi) => (
              <div key={kpi.label} className="text-center">
                <div className="flex items-center gap-1 justify-center dark:text-[#9999AA] text-gray-400 mb-1">{kpi.icon}</div>
                <div className="font-syne font-extrabold text-3xl dark:text-white text-gray-900">{kpi.value}</div>
                <div className="text-xs dark:text-[#9999AA] text-gray-500">{kpi.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Main 4-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Col 1: Profile Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-[#F5C542] to-orange-500 flex items-center justify-center text-5xl font-bold text-black relative">
              {firstName[0]}
              <span className="absolute bottom-2 right-2 dark:bg-[#F5C542] bg-[#F5C542] text-black text-xs px-2 py-1 rounded-full font-bold">
                {student?.cgpa ? `CGPA: ${student.cgpa}` : 'Student'}
              </span>
            </div>
            <div className="p-4 border-b dark:border-[#2A2A3A] border-gray-100">
              <p className="font-syne font-bold dark:text-white text-gray-900">{profile?.full_name || '...'}</p>
            </div>
            {[
              { icon: <FileText size={14} />, label: 'My Documents', href: '/dashboard/student/resume' },
              { icon: <Link2 size={14} />, label: 'Shareable Link', href: '/dashboard/student/my-link' },
              { icon: <Settings size={14} />, label: 'Profile Settings', href: '#' },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="flex items-center justify-between px-4 py-3 hover:dark:bg-[#1C1C26] hover:bg-gray-50 border-b dark:border-[#2A2A3A] border-gray-50 transition-colors last:border-0">
                <div className="flex items-center gap-2 text-sm dark:text-[#9999AA] text-gray-500">
                  {item.icon} {item.label}
                </div>
                <ChevronRight size={14} className="dark:text-[#9999AA] text-gray-400" />
              </Link>
            ))}
          </motion.div>

          {/* Col 2: Verification Progress */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium dark:text-white text-gray-900 text-sm">Verification Progress</span>
              <ArrowUpRight size={16} className="dark:text-[#9999AA] text-gray-400" />
            </div>
            <div className="font-syne font-extrabold text-5xl dark:text-white text-gray-900 mb-1">{doneCount}</div>
            <div className="text-xs dark:text-[#9999AA] text-gray-500 mb-4">Verifications complete</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={barData} barSize={16}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9999AA' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.active ? '#F5C542' : '#2A2A3A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Col 3: ATS Score */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4">
              <span className="font-medium dark:text-white text-gray-900 text-sm">ATS Score</span>
              <ArrowUpRight size={16} className="dark:text-[#9999AA] text-gray-400" />
            </div>
            {/* CSS conic-gradient circle */}
            <div className="relative w-36 h-36 rounded-full flex items-center justify-center mb-3"
              style={{ background: `conic-gradient(#F5C542 ${atsScore * 3.6}deg, #2A2A3A ${atsScore * 3.6}deg)` }}
            >
              <div className="w-28 h-28 rounded-full dark:bg-[#13131A] bg-white flex flex-col items-center justify-center">
                <span className="font-syne font-extrabold text-4xl dark:text-white text-gray-900">{atsScore}</span>
              </div>
            </div>
            <div className="text-xs dark:text-[#9999AA] text-gray-500 mb-1">out of 100</div>
            <div className={`text-xs px-3 py-1 rounded-full font-semibold ${atsScore >= 80 ? 'bg-green-500/20 text-green-400' : atsScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
              {atsScore >= 80 ? 'Excellent' : atsScore >= 60 ? 'Good' : 'Needs Work'}
            </div>
            <div className="flex gap-2 mt-4 w-full">
              <Link href="/dashboard/student/resume" className="flex-1 text-center text-xs py-2 rounded-lg border dark:border-[#2A2A3A] border-gray-100 dark:text-[#9999AA] text-gray-500 hover:dark:bg-[#1C1C26] hover:bg-gray-50 transition-colors">
                Reanalyze
              </Link>
            </div>
          </motion.div>

          {/* Col 4: Verification Tasks */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium dark:text-white text-gray-900 text-sm">Verification Tasks</span>
              <span className="font-syne font-extrabold text-2xl dark:text-white text-gray-900">{doneCount}/6</span>
            </div>
            {/* Segmented progress */}
            <div className="flex gap-1 mb-4">
              {tasks.map((t, i) => {
                const isDone = ['admin_verified', 'ai_approved'].includes(getVerifStatus(t.type))
                return <div key={i} className={`flex-1 h-2 rounded-full ${isDone ? 'bg-[#F5C542]' : 'bg-[#2A2A3A]'}`} />
              })}
            </div>
            <div className="space-y-3 overflow-y-auto max-h-52">
              {tasks.map((t) => {
                const status = getVerifStatus(t.type)
                const isDone = ['admin_verified', 'ai_approved'].includes(status)
                return (
                  <div key={t.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${isDone ? 'bg-[#F5C542]/20 text-[#F5C542]' : 'dark:bg-[#2A2A3A] bg-gray-100 dark:text-[#9999AA] text-gray-400'}`}>
                        {t.icon}
                      </div>
                      <div>
                        <p className="text-xs font-medium dark:text-white text-gray-900">{t.label}</p>
                        <p className="text-xs dark:text-[#9999AA] text-gray-400 capitalize">{status.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isDone ? 'bg-[#F5C542] border-[#F5C542]' : 'border-[#2A2A3A]'}`}>
                      {isDone && <span className="text-black text-xs">✓</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Bottom 2-col */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Activity */}
          <div className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6">
            <h3 className="font-syne font-bold dark:text-white text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {verifications.filter(v => v.status !== 'not_submitted').slice(0, 4).map((v, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#F5C542] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm dark:text-white text-gray-800 capitalize">{v.type.replace('_', ' ')} — {v.status.replace('_', ' ')}</p>
                    <p className="text-xs dark:text-[#9999AA] text-gray-400">{new Date(v.updated_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
              {verifications.filter(v => v.status !== 'not_submitted').length === 0 && (
                <p className="text-sm dark:text-[#9999AA] text-gray-400">No activity yet. Start by uploading your resume!</p>
              )}
            </div>
          </div>

          {/* Shareable Link */}
          <div className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6">
            <h3 className="font-syne font-bold dark:text-white text-gray-900 mb-4">Your Verified Link</h3>
            {student?.share_token ? (
              <>
                <div className="flex items-center gap-2 dark:bg-[#0A0A0F] bg-gray-50 rounded-xl px-4 py-3 border dark:border-[#2A2A3A] border-gray-100 mb-4">
                  <span className="text-xs dark:text-[#9999AA] text-gray-500 flex-1 truncate">
                    credentiaonline.in/verify/{student.share_token.slice(0, 12)}...
                  </span>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/verify/${student.share_token}`)}
                    className="text-xs text-[#F5C542] hover:underline whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
                <div className="flex gap-2">
                  <a href={`https://wa.me/?text=Check my verified profile: ${process.env.NEXT_PUBLIC_APP_URL}/verify/${student.share_token}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center text-xs py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                    WhatsApp
                  </a>
                  <Link href="/dashboard/student/my-link" className="flex-1 text-center text-xs py-2 rounded-lg bg-[#F5C542]/20 text-[#F5C542] hover:bg-[#F5C542]/30 transition-colors">
                    View Full Link
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-sm dark:text-[#9999AA] text-gray-400">Complete at least 1 verification to get your shareable link.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 dark:bg-[#13131A] bg-white border-t dark:border-[#2A2A3A] border-gray-100 flex items-center justify-around px-2 h-16 z-50">
        {[
          { icon: '🏠', label: 'Home', href: '/dashboard/student' },
          { icon: '📄', label: 'Resume', href: '/dashboard/student/resume' },
          { icon: '🔗', label: 'Link', href: '/dashboard/student/my-link' },
          { icon: '👤', label: 'Profile', href: '#' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 py-2 dark:text-[#9999AA] text-gray-500">
            <span>{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, FileText, Shield, CreditCard,
  GraduationCap, Link2, LogOut, CheckCircle2,
  Circle, ExternalLink, Copy, Check
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/student' },
  { icon: FileText, label: 'Resume', href: '/dashboard/student/resume' },
  { icon: Shield, label: 'Police Verify', href: '/dashboard/student/police' },
  { icon: CreditCard, label: 'Aadhaar', href: '/dashboard/student/aadhaar' },
  { icon: GraduationCap, label: 'Degree', href: '/dashboard/student/degree' },
  { icon: Link2, label: 'My Link', href: '/dashboard/student/my-link' },
]

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [generatingLink, setGeneratingLink] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUser(user)

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Get or create student record
      let { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!studentData) {
        await supabase.from('students').insert({ id: user.id })
        const fresh = await supabase.from('students').select('*').eq('id', user.id).single()
        studentData = fresh.data
      }

      setUser({ ...user, profile })
      setStudent(studentData)
      setLoading(false)
    }
    load()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleGenerateLink = async () => {
    setGeneratingLink(true)
    const res = await fetch('/api/generate-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: user.id }),
    })
    const data = await res.json()
    if (data.token) {
      setStudent((prev: any) => ({ ...prev, share_token: data.token }))
    }
    setGeneratingLink(false)
  }

  const copyLink = () => {
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${student?.share_token}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tasks = [
    { label: 'Resume Uploaded & Analyzed', done: !!student?.resume_url, href: '/dashboard/student/resume' },
    { label: 'Police Certificate Submitted', done: student?.police_verified, href: '/dashboard/student/police' },
    { label: 'Aadhaar Verified', done: student?.aadhaar_verified, href: '/dashboard/student/aadhaar' },
    { label: 'Degree Certificate Verified', done: student?.degree_verified, href: '/dashboard/student/degree' },
  ]
  const completedTasks = tasks.filter(t => t.done).length

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#F5C542] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const displayName = user?.profile?.full_name || user?.email?.split('@')[0] || 'Student'
  const atsScore = student?.ats_score || 0
  const shareLink = student?.share_token
    ? `credentiaonline.in/verify/${student.share_token}`
    : null
  const fullShareLink = student?.share_token
    ? `${process.env.NEXT_PUBLIC_APP_URL}/verify/${student.share_token}`
    : null

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#13131A] border-r border-[#2A2A3A] flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-6 border-b border-[#2A2A3A]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5C542] flex items-center justify-center">
              <span className="text-black font-black text-sm">C</span>
            </div>
            <span className="font-bold text-lg text-[#F5C542]" style={{fontFamily:'var(--font-syne)'}}>CREDENTIA</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#9999AA] hover:text-white hover:bg-[#1C1C26] transition-all group"
            >
              <item.icon size={18} className="group-hover:text-[#F5C542] transition-colors" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-[#2A2A3A]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#F5C542] flex items-center justify-center text-black font-bold text-sm">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{displayName}</p>
              <p className="text-[#9999AA] text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#9999AA] hover:text-red-400 hover:bg-red-500/10 transition text-sm"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white" style={{fontFamily:'var(--font-syne)'}}>
            Hey {displayName}! 👋
          </h1>
          <p className="text-[#9999AA] mt-1">Here&apos;s your verification dashboard</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'ATS Score', value: `${atsScore}/100`, color: atsScore > 60 ? 'text-green-400' : atsScore > 30 ? 'text-yellow-400' : 'text-[#9999AA]', sub: 'Resume score' },
            { label: 'Police Status', value: student?.police_verified ? '✅ Verified' : '⏳ Pending', color: student?.police_verified ? 'text-green-400' : 'text-yellow-400', sub: 'Background check' },
            { label: 'Aadhaar', value: student?.aadhaar_verified ? '✅ Verified' : '—', color: student?.aadhaar_verified ? 'text-green-400' : 'text-[#9999AA]', sub: 'Identity proof' },
            { label: 'Degree', value: student?.degree_verified ? '✅ Verified' : '—', color: student?.degree_verified ? 'text-green-400' : 'text-[#9999AA]', sub: 'Education' },
          ].map(card => (
            <div key={card.label} className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5">
              <p className="text-[#9999AA] text-xs font-medium uppercase tracking-wide">{card.sub}</p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`} style={{fontFamily:'var(--font-syne)'}}>{card.value}</p>
              <p className="text-[#555566] text-xs mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Tasks + ATS row */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {/* Tasks */}
          <div className="col-span-3 bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg" style={{fontFamily:'var(--font-syne)'}}>Verification Tasks</h2>
              <span className="text-[#9999AA] text-sm">{completedTasks}/4 done</span>
            </div>
            <div className="space-y-3 mb-5">
              {tasks.map(task => (
                <div key={task.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {task.done
                      ? <CheckCircle2 size={18} className="text-green-400 flex-shrink-0" />
                      : <Circle size={18} className="text-[#2A2A3A] flex-shrink-0" />
                    }
                    <span className={`text-sm ${task.done ? 'text-white' : 'text-[#9999AA]'}`}>{task.label}</span>
                  </div>
                  {!task.done && (
                    <Link href={task.href} className="text-xs text-[#F5C542] hover:underline flex items-center gap-1">
                      Upload <ExternalLink size={11} />
                    </Link>
                  )}
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-[#2A2A3A] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F5C542] rounded-full transition-all"
                style={{ width: `${(completedTasks / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* ATS Score circle */}
          <div className="col-span-2 bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#2A2A3A" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={atsScore > 60 ? '#22C55E' : atsScore > 30 ? '#F5C542' : '#3A3A4A'}
                  strokeWidth="10"
                  strokeDasharray={`${(atsScore / 100) * 314} 314`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-black text-white" style={{fontFamily:'var(--font-syne)'}}>{atsScore}</span>
              </div>
            </div>
            <p className="text-white font-bold" style={{fontFamily:'var(--font-syne)'}}>ATS Score</p>
            <p className="text-[#9999AA] text-xs mt-1 mb-4">
              {atsScore === 0 ? 'Upload resume to get score' : atsScore > 75 ? 'Excellent!' : 'Room to improve'}
            </p>
            <Link
              href="/dashboard/student/resume"
              className="text-xs bg-[#F5C542] text-black font-bold px-4 py-2 rounded-lg hover:bg-[#D4A017] transition"
            >
              {atsScore === 0 ? 'Upload Resume' : 'Re-analyze'}
            </Link>
          </div>
        </div>

        {/* Share link card */}
        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-2" style={{fontFamily:'var(--font-syne)'}}>
            🔗 Your Verified Profile Link
          </h2>
          <p className="text-[#9999AA] text-sm mb-4">Share this link with companies to show your verified credentials.</p>

          {shareLink ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[#0A0A0F] border border-[#2A2A3A] rounded-xl px-4 py-3 text-[#9999AA] text-sm font-mono truncate">
                {shareLink}
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 bg-[#F5C542] text-black font-bold px-4 py-3 rounded-xl hover:bg-[#D4A017] transition text-sm whitespace-nowrap"
              >
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
              <Link
                href={fullShareLink!}
                target="_blank"
                className="flex items-center gap-2 bg-[#1C1C26] border border-[#2A2A3A] text-white px-4 py-3 rounded-xl hover:border-[#F5C542] transition text-sm"
              >
                <ExternalLink size={14} />
              </Link>
            </div>
          ) : (
            <button
              onClick={handleGenerateLink}
              disabled={generatingLink}
              className="bg-[#F5C542] text-black font-bold px-6 py-3 rounded-xl hover:bg-[#D4A017] transition text-sm disabled:opacity-60"
            >
              {generatingLink ? 'Generating...' : 'Generate My Link'}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

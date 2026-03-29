'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Circle, ExternalLink, Copy, Check, ArrowRight, FileText, Shield, CreditCard, GraduationCap, Link2, Clock } from 'lucide-react'
import { getScoreColor } from '@/lib/utils'

export default function StudentDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [profileRes, studentRes, verificationsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('students').select('*').eq('id', user.id).single(),
        supabase.from('verifications').select('*').eq('student_id', user.id),
      ])

      let studentData = studentRes.data
      if (!studentData) {
        await supabase.from('students').insert({ id: user.id })
        const fresh = await supabase.from('students').select('*').eq('id', user.id).single()
        studentData = fresh.data
      }

      setCurrentUser(user)
      setProfile(profileRes.data)
      setStudent(studentData)
      setVerifications(verificationsRes.data || [])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div className="p-8 flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-[#F5C542] border-t-transparent rounded-full animate-spin" /></div>

  const atsScore = student?.ats_score || 0
  const policeVerif = verifications.find((v: any) => v.type === 'police')
  const displayName = profile?.full_name || currentUser?.email?.split('@')[0] || 'User'
  const shareUrl = student?.share_token ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://credentiaonline.in'}/verify/${student.share_token}` : null

  const tasks = [
    { label: 'Resume Analyzed', done: !!student?.resume_url, score: student?.ats_score, href: '/dashboard/student/resume', icon: FileText },
    { label: 'Police Certificate', done: student?.police_verified, href: '/dashboard/student/police', icon: Shield, pending: policeVerif?.status === 'ai_approved' || policeVerif?.status === 'needs_review' },
    { label: 'Aadhaar Verified', done: student?.aadhaar_verified, href: '/dashboard/student/aadhaar', icon: CreditCard },
    { label: 'Degree Certificate', done: student?.degree_verified, href: '/dashboard/student/degree', icon: GraduationCap },
  ]
  const completed = tasks.filter(t => t.done).length

  const copyLink = () => {
    if (shareUrl) navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateLink = async () => {
    const res = await fetch('/api/generate-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: currentUser.id }) })
    const data = await res.json()
    if (data.success) {
      setStudent({ ...student, share_token: data.token, profile_is_public: true })
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-syne text-2xl md:text-3xl font-extrabold text-white">Hey {displayName}! 👋</h1>
        <p className="text-[#9999AA] text-sm mt-1">Here&apos;s your verification overview</p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'ATS Score', value: atsScore ? `${atsScore}/100` : '—', color: getScoreColor(atsScore), icon: FileText },
          { label: 'Police', value: student?.police_verified ? '✅ Verified' : policeVerif ? '⏳ Pending' : 'Not Submitted', color: student?.police_verified ? '#22C55E' : policeVerif ? '#F59E0B' : '#9999AA', icon: Shield },
          { label: 'Aadhaar', value: student?.aadhaar_verified ? '✅ Verified' : 'Not Submitted', color: student?.aadhaar_verified ? '#22C55E' : '#9999AA', icon: CreditCard },
          { label: 'Degree', value: student?.degree_verified ? '✅ Verified' : 'Not Submitted', color: student?.degree_verified ? '#22C55E' : '#9999AA', icon: GraduationCap },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5 hover:border-[#F5C542]/30 transition-all">
            <stat.icon size={18} className="text-[#9999AA] mb-3" />
            <p className="font-syne text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[#9999AA] text-xs mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Tasks */}
        <div className="lg:col-span-2 bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
          <h3 className="font-syne font-bold text-white mb-4">Verification Tasks</h3>
          <div className="space-y-3 mb-4">
            {tasks.map((task, i) => (
              <Link key={i} href={task.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#1C1C26] transition-all group">
                {task.done ? <CheckCircle2 size={18} className="text-green-400" /> : task.pending ? <Clock size={18} className="text-yellow-400" /> : <Circle size={18} className="text-[#2A2A3A]" />}
                <span className={`text-sm flex-1 ${task.done ? 'text-white' : 'text-[#9999AA]'}`}>
                  {task.label} {task.score ? `(${task.score}/100)` : ''} {task.pending ? '— Under Review' : ''}
                </span>
                <ArrowRight size={14} className="text-[#2A2A3A] group-hover:text-[#F5C542] transition-colors" />
              </Link>
            ))}
          </div>
          <div className="bg-[#1C1C26] rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-[#F5C542] to-[#D4A017] h-full rounded-full transition-all duration-500" style={{ width: `${(completed / 4) * 100}%` }} />
          </div>
          <p className="text-[#9999AA] text-xs mt-2">{completed}/4 completed</p>
        </div>

        {/* ATS Gauge */}
        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6 flex flex-col items-center justify-center">
          <h3 className="font-syne font-bold text-white mb-4">ATS Score</h3>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#2A2A3A" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none" stroke={getScoreColor(atsScore)} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(atsScore / 100) * 283} 283`} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-syne text-3xl font-extrabold text-white">{atsScore}</span>
            </div>
          </div>
          <p className="text-[#9999AA] text-xs mt-2">{atsScore >= 75 ? 'Excellent' : atsScore >= 50 ? 'Good' : atsScore > 0 ? 'Needs Work' : 'Not Analyzed'}</p>
        </div>
      </div>

      {/* Shareable Link */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link2 size={18} className="text-[#F5C542]" />
          <h3 className="font-syne font-bold text-white">Shareable Link</h3>
        </div>
        {shareUrl ? (
          <>
            <div className="flex items-center gap-3 mb-4 bg-[#1C1C26] rounded-xl px-4 py-3 border border-[#2A2A3A]">
              <span className="text-[#9999AA] text-sm flex-1 truncate">{shareUrl}</span>
              <button onClick={copyLink} className="text-[#F5C542] hover:text-white transition-colors flex-shrink-0">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <a href={shareUrl} target="_blank" rel="noreferrer" className="text-[#9999AA] hover:text-white transition-colors flex-shrink-0">
                <ExternalLink size={16} />
              </a>
            </div>
            <div className="flex gap-3">
              <a href={`https://wa.me/?text=Verify my credentials: ${shareUrl}`} target="_blank" rel="noreferrer" className="text-xs bg-[#25D366]/10 text-[#25D366] px-4 py-2 rounded-lg hover:bg-[#25D366]/20 transition-all">WhatsApp</a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noreferrer" className="text-xs bg-[#0A66C2]/10 text-[#0A66C2] px-4 py-2 rounded-lg hover:bg-[#0A66C2]/20 transition-all">LinkedIn</a>
            </div>
          </>
        ) : (
          <button onClick={generateLink} className="bg-[#F5C542] text-black font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#D4A017] transition-all">
            Generate My Link
          </button>
        )}
      </motion.div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { FileText, Shield, CreditCard, GraduationCap, Link2, TrendingUp, Eye, CheckCircle2, Clock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'

export default function StudentDashboard() {
  const [student, setStudent] = useState<any>(null)
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const uid = session.user.id
      const { data: s } = await supabase.from('students').select('*').eq('id', uid).single()
      const { data: v } = await supabase.from('verifications').select('*').eq('student_id', uid)
      setStudent(s)
      setVerifications(v || [])
      setLoading(false)
    }
    load()
  }, [])

  const getStatus = (type: string) => {
    const v = verifications.find(x => x.type === type)
    if (!v || v.status === 'not_submitted') return { label: 'Upload Now', color: '#6366f1', bgColor: 'rgba(99,102,241,0.08)', icon: AlertCircle, ready: false }
    if (v.status === 'pending' || v.status === 'needs_review') return { label: 'Pending', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.08)', icon: Clock, ready: false }
    if (v.status === 'ai_approved' || v.status === 'admin_verified' || v.status === 'verified') return { label: 'Verified', color: '#22c55e', bgColor: 'rgba(34,197,94,0.08)', icon: CheckCircle2, ready: true }
    return { label: v.status, color: '#ef4444', bgColor: 'rgba(239,68,68,0.08)', icon: AlertCircle, ready: false }
  }

  const verifiedCount = verifications.filter(v => v.status === 'ai_approved' || v.status === 'admin_verified' || v.status === 'verified').length

  const tasks = [
    { type: 'resume', label: 'Resume Analysis', desc: 'Get your ATS score with AI', icon: FileText, href: '/dashboard/student/resume', accent: '#3b82f6' },
    { type: 'police', label: 'Police Verification', desc: 'Upload PCC or paste link', icon: Shield, href: '/dashboard/student/police', accent: '#8b5cf6' },
    { type: 'aadhaar', label: 'Aadhaar Verification', desc: 'Verify your identity card', icon: CreditCard, href: '/dashboard/student/aadhaar', accent: '#14b8a6' },
    { type: 'degree', label: 'Degree Verification', desc: 'Upload your degree certificate', icon: GraduationCap, href: '/dashboard/student/degree', accent: '#f59e0b' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm mt-1 text-white/40">Track your verification progress and manage credentials</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ATS Score', value: student?.ats_score || '—', icon: TrendingUp, suffix: student?.ats_score ? '/100' : '', gradient: 'from-blue-600/20 to-blue-400/5', iconColor: '#60a5fa', border: 'rgba(59,130,246,0.15)' },
          { label: 'Verified', value: verifiedCount, icon: CheckCircle2, suffix: '/4', gradient: 'from-emerald-600/20 to-emerald-400/5', iconColor: '#34d399', border: 'rgba(34,197,94,0.15)' },
          { label: 'Profile Views', value: student?.profile_views || 0, icon: Eye, suffix: '', gradient: 'from-violet-600/20 to-violet-400/5', iconColor: '#a78bfa', border: 'rgba(139,92,246,0.15)' },
          { label: 'Trust Score', value: student?.verification_score || 0, icon: Shield, suffix: '%', gradient: 'from-teal-600/20 to-teal-400/5', iconColor: '#2dd4bf', border: 'rgba(20,184,166,0.15)' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`relative rounded-2xl p-5 overflow-hidden bg-gradient-to-br ${stat.gradient}`}
            style={{ border: `1px solid ${stat.border}` }}
          >
            <div className="flex items-start justify-between mb-3">
              <stat.icon size={20} style={{ color: stat.iconColor }} />
            </div>
            <p className="font-heading text-2xl font-bold text-white">
              {stat.value}
              <span className="text-sm font-normal text-white/25 ml-0.5">{stat.suffix}</span>
            </p>
            <p className="text-[11px] mt-1 text-white/30 uppercase tracking-wider font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Verification Checklist ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-blue-400" />
          <h2 className="font-heading font-bold text-white text-sm">Verification Checklist</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tasks.map((task, i) => {
            const status = getStatus(task.type)
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
              >
                <Link
                  href={task.href}
                  className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:translate-y-[-2px]"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                    style={{ background: `${task.accent}15`, color: task.accent }}
                  >
                    <task.icon size={20} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{task.label}</p>
                    <p className="text-xs text-white/30 mt-0.5">{task.desc}</p>
                  </div>

                  {/* Status badge */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: status.bgColor, color: status.color }}
                    >
                      {status.label}
                    </span>
                    <ArrowRight size={14} className="text-white/15 group-hover:text-white/40 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Verified Link CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Link
          href="/dashboard/student/my-link"
          className="group flex items-center justify-between p-5 rounded-2xl transition-all duration-300 hover:translate-y-[-2px]"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))',
            border: '1px solid rgba(59,130,246,0.12)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Link2 size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm text-white">Generate Verified Link</p>
              <p className="text-xs text-white/30 mt-0.5">Share one link with every company you apply to</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-white/20 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </div>
  )
}

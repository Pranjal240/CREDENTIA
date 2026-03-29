'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { FileText, Shield, CreditCard, GraduationCap, Link2, TrendingUp, Eye, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

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
    if (!v || v.status === 'not_submitted') return { label: 'Not Submitted', color: 'rgb(var(--text-muted))', icon: AlertCircle }
    if (v.status === 'pending' || v.status === 'needs_review') return { label: 'Pending', color: 'rgb(var(--warning))', icon: Clock }
    if (v.status === 'ai_approved' || v.status === 'admin_verified') return { label: 'Verified', color: 'rgb(var(--success))', icon: CheckCircle2 }
    return { label: v.status, color: 'rgb(var(--danger))', icon: AlertCircle }
  }

  const tasks = [
    { type: 'resume', label: 'Resume', icon: FileText, href: '/dashboard/student/resume' },
    { type: 'police', label: 'Police Certificate', icon: Shield, href: '/dashboard/student/police' },
    { type: 'aadhaar', label: 'Aadhaar', icon: CreditCard, href: '/dashboard/student/aadhaar' },
    { type: 'degree', label: 'Degree', icon: GraduationCap, href: '/dashboard/student/degree' },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Student Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>Track your verification progress</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ATS Score', value: student?.ats_score || 0, icon: TrendingUp, suffix: '/100', color: 'from-blue-500 to-blue-600' },
          { label: 'Verifications', value: verifications.filter(v => v.status === 'ai_approved' || v.status === 'admin_verified').length, icon: CheckCircle2, suffix: '/4', color: 'from-emerald-500 to-emerald-600' },
          { label: 'Profile Views', value: student?.profile_views || 0, icon: Eye, suffix: '', color: 'from-teal-500 to-teal-600' },
          { label: 'Trust Score', value: student?.verification_score || 0, icon: Shield, suffix: '%', color: 'from-indigo-500 to-indigo-600' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl p-5 border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon size={18} className="text-white" />
            </div>
            <p className="font-heading text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{stat.value}<span className="text-base font-normal" style={{ color: 'rgb(var(--text-muted))' }}>{stat.suffix}</span></p>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Verification checklist */}
      <div className="rounded-2xl p-6 border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
        <h2 className="font-heading font-bold mb-4" style={{ color: 'rgb(var(--text-primary))' }}>Verification Checklist</h2>
        <div className="space-y-3">
          {tasks.map((task, i) => {
            const status = getStatus(task.type)
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={task.href} className="flex items-center justify-between p-4 rounded-xl border transition-all hover:border-[rgb(var(--accent))]/30" style={{ background: 'rgb(var(--bg-elevated))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
                  <div className="flex items-center gap-3">
                    <task.icon size={18} style={{ color: 'rgb(var(--accent))' }} />
                    <span className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{task.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <status.icon size={14} style={{ color: status.color }} />
                    <span className="text-xs font-medium" style={{ color: status.color }}>{status.label}</span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Quick action */}
      <Link href="/dashboard/student/my-link" className="block rounded-2xl p-6 border text-center transition-all hover:border-[rgb(var(--accent))]/30" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
        <Link2 size={24} className="mx-auto mb-2" style={{ color: 'rgb(var(--accent))' }} />
        <p className="font-heading font-bold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>Generate Your Verified Link</p>
        <p className="text-xs mt-1" style={{ color: 'rgb(var(--text-muted))' }}>Share one link with every company you apply to</p>
      </Link>
    </div>
  )
}

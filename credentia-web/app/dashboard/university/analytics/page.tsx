'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { BarChart3, Users, GraduationCap, TrendingUp, Shield, CreditCard, Clock, CheckCircle2, AlertCircle, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-react'

export default function UniversityAnalytics() {
  const [students, setStudents] = useState<any[]>([])
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: stuData } = await supabase.from('students').select('*').eq('university_id', session.user.id)
      const list = stuData || []
      setStudents(list)
      // Fetch verifications for these students
      if (list.length > 0) {
        const ids = list.map(s => s.id)
        const { data: vData } = await supabase.from('verifications').select('*').in('student_id', ids).order('updated_at', { ascending: false })
        setVerifications(vData || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const stats = useMemo(() => {
    const total = students.length
    const degreeV = students.filter(s => s.degree_verified).length
    const policeV = students.filter(s => s.police_verified).length
    const aadhaarV = students.filter(s => s.aadhaar_verified).length
    const avgCgpa = total ? (students.reduce((a, s) => a + (parseFloat(s.cgpa) || 0), 0) / total).toFixed(1) : '0.0'
    const avgAts = total ? Math.round(students.reduce((a, s) => a + (s.ats_score || 0), 0) / total) : 0
    const fullyVerified = students.filter(s => s.degree_verified && s.police_verified && s.aadhaar_verified).length

    const courseBreakdown = (Object.entries(
      students.reduce((acc: Record<string, number>, s) => {
        const c = s.course || 'Unknown'
        acc[c] = (acc[c] || 0) + 1
        return acc
      }, {})
    ) as [string, number][]).sort((a, b) => b[1] - a[1])

    const yearBreakdown = (Object.entries(
      students.reduce((acc: Record<string, number>, s) => {
        const y = s.graduation_year?.toString() || 'Unknown'
        acc[y] = (acc[y] || 0) + 1
        return acc
      }, {})
    ) as [string, number][]).sort((a, b) => a[0].localeCompare(b[0]))

    // ATS distribution
    const atsRanges = [
      { label: '0-30', count: students.filter(s => (s.ats_score || 0) <= 30).length, color: '#ef4444' },
      { label: '31-50', count: students.filter(s => (s.ats_score || 0) > 30 && (s.ats_score || 0) <= 50).length, color: '#f59e0b' },
      { label: '51-70', count: students.filter(s => (s.ats_score || 0) > 50 && (s.ats_score || 0) <= 70).length, color: '#3b82f6' },
      { label: '71-90', count: students.filter(s => (s.ats_score || 0) > 70 && (s.ats_score || 0) <= 90).length, color: '#10b981' },
      { label: '91-100', count: students.filter(s => (s.ats_score || 0) > 90).length, color: '#22c55e' },
    ]

    return { total, degreeV, policeV, aadhaarV, avgCgpa, avgAts, fullyVerified, courseBreakdown, yearBreakdown, atsRanges }
  }, [students])

  // Recent verifications (trending)
  const recentVerifications = useMemo(() => {
    return verifications.slice(0, 12).map(v => {
      const student = students.find(s => s.id === v.student_id)
      return { ...v, studentName: student?.name || 'Unknown' }
    })
  }, [verifications, students])

  // Verification velocity — last 7 days vs prior 7 days
  const velocity = useMemo(() => {
    const now = Date.now()
    const oneWeek = 7 * 24 * 60 * 60 * 1000
    const recent = verifications.filter(v => now - new Date(v.updated_at || v.created_at).getTime() < oneWeek).length
    const prior = verifications.filter(v => {
      const t = now - new Date(v.updated_at || v.created_at).getTime()
      return t >= oneWeek && t < 2 * oneWeek
    }).length
    const pctChange = prior > 0 ? Math.round(((recent - prior) / prior) * 100) : recent > 0 ? 100 : 0
    return { recent, prior, pctChange }
  }, [verifications])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>

  const maxAts = Math.max(...(stats.atsRanges.map(r => r.count) || [1]), 1)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><BarChart3 size={24} className="text-indigo-400" /> University Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Deep insights into your institution&apos;s student verification data and trends.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Students', value: stats.total, icon: Users, accent: '#8b5cf6', gradient: 'from-violet-500/15 to-violet-400/5' },
          { label: 'Degree Verified', value: stats.degreeV, icon: GraduationCap, accent: '#f59e0b', gradient: 'from-amber-500/15 to-amber-400/5' },
          { label: 'Police Verified', value: stats.policeV, icon: Shield, accent: '#3b82f6', gradient: 'from-blue-500/15 to-blue-400/5' },
          { label: 'Avg CGPA', value: stats.avgCgpa, icon: TrendingUp, accent: '#10b981', gradient: 'from-emerald-500/15 to-emerald-400/5' },
          { label: 'Avg ATS', value: stats.avgAts, icon: Sparkles, accent: '#14b8a6', gradient: 'from-teal-500/15 to-teal-400/5' },
          { label: 'Fully Verified', value: stats.fullyVerified, icon: CheckCircle2, accent: '#22c55e', gradient: 'from-green-500/15 to-green-400/5' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-xl p-4 border border-white/5 bg-gradient-to-br ${s.gradient}`}>
            <s.icon size={16} style={{ color: s.accent }} className="mb-2" />
            <p className="font-heading text-xl font-bold text-white">{s.value}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Verification Velocity + Trending Widget Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Velocity Card */}
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-indigo-400" />
            <h3 className="font-heading font-bold text-sm text-white">Verification Velocity</h3>
          </div>
          <div className="flex items-end gap-6 mb-3">
            <div>
              <p className="font-heading text-3xl font-bold text-white">{velocity.recent}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">This Week</p>
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-white/40">{velocity.prior}</p>
              <p className="text-[10px] text-white/20 uppercase tracking-wider mt-1">Last Week</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold ${velocity.pctChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {velocity.pctChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(velocity.pctChange)}% {velocity.pctChange >= 0 ? 'increase' : 'decrease'} from prior week
          </div>
        </div>

        {/* Trending Verifications */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-400" />
              <h3 className="font-heading font-bold text-sm text-white">Recent Verifications</h3>
            </div>
            <span className="text-[10px] text-white/20 uppercase tracking-wider">{recentVerifications.length} latest</span>
          </div>
          {recentVerifications.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">No verification activity yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {recentVerifications.map((v, i) => {
                const isApproved = ['ai_approved', 'admin_verified', 'verified'].includes(v.status)
                const isPending = ['pending', 'needs_review'].includes(v.status)
                const typeLabels: Record<string, string> = { resume: 'Resume', police: 'Police', aadhaar: 'Aadhaar', degree: 'Degree' }
                const typeColors: Record<string, string> = { resume: '#3b82f6', police: '#8b5cf6', aadhaar: '#14b8a6', degree: '#f59e0b' }
                return (
                  <motion.div key={v.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isApproved ? 'bg-emerald-500/15 text-emerald-400' : isPending ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                      {isApproved ? <CheckCircle2 size={13} /> : isPending ? <Clock size={13} /> : <AlertCircle size={13} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-white/80 truncate">{v.studentName}</p>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase" style={{ background: `${typeColors[v.type]}15`, color: typeColors[v.type] }}>
                          {typeLabels[v.type] || v.type}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/25 mt-0.5">
                        {v.ai_confidence ? `${v.ai_confidence}% conf` : ''} • {new Date(v.updated_at || v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${isApproved ? 'bg-emerald-500/10 text-emerald-400' : isPending ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                      {v.status?.replace(/_/g, ' ')}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ATS Distribution */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-heading font-bold text-sm text-white mb-6">ATS Score Distribution</h2>
        <div className="flex items-end gap-3 sm:gap-6 h-48">
          {stats.atsRanges.map((range, i) => (
            <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: 'easeOut' }} className="flex-1 flex flex-col items-center gap-2" style={{ transformOrigin: 'bottom' }}>
              <span className="text-xs font-bold text-white">{range.count}</span>
              <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${maxAts > 0 ? (range.count / maxAts) * 100 : 0}%`, minHeight: 4, background: range.color, opacity: 0.8 }} />
              <span className="text-[10px] text-white/40 font-medium">{range.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Course Breakdown */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-heading font-bold text-sm text-white mb-4">Course Breakdown</h2>
          {stats.courseBreakdown.length === 0 ? (
            <p className="text-sm text-white/30">No data available.</p>
          ) : (
            <div className="space-y-3">
              {stats.courseBreakdown.map(([course, count], i) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{course}</span>
                      <span className="text-white/40">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }} className="h-full bg-indigo-500 rounded-full" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Year Breakdown */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-heading font-bold text-sm text-white mb-4">Graduation Year</h2>
          {stats.yearBreakdown.length === 0 ? (
            <p className="text-sm text-white/30">No data available.</p>
          ) : (
            <div className="space-y-3">
              {stats.yearBreakdown.map(([year, count], i) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{year}</span>
                      <span className="text-white/40">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }} className="h-full bg-teal-500 rounded-full" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Verification coverage */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-heading font-bold text-sm text-white mb-4">Verification Coverage</h2>
        <div className="space-y-4">
          {[
            { label: 'Degree Certificate', count: stats.degreeV, color: '#f59e0b', icon: GraduationCap },
            { label: 'Police Check', count: stats.policeV, color: '#8b5cf6', icon: Shield },
            { label: 'Aadhaar KYC', count: stats.aadhaarV, color: '#14b8a6', icon: CreditCard },
          ].map((item, i) => {
            const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0
            return (
              <div key={i} className="flex items-center gap-4">
                <item.icon size={18} style={{ color: item.color }} className="flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/70">{item.label}</span>
                    <span className="text-xs text-white/40">{item.count}/{stats.total} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 + i * 0.1 }} className="h-full rounded-full" style={{ background: item.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

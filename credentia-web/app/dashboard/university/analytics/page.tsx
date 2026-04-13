'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { BarChart3, Users, GraduationCap, TrendingUp, Shield, CreditCard, Clock, CheckCircle2, AlertCircle, Sparkles, ArrowUpRight, ArrowDownRight, Search, LayoutTemplate, X, ChevronRight, BookOpen, Paperclip, FileText } from 'lucide-react'

export default function UniversityAnalytics() {
  const [students, setStudents] = useState<any[]>([])
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'roster'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch('/api/university/analytics')
        if (!res.ok) throw new Error('Failed to load analytics')
        const data = await res.json()

        if (mounted) {
          setIsVerified(data.is_verified ?? false)
        }
        
        if (!data.is_verified) {
          if (mounted) setLoading(false)
          return
        }

        const list = data.students || []
        const verifs = data.verifications || []

        const mapped = list.map((s: any) => {
          const myVerifs = verifs.filter((v: any) => v.student_id === s.id)
          const resumeVerif = myVerifs.find((v: any) => v.type === 'resume')
          const degreeVerif = myVerifs.find((v: any) => v.type === 'degree')
          const aiResult = resumeVerif?.ai_result || {}
          const degreeResult = degreeVerif?.ai_result || {}

          return {
            ...s,
            verifications: myVerifs,
            ats_score: aiResult.ats_score || s.ats_score || 0,
            course: degreeResult.course || aiResult.course || s.course || '',
            branch: degreeResult.branch || aiResult.branch || s.branch || '',
            cgpa: degreeResult.grade_cgpa || aiResult.cgpa || s.cgpa || '',
            graduation_year: degreeResult.year_of_passing || aiResult.graduation_year || s.graduation_year || '',
            degree_verified: myVerifs.some((v: any) => v.type === 'degree' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
            police_verified: myVerifs.some((v: any) => v.type === 'police' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
            aadhaar_verified: myVerifs.some((v: any) => v.type === 'aadhaar' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
            resume_verified: myVerifs.some((v: any) => v.type === 'resume' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
            marksheet10_verified: myVerifs.some((v: any) => v.type === 'marksheet_10th' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
            marksheet12_verified: myVerifs.some((v: any) => v.type === 'marksheet_12th' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
            passport_verified: myVerifs.some((v: any) => v.type === 'passport' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
            trust_score: s.trust_score || 0,
          }
        })

        if (mounted) {
          setStudents(mapped)
          setVerifications(verifs)
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (mounted) setLoading(false)
      }
    }
    load()

    const sub = supabase.channel('university_analytics_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => load())
      .subscribe()

    return () => { mounted = false; supabase.removeChannel(sub) }
  }, [])

  const stats = useMemo(() => {
    const total = students.length
    const resumeV = students.filter(s => s.resume_verified).length
    const degreeV = students.filter(s => s.degree_verified).length
    const policeV = students.filter(s => s.police_verified).length
    const aadhaarV = students.filter(s => s.aadhaar_verified).length
    const mark10V = students.filter(s => s.marksheet10_verified).length
    const mark12V = students.filter(s => s.marksheet12_verified).length
    const passportV = students.filter(s => s.passport_verified).length
    const avgAts = total ? Math.round(students.reduce((a, s) => a + (s.ats_score || 0), 0) / total) : 0
    const avgTrust = total ? Math.round(students.reduce((a, s) => a + (s.trust_score || 0), 0) / total) : 0
    const fullyVerified = students.filter(s => s.degree_verified && s.police_verified && s.aadhaar_verified).length

    // Course breakdown — filter out empty/unknown
    const courseBreakdown = (Object.entries(
      students.reduce((acc: Record<string, number>, s) => {
        const c = (s.course || '').trim()
        if (c && c !== 'Unknown' && c !== 'N/A') {
          acc[c] = (acc[c] || 0) + 1
        }
        return acc
      }, {})
    ) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 8)

    const yearBreakdown = (Object.entries(
      students.reduce((acc: Record<string, number>, s) => {
        const y = (s.graduation_year || '').toString().trim()
        if (y && y !== 'Unknown' && y !== 'N/A') {
          acc[y] = (acc[y] || 0) + 1
        }
        return acc
      }, {})
    ) as [string, number][]).sort((a, b) => a[0].localeCompare(b[0]))

    const atsRanges = [
      { label: '0–30', count: students.filter(s => (s.ats_score || 0) <= 30).length, color: '#ef4444' },
      { label: '31–50', count: students.filter(s => (s.ats_score || 0) > 30 && (s.ats_score || 0) <= 50).length, color: '#f59e0b' },
      { label: '51–70', count: students.filter(s => (s.ats_score || 0) > 50 && (s.ats_score || 0) <= 70).length, color: '#3b82f6' },
      { label: '71–90', count: students.filter(s => (s.ats_score || 0) > 70 && (s.ats_score || 0) <= 90).length, color: '#10b981' },
      { label: '91–100', count: students.filter(s => (s.ats_score || 0) > 90).length, color: '#22c55e' },
    ]

    const trustRanges = [
      { label: '0–20', count: students.filter(s => (s.trust_score || 0) <= 20).length, color: '#ef4444' },
      { label: '21–40', count: students.filter(s => (s.trust_score || 0) > 20 && (s.trust_score || 0) <= 40).length, color: '#f59e0b' },
      { label: '41–60', count: students.filter(s => (s.trust_score || 0) > 40 && (s.trust_score || 0) <= 60).length, color: '#3b82f6' },
      { label: '61–80', count: students.filter(s => (s.trust_score || 0) > 60 && (s.trust_score || 0) <= 80).length, color: '#8b5cf6' },
      { label: '81–100', count: students.filter(s => (s.trust_score || 0) > 80).length, color: '#22c55e' },
    ]

    return { total, resumeV, degreeV, policeV, aadhaarV, mark10V, mark12V, passportV, avgAts, avgTrust, fullyVerified, courseBreakdown, yearBreakdown, atsRanges, trustRanges }
  }, [students])

  const recentVerifications = useMemo(() => {
    return verifications.slice(0, 12).map(v => {
      const student = students.find(s => s.id === v.student_id)
      return { ...v, studentName: student?.name || 'Unknown' }
    })
  }, [verifications, students])

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

  const filteredStudents = useMemo(() => {
    return students.filter(s =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.course?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [students, searchQuery])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs text-text-muted tracking-wider">Loading Analytics...</span>
      </div>
    </div>
  )

  if (isVerified === false) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center p-8 rounded-2xl border border-orange-500/20 bg-orange-500/5"
      >
        <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-heading text-xl font-bold text-text-primary mb-2">Analytics Locked</h2>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          Your university account is pending admin verification. Analytics will become available once your institution is approved by the Credentia admin team.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-xs font-bold">
          <Clock size={14} className="animate-pulse" /> Verification In Progress
        </div>
      </motion.div>
    </div>
  )

  const maxAts = Math.max(...stats.atsRanges.map(r => r.count), 1)
  const maxTrust = Math.max(...stats.trustRanges.map(r => r.count), 1)
  const typeLabels: Record<string, string> = { resume: 'Resume', police: 'Police', aadhaar: 'Aadhaar', degree: 'Degree', marksheet_10th: '10th', marksheet_12th: '12th', passport: 'Other' }
  const typeColors: Record<string, string> = { resume: '#3b82f6', police: '#8b5cf6', aadhaar: '#14b8a6', degree: '#f59e0b', marksheet_10th: '#60a5fa', marksheet_12th: '#a78bfa', passport: '#2dd4bf' }

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6 px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 size={22} className="text-indigo-500 flex-shrink-0" /> University Analytics
          </h1>
          <p className="text-sm text-text-muted mt-1">Deep insights into your institution&apos;s verification data and trends.</p>
        </div>
        <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border">
          <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-indigo-500/10 text-indigo-500 shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
            <LayoutTemplate size={16} /> Overview
          </button>
          <button onClick={() => setActiveTab('roster')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'roster' ? 'bg-indigo-500/10 text-indigo-500 shadow-sm' : 'text-text-muted hover:text-text-primary'}`}>
            <Users size={16} /> Students
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-5 sm:space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Students', value: stats.total, icon: Users, accent: '#8b5cf6', gradient: 'from-violet-500/10 to-transparent' },
            { label: 'Degree Verified', value: stats.degreeV, icon: GraduationCap, accent: '#10b981', gradient: 'from-emerald-500/10 to-transparent' },
            { label: 'Police Verified', value: stats.policeV, icon: Shield, accent: '#3b82f6', gradient: 'from-blue-500/10 to-transparent' },
            { label: 'Avg Trust', value: `${stats.avgTrust}%`, icon: CheckCircle2, accent: '#22c55e', gradient: 'from-green-500/10 to-transparent' },
            { label: 'Avg ATS', value: stats.avgAts, icon: Sparkles, accent: '#14b8a6', gradient: 'from-teal-500/10 to-transparent' },
            { label: 'Fully Verified', value: stats.fullyVerified, icon: TrendingUp, accent: '#f59e0b', gradient: 'from-amber-500/10 to-transparent' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.4 }}
              className={`rounded-xl p-3 sm:p-4 border border-border bg-gradient-to-br ${s.gradient} hover:border-white/15 transition-all duration-300`}
            >
              <s.icon size={16} style={{ color: s.accent }} className="mb-2" />
              <p className="font-heading text-xl sm:text-2xl font-bold text-text-primary">{s.value}</p>
              <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold mt-0.5 leading-tight">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Velocity + Recent Verifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Velocity */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl border border-border bg-card p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/10"><TrendingUp size={16} className="text-indigo-400" /></div>
              <h3 className="font-heading font-bold text-sm text-text-primary">Verification Velocity</h3>
            </div>
            <div className="flex items-end gap-6 sm:gap-8 mb-4">
              <div>
                <p className="font-heading text-3xl sm:text-4xl font-bold text-text-primary">{velocity.recent}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">This Week</p>
              </div>
              <div>
                <p className="font-heading text-lg text-text-muted">{velocity.prior}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Last Week</p>
              </div>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
              velocity.pctChange >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
            }`}>
              {velocity.pctChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(velocity.pctChange)}% {velocity.pctChange >= 0 ? 'increase' : 'decrease'} from prior week
            </div>
          </motion.div>

          {/* Recent Verifications */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-2xl border border-border bg-card p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10"><Clock size={16} className="text-amber-400" /></div>
                <h3 className="font-heading font-bold text-sm text-text-primary">Recent Verifications</h3>
              </div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">{recentVerifications.length} latest</span>
            </div>
            {recentVerifications.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">No verification activity yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {recentVerifications.map((v, i) => {
                  const isApproved = ['ai_approved', 'admin_verified', 'verified'].includes(v.status)
                  const isPending = ['pending', 'needs_review'].includes(v.status)
                  return (
                    <motion.div key={v.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border border-border hover:border-white/10 transition-all duration-200"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isApproved ? 'bg-emerald-500/15 text-emerald-500' : isPending ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'}`}>
                        {isApproved ? <CheckCircle2 size={13} /> : isPending ? <Clock size={13} /> : <AlertCircle size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-text-primary truncate">{v.studentName}</p>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase flex-shrink-0" style={{ background: `${typeColors[v.type] || '#666'}15`, color: typeColors[v.type] || '#666' }}>
                            {typeLabels[v.type] || v.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {v.ai_confidence ? `${v.ai_confidence}% conf` : ''} • {new Date(v.updated_at || v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex-shrink-0 ${isApproved ? 'bg-emerald-500/10 text-emerald-500' : isPending ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                        {v.status?.replace(/_/g, ' ')}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* ATS + Trust Distribution */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* ATS Chart */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl border border-border bg-card p-4 sm:p-6"
          >
            <h2 className="font-heading font-bold text-sm text-text-primary mb-6">ATS Score Distribution</h2>
            {stats.total === 0 ? (
              <div className="h-48 flex items-center justify-center"><p className="text-sm text-text-muted">No data yet.</p></div>
            ) : (
              <div className="flex items-end gap-2 sm:gap-4 h-44 sm:h-48">
                {stats.atsRanges.map((range, i) => {
                  const heightPct = maxAts > 0 ? (range.count / maxAts) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-xs font-bold text-text-primary">{range.count}</span>
                      <div className="w-full relative" style={{ height: '140px' }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(heightPct, range.count > 0 ? 6 : 0)}%` }}
                          transition={{ delay: 0.4 + i * 0.1, duration: 0.7, ease: 'easeOut' }}
                          className="absolute bottom-0 w-full rounded-t-lg"
                          style={{ background: range.color, opacity: 0.85, minHeight: range.count > 0 ? 6 : 0 }}
                        />
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-text-muted font-medium text-center leading-tight">{range.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Trust Chart */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-4 sm:p-6"
          >
            <h2 className="font-heading font-bold text-sm text-text-primary mb-6">Trust Score Distribution</h2>
            {stats.total === 0 ? (
              <div className="h-48 flex items-center justify-center"><p className="text-sm text-text-muted">No data yet.</p></div>
            ) : (
              <div className="flex items-end gap-2 sm:gap-4 h-44 sm:h-48">
                {stats.trustRanges.map((range, i) => {
                  const heightPct = maxTrust > 0 ? (range.count / maxTrust) * 100 : 0
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-xs font-bold text-text-primary">{range.count}</span>
                      <div className="w-full relative" style={{ height: '140px' }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(heightPct, range.count > 0 ? 6 : 0)}%` }}
                          transition={{ delay: 0.4 + i * 0.1, duration: 0.7, ease: 'easeOut' }}
                          className="absolute bottom-0 w-full rounded-t-lg"
                          style={{ background: range.color, opacity: 0.85, minHeight: range.count > 0 ? 6 : 0 }}
                        />
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-text-muted font-medium text-center leading-tight">{range.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Course + Year Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-2xl border border-border bg-card p-4 sm:p-6"
          >
            <h2 className="font-heading font-bold text-sm text-text-primary mb-4">Course Breakdown</h2>
            {stats.courseBreakdown.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-text-muted">No course data available yet.</p>
                <p className="text-xs text-text-muted mt-1">Course info is extracted from resume and degree uploads.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.courseBreakdown.map(([course, count], i) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                      <div className="flex justify-between text-xs mb-1 gap-2">
                        <span className="text-text-primary opacity-80 truncate max-w-[65%]">{course}</span>
                        <span className="text-text-muted flex-shrink-0">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }} className="h-full bg-indigo-500 rounded-full" />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-2xl border border-border bg-card p-4 sm:p-6"
          >
            <h2 className="font-heading font-bold text-sm text-text-primary mb-4">Graduation Year</h2>
            {stats.yearBreakdown.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-text-muted">No graduation year data yet.</p>
                <p className="text-xs text-text-muted mt-1">Year info is extracted from degree uploads.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.yearBreakdown.map(([year, count], i) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-primary opacity-80">{year}</span>
                        <span className="text-text-muted">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }} className="h-full bg-teal-500 rounded-full" />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Verification Coverage — All 7 types */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-2xl border border-border bg-card p-4 sm:p-6"
        >
          <h2 className="font-heading font-bold text-sm text-text-primary mb-4">Verification Coverage</h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              { label: 'Resume / ATS', count: stats.resumeV, color: '#3b82f6', icon: FileText },
              { label: 'Degree Certificate', count: stats.degreeV, color: '#f59e0b', icon: GraduationCap },
              { label: '10th Marksheet', count: stats.mark10V, color: '#60a5fa', icon: BookOpen },
              { label: '12th Marksheet', count: stats.mark12V, color: '#a78bfa', icon: BookOpen },
              { label: 'Other Credential', count: stats.passportV, color: '#2dd4bf', icon: Paperclip },
              { label: 'Police Verification', count: stats.policeV, color: '#8b5cf6', icon: Shield },
              { label: 'Aadhaar KYC', count: stats.aadhaarV, color: '#14b8a6', icon: CreditCard },
            ].map((item, i) => {
              const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }}
                  className="flex items-center gap-3 sm:gap-4"
                >
                  <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${item.color}15` }}>
                    <item.icon size={16} style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <span className="text-xs sm:text-sm text-text-primary opacity-80 truncate">{item.label}</span>
                      <span className="text-xs text-text-muted flex-shrink-0">{item.count}/{stats.total} ({pct}%)</span>
                    </div>
                    <div className="h-2 sm:h-2.5 w-full bg-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.5 + i * 0.08 }}
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
      )}

      {/* ROSTER TAB */}
      {activeTab === 'roster' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search students by name or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-input text-sm text-text-primary focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-base border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-text-muted">Student Name</th>
                    <th className="px-4 py-3 font-semibold text-text-muted">Course / Year</th>
                    <th className="px-4 py-3 font-semibold text-text-muted">Trust</th>
                    <th className="px-4 py-3 font-semibold text-text-muted">ATS</th>
                    <th className="px-4 py-3 font-semibold text-text-muted text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-text-muted">No students match your search.</td></tr>
                  ) : (
                    filteredStudents.map((student, idx) => (
                      <motion.tr key={student.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                        className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-text-primary">{student.name}</p>
                          <p className="text-xs text-text-muted">{student.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-text-primary">{student.course || 'N/A'}</p>
                          <p className="text-xs text-text-muted">CGPA: {student.cgpa || 'N/A'} • Class of {student.graduation_year || '?'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-text-primary">{student.trust_score || 0}%</span>
                            <div className="flex -space-x-1">
                              {student.degree_verified && <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center"><GraduationCap size={10} /></div>}
                              {student.police_verified && <div className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-500 flex items-center justify-center"><Shield size={10} /></div>}
                              {student.aadhaar_verified && <div className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center"><CreditCard size={10} /></div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            (student.ats_score || 0) >= 70 ? 'bg-emerald-500/10 text-emerald-500' :
                            (student.ats_score || 0) >= 40 ? 'bg-amber-500/10 text-amber-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {student.ats_score || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setSelectedStudent(student)} className="p-2 text-text-muted hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors">
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedStudent(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="relative bg-card w-full max-w-xl rounded-2xl border border-border p-5 sm:p-6 shadow-xl overflow-y-auto max-h-[85vh]"
          >
            <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"><X size={20} /></button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                {selectedStudent.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-primary">{selectedStudent.name}</h3>
                <p className="text-sm text-text-muted">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-base border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">ATS Score</p>
                <div className="text-3xl font-bold text-emerald-500">{selectedStudent.ats_score || 0}</div>
              </div>
              <div className="bg-base border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Trust Score</p>
                <div className="text-3xl font-bold text-indigo-500">{selectedStudent.trust_score || 0}%</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-heading font-semibold text-text-primary border-b border-border pb-2">Academic & Details</h4>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div><span className="text-text-muted block text-xs">Course</span><span className="text-text-primary">{selectedStudent.course || 'N/A'}</span></div>
                <div><span className="text-text-muted block text-xs">CGPA</span><span className="text-text-primary">{selectedStudent.cgpa || 'N/A'}</span></div>
                <div><span className="text-text-muted block text-xs">Graduation Year</span><span className="text-text-primary">{selectedStudent.graduation_year || 'N/A'}</span></div>
                <div><span className="text-text-muted block text-xs">City</span><span className="text-text-primary">{selectedStudent.city || 'N/A'}</span></div>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <h4 className="font-heading font-semibold text-text-primary border-b border-border pb-2">Verifications</h4>
              <div className="space-y-2">
                {[
                  { key: 'resume', label: 'Resume / ATS', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { key: 'degree', label: 'Degree Certificate', icon: GraduationCap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { key: 'marksheet_10th', label: '10th Marksheet', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { key: 'marksheet_12th', label: '12th Marksheet', icon: BookOpen, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                  { key: 'passport', label: 'Other Credential', icon: Paperclip, color: 'text-teal-500', bg: 'bg-teal-500/10' },
                  { key: 'police', label: 'Police Verification', icon: Shield, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                  { key: 'aadhaar', label: 'Aadhaar KYC', icon: CreditCard, color: 'text-teal-500', bg: 'bg-teal-500/10' },
                ].map((v) => {
                  const record = selectedStudent.verifications?.find((r: any) => r.type === v.key)
                  const isVerified = record && ['verified', 'ai_approved', 'admin_verified'].includes(record.status)
                  const isPending = record && ['pending', 'needs_review'].includes(record.status)
                  return (
                    <div key={v.key} className="flex items-center justify-between p-3 rounded-xl border border-border bg-base">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${v.bg} ${v.color}`}><v.icon size={16} /></div>
                        <span className="text-sm font-medium text-text-primary">{v.label}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                        isVerified ? 'bg-emerald-500/10 text-emerald-500' :
                        isPending ? 'bg-amber-500/10 text-amber-500' :
                        'bg-white/5 text-text-muted'
                      }`}>
                        {isVerified ? 'Verified' : isPending ? 'Pending' : 'Not Uploaded'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

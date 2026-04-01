'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { BarChart3, Users, GraduationCap, TrendingUp, Shield, CreditCard, Clock, CheckCircle2, AlertCircle, Sparkles, ArrowUpRight, ArrowDownRight, Search, LayoutTemplate, X, ChevronRight } from 'lucide-react'

const calculateTrustScore = (verifications: any[]) => {
  if (!verifications?.length) return 0
  const verifiedCount = verifications.filter((v: any) =>
    ['ai_approved', 'admin_verified', 'verified'].includes(v.status)
  ).length
  return Math.round((verifiedCount / 4) * 100)
}

export default function UniversityAnalytics() {
  const [students, setStudents] = useState<any[]>([])
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'roster'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !mounted) return
      const { data: stuData } = await supabase.from('students').select('*').eq('university_id', session.user.id)
      const list = stuData || []
      
      const ids = list.map(s => s.id)
      let verifs: any[] = []
      if (ids.length > 0) {
        const { data: vData } = await supabase.from('verifications').select('*').in('student_id', ids).order('updated_at', { ascending: false })
        verifs = vData || []
      }

      const mapped = list.map(s => {
        const myVerifs = verifs.filter(v => v.student_id === s.id)
        const resumeVerif = myVerifs.find(v => v.type === 'resume')
        const degreeVerif = myVerifs.find(v => v.type === 'degree')
        const aiResult = resumeVerif?.ai_result || {}
        const degreeResult = degreeVerif?.ai_result || {}

        return {
          ...s,
          verifications: myVerifs,
          ats_score: aiResult.ats_score || s.ats_score || 0,
          course: degreeResult.course || aiResult.course || s.course || 'Unknown',
          cgpa: degreeResult.grade_cgpa || aiResult.cgpa || s.cgpa || '',
          degree_verified: myVerifs.some(v => v.type === 'degree' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
          police_verified: myVerifs.some(v => v.type === 'police' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
          aadhaar_verified: myVerifs.some(v => v.type === 'aadhaar' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
          verification_score: calculateTrustScore(myVerifs)
        }
      })

      if (mounted) {
        setStudents(mapped)
        setVerifications(verifs)
        setLoading(false)
      }
    }
    load()

    const sub = supabase.channel('university_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => { load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => { load() })
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(sub)
    }
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

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.course?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [students, searchQuery])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>

  const maxAts = Math.max(...(stats.atsRanges.map(r => r.count) || [1]), 1)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 size={24} className="text-indigo-500" /> University Analytics
          </h1>
          <p className="text-sm text-text-muted mt-1">Deep insights into your institution&apos;s student verification data and trends.</p>
        </div>
        
        <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-text-muted hover:text-text-primary'}`}
          >
            <LayoutTemplate size={16} /> Overview
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'roster' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-text-muted hover:text-text-primary'}`}
          >
            <Users size={16} /> Students
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-xl p-4 border border-border bg-card shadow-sm`}>
              <s.icon size={16} style={{ color: s.accent }} className="mb-2" />
              <p className="font-heading text-xl font-bold text-text-primary">{s.value}</p>
              <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Verification Velocity + Trending Widget Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Velocity Card */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-50/50 dark:bg-gradient-to-br dark:from-indigo-500/5 dark:to-transparent p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-indigo-500" />
              <h3 className="font-heading font-bold text-sm text-text-primary">Verification Velocity</h3>
            </div>
            <div className="flex items-end gap-6 mb-3">
              <div>
                <p className="font-heading text-3xl font-bold text-text-primary">{velocity.recent}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">This Week</p>
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-text-muted">{velocity.prior}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">Last Week</p>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold ${velocity.pctChange >= 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
              {velocity.pctChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(velocity.pctChange)}% {velocity.pctChange >= 0 ? 'increase' : 'decrease'} from prior week
            </div>
          </div>

          {/* Trending Verifications */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-amber-500" />
                <h3 className="font-heading font-bold text-sm text-text-primary">Recent Verifications</h3>
              </div>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">{recentVerifications.length} latest</span>
            </div>
            {recentVerifications.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-8">No verification activity yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {recentVerifications.map((v, i) => {
                  const isApproved = ['ai_approved', 'admin_verified', 'verified'].includes(v.status)
                  const isPending = ['pending', 'needs_review'].includes(v.status)
                  const typeLabels: Record<string, string> = { resume: 'Resume', police: 'Police', aadhaar: 'Aadhaar', degree: 'Degree' }
                  const typeColors: Record<string, string> = { resume: '#3b82f6', police: '#8b5cf6', aadhaar: '#14b8a6', degree: '#f59e0b' }
                  return (
                    <motion.div key={v.id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-base border border-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isApproved ? 'bg-emerald-500/15 text-emerald-500' : isPending ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'}`}>
                        {isApproved ? <CheckCircle2 size={13} /> : isPending ? <Clock size={13} /> : <AlertCircle size={13} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-text-primary truncate">{v.studentName}</p>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase" style={{ background: `${typeColors[v.type]}15`, color: typeColors[v.type] }}>
                            {typeLabels[v.type] || v.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-text-muted mt-0.5">
                          {v.ai_confidence ? `${v.ai_confidence}% conf` : ''} • {new Date(v.updated_at || v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${isApproved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : isPending ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
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
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading font-bold text-sm text-text-primary mb-6">ATS Score Distribution</h2>
          <div className="flex items-end gap-3 sm:gap-6 h-48">
            {stats.atsRanges.map((range, i) => (
              <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: 'easeOut' }} className="flex-1 flex flex-col items-center gap-2" style={{ transformOrigin: 'bottom' }}>
                <span className="text-xs font-bold text-text-primary">{range.count}</span>
                <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${maxAts > 0 ? (range.count / maxAts) * 100 : 0}%`, minHeight: 4, background: range.color, opacity: 0.8 }} />
                <span className="text-[10px] text-text-muted font-medium">{range.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Course Breakdown */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading font-bold text-sm text-text-primary mb-4">Course Breakdown</h2>
            {stats.courseBreakdown.length === 0 ? (
              <p className="text-sm text-text-muted">No data available.</p>
            ) : (
              <div className="space-y-3">
                {stats.courseBreakdown.map(([course, count], i) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-primary opacity-80 truncate">{course}</span>
                        <span className="text-text-muted">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }} className="h-full bg-indigo-500 rounded-full" />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Year Breakdown */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-heading font-bold text-sm text-text-primary mb-4">Graduation Year</h2>
            {stats.yearBreakdown.length === 0 ? (
              <p className="text-sm text-text-muted">No data available.</p>
            ) : (
              <div className="space-y-3">
                {stats.yearBreakdown.map(([year, count], i) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-primary opacity-80 text-left">{year}</span>
                        <span className="text-text-muted text-right">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-border rounded-full overflow-hidden">
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
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading font-bold text-sm text-text-primary mb-4">Verification Coverage</h2>
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
                      <span className="text-sm text-text-primary opacity-80">{item.label}</span>
                      <span className="text-xs text-text-muted">{item.count}/{stats.total} ({pct}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-border rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 + i * 0.1 }} className="h-full rounded-full" style={{ background: item.color }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
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
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                        No students match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-text-primary">{student.name}</p>
                            <p className="text-xs text-text-muted">{student.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-text-primary">{student.course || 'N/A'}</p>
                          <p className="text-xs text-text-muted">CGPA: {student.cgpa || 'N/A'} • Class of {student.graduation_year || '?'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-text-primary">{student.verification_score}%</span>
                            <div className="flex -space-x-1">
                              {student.degree_verified && <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center"><GraduationCap size={10} /></div>}
                              {student.police_verified && <div className="w-4 h-4 rounded-full bg-violet-500/20 text-violet-500 flex items-center justify-center"><Shield size={10} /></div>}
                              {student.aadhaar_verified && <div className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-500 flex items-center justify-center"><CreditCard size={10} /></div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                              (student.ats_score || 0) >= 70 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                              (student.ats_score || 0) >= 40 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                              'bg-red-500/10 text-red-600 dark:text-red-400'
                           }`}>
                             {student.ats_score || 0}
                           </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-2 text-text-muted hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-card w-full max-w-xl rounded-2xl border border-border p-6 shadow-xl overflow-y-auto max-h-[85vh]">
            <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary"><X size={20} /></button>
            
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
                <div className="text-3xl font-bold text-indigo-500">{selectedStudent.verification_score}%</div>
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
                  { key: 'degree', label: 'Degree Verification', icon: GraduationCap, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { key: 'police', label: 'Police Check', icon: Shield, color: 'text-violet-500', bg: 'bg-violet-500/10' },
                  { key: 'aadhaar', label: 'Aadhaar KYC', icon: CreditCard, color: 'text-teal-500', bg: 'bg-teal-500/10' },
                ].map((v) => {
                  const record = selectedStudent.verifications?.find((r: any) => r.type === v.key)
                  const isVerified = record && ['verified', 'ai_approved', 'admin_verified'].includes(record.status)
                  return (
                    <div key={v.key} className="flex items-center justify-between p-3 rounded-xl border border-border bg-base">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${v.bg} ${v.color}`}><v.icon size={16} /></div>
                        <span className="text-sm font-medium text-text-primary">{v.label}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                        isVerified ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {isVerified ? 'Verified' : 'Unverified'}
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

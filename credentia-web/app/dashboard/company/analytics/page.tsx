'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { BarChart3, Users, Shield, GraduationCap, TrendingUp, CreditCard, CheckCircle2, Sparkles, BookmarkCheck, ArrowUpRight, Search, FileText, ChevronRight, X, LayoutTemplate } from 'lucide-react'

const calculateTrustScore = (verifications: any[]) => {
  if (!verifications?.length) return 0
  const verifiedCount = verifications.filter((v: any) =>
    ['ai_approved', 'admin_verified', 'verified'].includes(v.status)
  ).length
  return Math.round((verifiedCount / 4) * 100)
}

export default function CompanyAnalytics() {
  const [students, setStudents] = useState<any[]>([])
  const [savedCount, setSavedCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'roster'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !mounted) { setLoading(false); return }

      // Fetch students with verifications joined (same as company main page)
      const { data: stuData } = await supabase
        .from('students')
        .select('*, verifications(*)')
        .eq('profile_is_public', true)

      // Map students with extracted real ATS scores
      const mapped = (stuData || []).map((s: any) => {
        const resumeVerif = s.verifications?.find((v: any) => v.type === 'resume')
        const degreeVerif = s.verifications?.find((v: any) => v.type === 'degree')
        const aiResult = resumeVerif?.ai_result || {}
        const degreeResult = degreeVerif?.ai_result || {}

        return {
          ...s,
          ats_score: aiResult.ats_score || s.ats_score || 0,
          course: degreeResult.course || aiResult.course || s.course || 'Unknown',
          cgpa: degreeResult.grade_cgpa || aiResult.cgpa || s.cgpa || '',
          degree_verified: s.verifications?.some((v: any) => v.type === 'degree' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
          police_verified: s.verifications?.some((v: any) => v.type === 'police' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
          aadhaar_verified: s.verifications?.some((v: any) => v.type === 'aadhaar' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
          verification_score: calculateTrustScore(s.verifications || []),
        }
      })

      if (mounted) {
        setStudents(mapped)
        const { count } = await supabase
          .from('saved_candidates')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', user.id)
        setSavedCount(count || 0)
        setLoading(false)
      }
    }
    load()

    const sub = supabase.channel('company_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => { load() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => { load() })
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(sub)
    }
  }, [])

  const stats = useMemo(() => {
    const list = students
    const total = list.length
    const policeV = list.filter(s => s.police_verified).length
    const aadhaarV = list.filter(s => s.aadhaar_verified).length
    const degreeV = list.filter(s => s.degree_verified).length
    const avgAts = total ? Math.round(list.reduce((a, s) => a + (s.ats_score || 0), 0) / total) : 0
    const fullyVerified = list.filter(s => s.degree_verified && s.police_verified && s.aadhaar_verified).length
    const highAts = list.filter(s => (s.ats_score || 0) >= 70).length

    const atsRanges = [
      { label: '0–30', count: list.filter(s => (s.ats_score || 0) <= 30).length, color: '#ef4444' },
      { label: '31–50', count: list.filter(s => (s.ats_score || 0) > 30 && (s.ats_score || 0) <= 50).length, color: '#f59e0b' },
      { label: '51–70', count: list.filter(s => (s.ats_score || 0) > 50 && (s.ats_score || 0) <= 70).length, color: '#3b82f6' },
      { label: '71–90', count: list.filter(s => (s.ats_score || 0) > 70 && (s.ats_score || 0) <= 90).length, color: '#10b981' },
      { label: '91–100', count: list.filter(s => (s.ats_score || 0) > 90).length, color: '#22c55e' },
    ]

    const courseBreakdown = (Object.entries(
      list.reduce((acc: Record<string, number>, s) => {
        const c = s.course || 'Unknown'
        acc[c] = (acc[c] || 0) + 1
        return acc
      }, {})
    ) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 8)

    return { total, policeV, aadhaarV, degreeV, avgAts, fullyVerified, highAts, atsRanges, courseBreakdown }
  }, [students])

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.course?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [students, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xs text-white/30 dark:text-white/30 font-medium tracking-wider">Loading Analytics...</span>
        </div>
      </div>
    )
  }

  const maxAts = Math.max(...stats.atsRanges.map(r => r.count), 1)

  const statCards = [
    { label: 'Total Candidates', value: stats.total, icon: Users, accent: '#10b981', gradient: 'from-emerald-500/15 to-emerald-400/5' },
    { label: 'Avg ATS Score', value: stats.avgAts, icon: TrendingUp, accent: '#3b82f6', gradient: 'from-blue-500/15 to-blue-400/5' },
    { label: 'High ATS (70+)', value: stats.highAts, icon: Sparkles, accent: '#22c55e', gradient: 'from-green-500/15 to-green-400/5' },
    { label: 'Fully Verified', value: stats.fullyVerified, icon: CheckCircle2, accent: '#14b8a6', gradient: 'from-teal-500/15 to-teal-400/5' },
    { label: 'Police Verified', value: stats.policeV, icon: Shield, accent: '#8b5cf6', gradient: 'from-violet-500/15 to-violet-400/5' },
    { label: 'Saved by You', value: savedCount, icon: BookmarkCheck, accent: '#f59e0b', gradient: 'from-amber-500/15 to-amber-400/5' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <BarChart3 size={22} className="text-emerald-500 flex-shrink-0" />
            Talent Analytics
          </h1>
          <p className="text-sm text-text-muted mt-1">Insights into the available talent pool and detailed candidate roster.</p>
        </div>
        
        <div className="flex items-center gap-1 bg-white/5 dark:bg-black/20 p-1 rounded-lg border border-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-text-muted hover:text-text-primary'}`}
          >
            <LayoutTemplate size={16} /> Overview
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'roster' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-text-muted hover:text-text-primary'}`}
          >
            <Users size={16} /> Roster
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {statCards.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl p-3 sm:p-4 border border-border bg-gradient-to-br ${s.gradient}`}
              >
                <s.icon size={16} style={{ color: s.accent }} className="mb-2" />
                <p className="font-heading text-xl sm:text-2xl font-bold text-text-primary">{s.value}</p>
                <p className="text-[9px] text-text-muted uppercase tracking-wider font-semibold mt-0.5 leading-tight">{s.label}</p>
              </motion.div>
            ))}
          </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* ATS Distribution Bar Chart */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-heading font-bold text-sm text-text-primary mb-4 sm:mb-6">ATS Score Distribution</h2>
          {stats.total === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-text-muted">No candidate data yet.</p>
            </div>
          ) : (
            <div className="flex items-end gap-2 sm:gap-4 lg:gap-6 h-44 sm:h-48">
              {stats.atsRanges.map((range, i) => {
                const heightPct = maxAts > 0 ? (range.count / maxAts) * 100 : 0
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-xs font-bold text-text-primary">{range.count}</span>
                    <div className="w-full rounded-t-lg relative" style={{ height: '160px' }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(heightPct, range.count > 0 ? 4 : 0)}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
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
        </div>

        {/* Course Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
          <h2 className="font-heading font-bold text-sm text-text-primary mb-4">Top Courses in Pool</h2>
          {stats.courseBreakdown.length === 0 ? (
            <p className="text-sm text-text-muted">No data available.</p>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {stats.courseBreakdown.map(([course, count], i) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-text-primary opacity-80 truncate pr-2 max-w-[60%]">{course}</span>
                      <span className="text-text-muted flex-shrink-0">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Verification Coverage */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-heading font-bold text-sm text-text-primary mb-4">Verification Coverage</h2>
        <div className="space-y-3 sm:space-y-4">
          {[
            { label: 'Police Verification', count: stats.policeV, color: '#8b5cf6', icon: Shield },
            { label: 'Aadhaar KYC', count: stats.aadhaarV, color: '#14b8a6', icon: CreditCard },
            { label: 'Degree Certificate', count: stats.degreeV, color: '#f59e0b', icon: GraduationCap },
          ].map((item, i) => {
            const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0
            return (
              <div key={i} className="flex items-center gap-3 sm:gap-4">
                <item.icon size={16} style={{ color: item.color }} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-xs sm:text-sm text-text-primary opacity-80 truncate">{item.label}</span>
                    <span className="text-xs text-text-muted flex-shrink-0">{item.count}/{stats.total} ({pct}%)</span>
                  </div>
                  <div className="h-2 sm:h-2.5 w-full bg-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Talent Quality Snapshot */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-gradient-to-br dark:from-emerald-500/5 dark:to-transparent p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <ArrowUpRight size={18} className="text-emerald-500" />
          <h3 className="font-heading font-bold text-sm text-text-primary">Talent Quality Snapshot</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { value: stats.total > 0 ? `${Math.round((stats.highAts / stats.total) * 100)}%` : '0%', label: 'High ATS Rate' },
            { value: stats.total > 0 ? `${Math.round((stats.fullyVerified / stats.total) * 100)}%` : '0%', label: 'Full Verify Rate' },
            { value: stats.total > 0 ? `${Math.round((stats.policeV / stats.total) * 100)}%` : '0%', label: 'BG Check Rate' },
            { value: `${stats.degreeV}`, label: 'Degree Verified' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="p-3 sm:p-4 rounded-xl bg-card border border-border text-center"
            >
              <p className="font-heading text-xl sm:text-2xl font-bold text-text-primary">{item.value}</p>
              <p className="text-[9px] sm:text-[10px] text-text-muted uppercase tracking-wider mt-1 leading-tight">{item.label}</p>
            </motion.div>
          ))}
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
              placeholder="Search candidates by name or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-input text-sm text-text-primary focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-base border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-text-muted">Candidate</th>
                    <th className="px-4 py-3 font-semibold text-text-muted">Course</th>
                    <th className="px-4 py-3 font-semibold text-text-muted">Trust</th>
                    <th className="px-4 py-3 font-semibold text-text-muted">ATS</th>
                    <th className="px-4 py-3 font-semibold text-text-muted text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                        No candidates match your search.
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
                          <p className="text-xs text-text-muted">CGPA: {student.cgpa || 'N/A'}</p>
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
                            className="p-2 text-text-muted hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
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

      {/* Candidate Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedStudent(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-card w-full max-w-xl rounded-2xl border border-border p-6 shadow-xl overflow-y-auto max-h-[85vh]">
            <button onClick={() => setSelectedStudent(null)} className="absolute top-4 right-4 text-text-muted hover:text-text-primary"><X size={20} /></button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0 text-xl font-bold">
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
                <div className="text-3xl font-bold text-blue-500">{selectedStudent.verification_score}%</div>
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

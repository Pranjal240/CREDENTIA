'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Shield, CheckCircle2, AlertCircle, Clock, Search, Filter, ChevronDown, ChevronUp, Eye, X, TrendingUp, FileText, CreditCard, GraduationCap, ToggleLeft, ToggleRight, Building, Briefcase, ExternalLink, BarChart3 } from 'lucide-react'

type Props = {
  profiles: any[]
  students: any[]
  verifications: any[]
  recentAudit: any[]
  currentUserId: string
}

export default function AdminClient({ profiles, students, verifications, recentAudit, currentUserId }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [localStudents, setLocalStudents] = useState(students)
  const [localVerifications, setLocalVerifications] = useState(verifications)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'queue'>('overview')

  // Stats
  const totalUsers = profiles.length
  const studentCount = profiles.filter(p => p.role === 'student').length
  const companyCount = profiles.filter(p => p.role === 'company').length
  const uniCount = profiles.filter(p => p.role === 'university').length
  const pendingVerifications = verifications.filter(v => ['pending', 'needs_review'].includes(v.status)).length
  const approvedCount = verifications.filter(v => ['ai_approved', 'admin_verified', 'verified'].includes(v.status)).length
  const publicStudents = localStudents.filter(s => s.profile_is_public).length

  // Merge students with profiles for display
  const enrichedStudents = useMemo(() => {
    return localStudents.map(s => {
      const prof = profiles.find(p => p.id === s.id)
      const vList = localVerifications.filter(v => v.student_id === s.id)
      return { ...s, email: prof?.email || s.email, fullName: prof?.full_name || s.name || prof?.email?.split('@')[0] || 'Unknown', verifications: vList }
    })
  }, [localStudents, profiles, localVerifications])

  const filteredStudents = useMemo(() => {
    return enrichedStudents.filter(s => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!(s.fullName?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.course?.toLowerCase().includes(q))) return false
      }
      if (filterStatus === 'public' && !s.profile_is_public) return false
      if (filterStatus === 'private' && s.profile_is_public) return false
      return true
    })
  }, [enrichedStudents, searchQuery, filterStatus])

  const pendingQueue = useMemo(() => {
    return verifications.filter(v => ['pending', 'needs_review'].includes(v.status)).map(v => {
      const student = localStudents.find(s => s.id === v.student_id)
      const prof = profiles.find(p => p.id === v.student_id)
      return { ...v, studentName: prof?.full_name || student?.name || 'Unknown', studentEmail: prof?.email || student?.email }
    })
  }, [verifications, localStudents, profiles])

  const toggleCompanyAccess = async (studentId: string, currentVal: boolean) => {
    setActionLoading(prev => ({ ...prev, [`toggle-${studentId}`]: true }))
    try {
      const res = await fetch('/api/admin/toggle-company-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, isPublic: !currentVal })
      })
      if (res.ok) {
        setLocalStudents(prev => prev.map(s => s.id === studentId ? { ...s, profile_is_public: !currentVal, police_share_with_companies: !currentVal } : s))
      }
    } catch {}
    setActionLoading(prev => ({ ...prev, [`toggle-${studentId}`]: false }))
  }

  const handlePoliceAction = async (verificationId: string, action: 'approve' | 'reject') => {
    setActionLoading(prev => ({ ...prev, [verificationId]: true }))
    try {
      const res = await fetch('/api/admin/police-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, action })
      })
      if (res.ok) {
        const newStatus = action === 'approve' ? 'admin_verified' : 'rejected'
        setLocalVerifications(prev => prev.map(v => v.id === verificationId ? { ...v, status: newStatus } : v))
      }
    } catch {}
    setActionLoading(prev => ({ ...prev, [verificationId]: false }))
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; bg: string; label: string }> = {
      ai_approved: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'AI Verified' },
      admin_verified: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'Admin OK' },
      verified: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'Verified' },
      pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Pending' },
      needs_review: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'Review' },
      rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Rejected' },
    }
    return map[status] || { color: '#64748b', bg: 'rgba(100,116,139,0.08)', label: status }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-white mb-1">Admin Control Panel</h1>
        <p className="text-sm text-white/40">Complete oversight of the Credentia platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Users', value: totalUsers, icon: Users, accent: '#3b82f6', gradient: 'from-blue-500/15 to-blue-400/5' },
          { label: 'Students', value: studentCount, icon: GraduationCap, accent: '#8b5cf6', gradient: 'from-violet-500/15 to-violet-400/5' },
          { label: 'Companies', value: companyCount, icon: Briefcase, accent: '#10b981', gradient: 'from-emerald-500/15 to-emerald-400/5' },
          { label: 'Universities', value: uniCount, icon: Building, accent: '#14b8a6', gradient: 'from-teal-500/15 to-teal-400/5' },
          { label: 'Pending Reviews', value: pendingVerifications, icon: Clock, accent: '#f59e0b', gradient: 'from-amber-500/15 to-amber-400/5' },
          { label: 'Public Profiles', value: publicStudents, icon: Eye, accent: '#ec4899', gradient: 'from-pink-500/15 to-pink-400/5' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className={`rounded-xl p-4 border border-white/5 bg-gradient-to-br ${stat.gradient}`}>
            <stat.icon size={16} style={{ color: stat.accent }} className="mb-2" />
            <p className="font-heading text-xl font-bold text-white">{stat.value}</p>
            <p className="text-[9px] font-semibold tracking-wider uppercase text-white/30 mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/5">
        {[
          { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
          { id: 'students' as const, label: 'Student Management', icon: Users },
          { id: 'queue' as const, label: `Review Queue (${pendingVerifications})`, icon: Clock },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Verification breakdown */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-heading font-bold text-sm text-white mb-4">Verification Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['resume', 'police', 'aadhaar', 'degree'].map(type => {
                const typeV = verifications.filter(v => v.type === type)
                const approved = typeV.filter(v => ['ai_approved', 'admin_verified', 'verified'].includes(v.status)).length
                const icons: Record<string, any> = { resume: FileText, police: Shield, aadhaar: CreditCard, degree: GraduationCap }
                const Icon = icons[type]
                return (
                  <div key={type} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <Icon size={18} className="text-blue-400 mb-2" />
                    <p className="text-sm font-medium text-white capitalize">{type}</p>
                    <p className="text-xs text-white/30 mt-1">{approved}/{typeV.length} verified</p>
                    <div className="h-1.5 w-full bg-white/5 rounded-full mt-2"><div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" style={{ width: `${typeV.length ? (approved / typeV.length) * 100 : 0}%` }} /></div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-heading font-bold text-sm text-white mb-4">Recent Activity</h3>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-white/30">No recent admin actions.</p>
            ) : (
              <div className="space-y-3">
                {recentAudit.slice(0, 10).map((log, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center"><Shield size={14} className="text-blue-400" /></div>
                    <div className="flex-1"><p className="text-sm text-white/70">{log.action?.replace(/_/g, ' ')}</p><p className="text-[10px] text-white/30">{log.target_type} • {new Date(log.created_at).toLocaleString('en-IN')}</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Search & filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search students..." className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-11 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white/70 focus:outline-none">
              <option value="all">All Students</option><option value="public">Public Only</option><option value="private">Private Only</option>
            </select>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#0e0e14]">
                  <tr>
                    {['Student', 'Course', 'ATS', 'Verifications', 'Company Access', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredStudents.map(s => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-xs">{(s.fullName || 'U')[0].toUpperCase()}</div>
                          <div><p className="font-medium text-white/80 text-xs">{s.fullName || 'Unnamed'}</p><p className="text-[10px] text-white/30">{s.email || '—'}</p></div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-white/60">{s.course || '—'}</td>
                      <td className="px-5 py-3"><span className="text-xs font-bold" style={{ color: `hsl(${(s.ats_score || 0) * 1.2}, 70%, 50%)` }}>{s.ats_score || '—'}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          {[{ ok: s.degree_verified, l: 'D' }, { ok: s.police_verified, l: 'P' }, { ok: s.aadhaar_verified, l: 'A' }].map((b, j) => (
                            <span key={j} className={`text-[7px] font-bold w-5 h-5 rounded flex items-center justify-center ${b.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/15 border border-white/5'}`}>{b.l}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => toggleCompanyAccess(s.id, s.profile_is_public)}
                          disabled={actionLoading[`toggle-${s.id}`]}
                          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                          style={{ color: s.profile_is_public ? '#34d399' : '#f87171' }}
                        >
                          {actionLoading[`toggle-${s.id}`] ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                          ) : s.profile_is_public ? (
                            <><ToggleRight size={18} /> Public</>
                          ) : (
                            <><ToggleLeft size={18} /> Private</>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => setSelectedStudent(s)} className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors">Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredStudents.length === 0 && <div className="p-12 text-center text-white/30 text-sm">No students found.</div>}
          </div>
        </div>
      )}

      {/* ── REVIEW QUEUE TAB ── */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          <p className="text-sm text-white/40">{pendingQueue.length} item{pendingQueue.length !== 1 ? 's' : ''} pending review</p>
          {pendingQueue.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
              <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald-400/30" />
              <p className="text-white/60 font-medium">All clear!</p>
              <p className="text-sm text-white/30 mt-1">No verifications pending review.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingQueue.map((v, i) => {
                const badge = getStatusBadge(v.status)
                const typeLabels: Record<string, string> = { resume: 'Resume', police: 'Police', aadhaar: 'Aadhaar', degree: 'Degree' }
                return (
                  <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white/90 text-sm">{v.studentName}</p>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                      </div>
                      <p className="text-xs text-white/30">{v.studentEmail} • {typeLabels[v.type] || v.type} • Confidence: {v.ai_confidence}%</p>
                      {v.document_url && <a href={v.document_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 flex items-center gap-1 mt-1"><ExternalLink size={10} /> View Document</a>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePoliceAction(v.id, 'approve')}
                        disabled={actionLoading[v.id]}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                      >
                        {actionLoading[v.id] ? '...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => handlePoliceAction(v.id, 'reject')}
                        disabled={actionLoading[v.id]}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        {actionLoading[v.id] ? '...' : '✗ Reject'}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedStudent(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0e14] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-lg">{(selectedStudent.fullName || 'U')[0].toUpperCase()}</div>
                <div><p className="font-heading font-bold text-white">{selectedStudent.fullName}</p><p className="text-xs text-white/40">{selectedStudent.email}</p></div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-lg hover:bg-white/5 text-white/30"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { l: 'Course', v: selectedStudent.course },
                { l: 'CGPA', v: selectedStudent.cgpa },
                { l: 'ATS Score', v: selectedStudent.ats_score },
                { l: 'Year', v: selectedStudent.graduation_year },
                { l: 'City', v: selectedStudent.city },
                { l: 'State', v: selectedStudent.state },
              ].map((d, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-[9px] text-white/25 uppercase mb-0.5">{d.l}</p>
                  <p className="text-sm text-white/80">{d.v || '—'}</p>
                </div>
              ))}
            </div>

            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">All Verifications</h4>
            <div className="space-y-2">
              {(selectedStudent.verifications || []).length === 0 ? (
                <p className="text-sm text-white/30">No verifications found.</p>
              ) : (
                selectedStudent.verifications.map((v: any, i: number) => {
                  const badge = getStatusBadge(v.status)
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white/70 font-medium capitalize">{v.type}</p>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
                        </div>
                        <p className="text-[10px] text-white/30 mt-0.5">Confidence: {v.ai_confidence}% • Updated: {new Date(v.updated_at).toLocaleDateString('en-IN')}</p>
                      </div>
                      {v.document_url && <a href={v.document_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400"><ExternalLink size={14} /></a>}
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

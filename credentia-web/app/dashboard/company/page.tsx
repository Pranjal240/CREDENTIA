'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, ChevronDown, ChevronUp, Users, Shield, GraduationCap, CreditCard, FileText, TrendingUp, Eye, X, Bookmark, BookmarkCheck, Mail, ExternalLink, CheckCircle2, LayoutGrid, List, ChevronLeft, ChevronRight, Briefcase, Building } from 'lucide-react'

export default function CompanyDashboard() {
  const [students, setStudents] = useState<any[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [atsMin, setAtsMin] = useState(0)
  const [atsMax, setAtsMax] = useState(100)
  const [filterPolice, setFilterPolice] = useState(false)
  const [filterAadhaar, setFilterAadhaar] = useState(false)
  const [filterDegree, setFilterDegree] = useState(false)
  const [cgpaMin, setCgpaMin] = useState('')
  const [filterCourse, setFilterCourse] = useState('all')
  const [filterYear, setFilterYear] = useState('all')
  const [sortBy, setSortBy] = useState('ats_score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)
  const [perPage] = useState(12)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      const { data } = await supabase.from('students').select('*').eq('profile_is_public', true).order('ats_score', { ascending: false })
      setStudents(data || [])
      const { data: saved } = await supabase.from('saved_candidates').select('student_id').eq('company_id', session.user.id)
      if (saved) setSavedIds(new Set(saved.map((s: any) => s.student_id)))
      setLoading(false)
    }
    load()
  }, [])

  const courses = useMemo(() => Array.from(new Set(students.map(s => s.course).filter(Boolean))), [students])
  const years = useMemo(() => Array.from(new Set(students.map(s => s.graduation_year).filter(Boolean))).sort(), [students])

  const filtered = useMemo(() => {
    let result = students.filter(s => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!(s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.course?.toLowerCase().includes(q))) return false
      }
      const ats = s.ats_score || 0
      if (ats < atsMin || ats > atsMax) return false
      if (filterPolice && !s.police_verified) return false
      if (filterAadhaar && !s.aadhaar_verified) return false
      if (filterDegree && !s.degree_verified) return false
      if (cgpaMin && (parseFloat(s.cgpa) || 0) < parseFloat(cgpaMin)) return false
      if (filterCourse !== 'all' && s.course !== filterCourse) return false
      if (filterYear !== 'all' && s.graduation_year?.toString() !== filterYear) return false
      return true
    })

    result.sort((a: any, b: any) => {
      let aVal = a[sortBy], bVal = b[sortBy]
      if (sortBy === 'name') { aVal = aVal?.toLowerCase() || ''; bVal = bVal?.toLowerCase() || '' }
      if (['ats_score', 'cgpa', 'verification_score', 'graduation_year'].includes(sortBy)) { aVal = parseFloat(aVal) || 0; bVal = parseFloat(bVal) || 0 }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [students, searchQuery, atsMin, atsMax, filterPolice, filterAadhaar, filterDegree, cgpaMin, filterCourse, filterYear, sortBy, sortDir])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const toggleSave = async (studentId: string) => {
    setSavingId(studentId)
    try {
      const res = await fetch('/api/company/save-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: userId, studentId, action: savedIds.has(studentId) ? 'unsave' : 'save' }),
      })
      if (res.ok) {
        setSavedIds(prev => {
          const next = new Set(prev)
          if (next.has(studentId)) next.delete(studentId); else next.add(studentId)
          return next
        })
      }
    } catch {}
    setSavingId(null)
  }

  const policeVerCount = students.filter(s => s.police_verified).length
  const avgAts = students.length ? Math.round(students.reduce((a, s) => a + (s.ats_score || 0), 0) / students.length) : 0

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /><span className="text-xs text-white/30 tracking-wider">LOADING TALENT POOL...</span></div></div>

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><Briefcase size={28} /></div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-white mb-1">Talent Discovery</h1>
            <p className="text-sm text-white/40">Browse verified candidates with AI-powered credential analysis.</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Available Talent', value: students.length, icon: Users, accent: '#10b981', gradient: 'from-emerald-500/15 to-emerald-400/5' },
          { label: 'Police Verified', value: policeVerCount, icon: Shield, accent: '#8b5cf6', gradient: 'from-violet-500/15 to-violet-400/5' },
          { label: 'Avg ATS Score', value: avgAts, icon: TrendingUp, accent: '#3b82f6', gradient: 'from-blue-500/15 to-blue-400/5' },
          { label: 'Saved Candidates', value: savedIds.size, icon: BookmarkCheck, accent: '#f59e0b', gradient: 'from-amber-500/15 to-amber-400/5' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className={`rounded-2xl p-5 border border-white/5 bg-gradient-to-br ${stat.gradient}`}>
            <stat.icon size={18} style={{ color: stat.accent }} className="mb-3" />
            <p className="font-heading text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1) }} placeholder="Search candidates by name, email, or course..." className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors">
              <Filter size={16} /> Filters {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <div className="flex rounded-xl border border-white/10 overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2 transition-colors ${viewMode === 'grid' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-white/40'}`}><LayoutGrid size={16} /></button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2 transition-colors ${viewMode === 'list' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-white/40'}`}><List size={16} /></button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {/* ATS slider */}
                <div className="pt-4">
                  <label className="text-[9px] text-white/25 uppercase tracking-wider mb-2 block">ATS Score Range: {atsMin} – {atsMax}</label>
                  <div className="flex gap-4 items-center">
                    <input type="range" min={0} max={100} value={atsMin} onChange={e => { setAtsMin(Number(e.target.value)); setPage(1) }} className="flex-1 accent-emerald-500" />
                    <input type="range" min={0} max={100} value={atsMax} onChange={e => { setAtsMax(Number(e.target.value)); setPage(1) }} className="flex-1 accent-emerald-500" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* Verification checkboxes */}
                  <div className="space-y-2">
                    <label className="text-[9px] text-white/25 uppercase tracking-wider block">Required Verifications</label>
                    {[
                      { label: 'Police ✓', checked: filterPolice, set: setFilterPolice },
                      { label: 'Aadhaar ✓', checked: filterAadhaar, set: setFilterAadhaar },
                      { label: 'Degree ✓', checked: filterDegree, set: setFilterDegree },
                    ].map((cb, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={cb.checked} onChange={e => { cb.set(e.target.checked); setPage(1) }} className="rounded accent-emerald-500 w-3.5 h-3.5" />
                        <span className="text-xs text-white/60">{cb.label}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <label className="text-[9px] text-white/25 uppercase tracking-wider mb-1 block">Min CGPA</label>
                    <input type="number" step="0.1" min="0" max="10" value={cgpaMin} onChange={e => { setCgpaMin(e.target.value); setPage(1) }} placeholder="0.0" className="w-full h-9 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] text-white/25 uppercase tracking-wider mb-1 block">Course</label>
                    <select value={filterCourse} onChange={e => { setFilterCourse(e.target.value); setPage(1) }} className="w-full h-9 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70 focus:outline-none">
                      <option value="all">All</option>{courses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-white/25 uppercase tracking-wider mb-1 block">Year</label>
                    <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setPage(1) }} className="w-full h-9 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70 focus:outline-none">
                      <option value="all">All</option>{years.map(y => <option key={y} value={y?.toString()}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-white/25 uppercase tracking-wider mb-1 block">Sort By</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full h-9 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70 focus:outline-none">
                      <option value="ats_score">ATS Score</option><option value="cgpa">CGPA</option><option value="name">Name</option><option value="verification_score">Trust Score</option><option value="graduation_year">Year</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-white/30">{filtered.length} candidate{filtered.length !== 1 ? 's' : ''} found</p>
        <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
          {sortDir === 'desc' ? '↓ Highest first' : '↑ Lowest first'}
        </button>
      </div>

      {/* Candidates Grid/List */}
      {paginated.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
          <Users size={40} className="mx-auto mb-4 text-white/10" />
          <p className="text-white/50 font-medium">No candidates match your filters</p>
          <p className="text-sm text-white/30 mt-1">Try adjusting your search criteria.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] hover:border-white/15 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-sm">{(s.name || 'C')[0].toUpperCase()}</div>
                  <div>
                    <p className="font-heading font-bold text-white group-hover:text-emerald-300 transition-colors text-sm">{s.name || 'Candidate'}</p>
                    <p className="text-[11px] text-white/30">{s.course || 'N/A'} • {s.graduation_year || '—'}</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleSave(s.id) }} disabled={savingId === s.id} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  {savedIds.has(s.id) ? <BookmarkCheck size={18} className="text-emerald-400" /> : <Bookmark size={18} className="text-white/20 hover:text-white/50" />}
                </button>
              </div>

              {/* ATS gauge */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90"><circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.04)" strokeWidth="4" fill="none" /><circle cx="24" cy="24" r="20" stroke={`hsl(${(s.ats_score || 0) * 1.2}, 70%, 50%)`} strokeWidth="4" fill="none" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - (s.ats_score || 0) / 100)}`} strokeLinecap="round" /></svg>
                  <span className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white">{s.ats_score || 0}</span>
                </div>
                <div>
                  <p className="text-xs text-white/50">ATS Score</p>
                  <p className="text-xs text-white/25">{s.cgpa ? `CGPA: ${s.cgpa}` : ''}</p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex gap-1.5 mb-4">
                {[
                  { ok: s.police_verified, label: 'PCC', icon: Shield },
                  { ok: s.aadhaar_verified, label: 'KYC', icon: CreditCard },
                  { ok: s.degree_verified, label: 'DEG', icon: GraduationCap },
                ].map((b, j) => (
                  <span key={j} className={`text-[8px] uppercase font-bold px-2 py-1 rounded-lg flex items-center gap-1 border ${b.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/[0.03] text-white/20'}`}>
                    <b.icon size={10} /> {b.label}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => setSelectedStudent(s)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors">View Profile</button>
                {s.email && <a href={`mailto:${s.email}`} className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"><Mail size={14} /></a>}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0e0e14]">
                <tr>
                  {['Candidate', 'Course / Year', 'ATS', 'CGPA', 'Verifications', 'Actions'].map((h, i) => (
                    <th key={i} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginated.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs font-bold">{(s.name || 'C')[0].toUpperCase()}</div>
                      <div><p className="font-medium text-white/80">{s.name || 'Candidate'}</p><p className="text-[10px] text-white/30">{s.email || '—'}</p></div>
                    </td>
                    <td className="px-5 py-3 text-white/60">{s.course || '—'} <span className="text-white/30">•</span> {s.graduation_year || '—'}</td>
                    <td className="px-5 py-3"><span className="font-bold" style={{ color: `hsl(${(s.ats_score || 0) * 1.2}, 70%, 50%)` }}>{s.ats_score || 0}</span></td>
                    <td className="px-5 py-3 text-white/60">{s.cgpa || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        {[{ ok: s.police_verified, l: 'P' }, { ok: s.aadhaar_verified, l: 'A' }, { ok: s.degree_verified, l: 'D' }].map((b, j) => (
                          <span key={j} className={`text-[8px] font-bold w-5 h-5 rounded flex items-center justify-center ${b.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/15 border border-white/5'}`}>{b.l}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 flex gap-2">
                      <button onClick={() => setSelectedStudent(s)} className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors">View</button>
                      <button onClick={() => toggleSave(s.id)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        {savedIds.has(s.id) ? <BookmarkCheck size={14} className="text-emerald-400" /> : <Bookmark size={14} className="text-white/20" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 disabled:opacity-30 hover:bg-white/10 transition-colors"><ChevronLeft size={14} /></button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${page === p ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>{p}</button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 disabled:opacity-30 hover:bg-white/10 transition-colors"><ChevronRight size={14} /></button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedStudent(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0e14] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-xl">{(selectedStudent.name || 'C')[0].toUpperCase()}</div>
                <div>
                  <p className="font-heading font-bold text-lg text-white">{selectedStudent.name || 'Candidate'}</p>
                  <p className="text-xs text-white/40">{selectedStudent.email || 'No email'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-lg hover:bg-white/5 text-white/30"><X size={20} /></button>
            </div>

            {/* ATS + Trust */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">ATS Score</p>
                <p className="font-heading text-3xl font-bold" style={{ color: `hsl(${(selectedStudent.ats_score || 0) * 1.2}, 70%, 50%)` }}>{selectedStudent.ats_score || 0}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Trust Score</p>
                <p className="font-heading text-3xl font-bold text-teal-400">{selectedStudent.verification_score || 0}%</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {[
                { l: 'Course', v: selectedStudent.course },
                { l: 'Branch', v: selectedStudent.branch },
                { l: 'CGPA', v: selectedStudent.cgpa },
                { l: 'Year', v: selectedStudent.graduation_year },
                { l: 'City', v: selectedStudent.city },
                { l: 'State', v: selectedStudent.state },
              ].map((d, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-[9px] text-white/25 uppercase tracking-wider mb-0.5">{d.l}</p>
                  <p className="text-sm text-white/80 font-medium">{d.v || '—'}</p>
                </div>
              ))}
            </div>

            {/* Verifications */}
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Verifications</h4>
            <div className="space-y-2 mb-5">
              {[
                { label: 'Police Check', verified: selectedStudent.police_verified, icon: Shield },
                { label: 'Aadhaar KYC', verified: selectedStudent.aadhaar_verified, icon: CreditCard },
                { label: 'Degree Certificate', verified: selectedStudent.degree_verified, icon: GraduationCap },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <item.icon size={16} className={item.verified ? 'text-emerald-400' : 'text-white/20'} />
                  <span className="text-sm text-white/70 flex-1">{item.label}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${item.verified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/30 border border-white/5'}`}>
                    {item.verified ? 'Verified ✓' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => toggleSave(selectedStudent.id)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all" style={{ background: savedIds.has(selectedStudent.id) ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: savedIds.has(selectedStudent.id) ? '#34d399' : 'rgba(255,255,255,0.6)', border: `1px solid ${savedIds.has(selectedStudent.id) ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)'}` }}>
                {savedIds.has(selectedStudent.id) ? <><BookmarkCheck size={16} /> Saved</> : <><Bookmark size={16} /> Save Candidate</>}
              </button>
              {selectedStudent.email && (
                <a href={`mailto:${selectedStudent.email}`} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                  <Mail size={16} /> Contact
                </a>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, ChevronDown, ChevronUp, Users, Shield, GraduationCap, CreditCard, FileText, TrendingUp, Eye, X, Bookmark, BookmarkCheck, Mail, ExternalLink, CheckCircle2, LayoutGrid, List, ChevronLeft, ChevronRight, Briefcase, Building, Download, BookOpen, Paperclip } from 'lucide-react'


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

  // AI & Compare Features
  const [aiJobDesc, setAiJobDesc] = useState('')
  const [loadingAi, setLoadingAi] = useState(false)
  const [aiMatches, setAiMatches] = useState<any[]>([])
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set())
  const [showCompareModal, setShowCompareModal] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)

      // Fetch students with profile_is_public = true
      // Use student's own name/email as primary (populated on registration)
      // Fall back to profiles join for older records
      const { data, error } = await supabase
        .from('students')
        .select('*, profiles(email, full_name), verifications(*)')
        .eq('profile_is_public', true)
        .order('ats_score', { ascending: false })

      if (error) console.error('[Company] students query error:', error.message)

      const mappedStudents = (data || []).map((s: any) => {
        const resumeVerif = s.verifications?.find((v: any) => v.type === 'resume')
        const degreeVerif = s.verifications?.find((v: any) => v.type === 'degree')
        const aiResult = resumeVerif?.ai_result || {}
        const degreeResult = degreeVerif?.ai_result || {}

        return {
          ...s,
          name: s.name || s.profiles?.full_name || 'Unknown',
          email: s.email || s.profiles?.email || '',
          trust_score: s.trust_score || 0,
          ats_score: aiResult.ats_score || s.ats_score || 0,
          course: degreeResult.course || aiResult.course || s.course || '',
          branch: degreeResult.branch || aiResult.branch || s.branch || '',
          cgpa: degreeResult.grade_cgpa || aiResult.cgpa || s.cgpa || '',
          graduation_year: degreeResult.year_of_passing || aiResult.graduation_year || s.graduation_year || '',
          city: aiResult.city || s.city || '',
          state: aiResult.state || s.state || '',
          degree_verified: s.verifications?.some((v: any) => v.type === 'degree' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
          police_verified: s.verifications?.some((v: any) => v.type === 'police' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
          aadhaar_verified: s.verifications?.some((v: any) => v.type === 'aadhaar' && ['verified', 'ai_approved', 'admin_verified'].includes(v.status)),
          verified_docs_count: (s.verifications || []).filter((v: any) => ['verified', 'ai_approved', 'admin_verified'].includes(v.status)).length,
        }
      })

      setStudents(mappedStudents)
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

    if (aiMatches.length > 0) {
      result.sort((a: any, b: any) => {
        const matchA = aiMatches.find(m => m.id === a.id)
        const matchB = aiMatches.find(m => m.id === b.id)
        if (matchA && !matchB) return -1
        if (!matchA && matchB) return 1
        if (matchA && matchB) return matchB.match_score - matchA.match_score
        return 0
      })
    } else {
      result.sort((a: any, b: any) => {
        let aVal = a[sortBy], bVal = b[sortBy]
        if (sortBy === 'name') { aVal = aVal?.toLowerCase() || ''; bVal = bVal?.toLowerCase() || '' }
        if (['ats_score', 'cgpa', 'trust_score', 'graduation_year'].includes(sortBy)) { aVal = parseFloat(aVal) || 0; bVal = parseFloat(bVal) || 0 }
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [students, searchQuery, atsMin, atsMax, filterPolice, filterAadhaar, filterDegree, cgpaMin, filterCourse, filterYear, sortBy, sortDir, aiMatches])

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

  const handleAiMatch = async () => {
    if (!aiJobDesc.trim()) return
    setLoadingAi(true)
    setAiMatches([])
    try {
      const res = await fetch('/api/company/ai-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: aiJobDesc, students: filtered })
      })
      const data = await res.json()
      if (data.matches) setAiMatches(data.matches)
    } catch (e) { console.error(e) }
    setLoadingAi(false)
  }

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 3) next.add(id)
      return next
    })
  }

  const handleExportProfile = (student: any) => {
    const dataStr = JSON.stringify({
      id: student.id,
      name: student.name,
      email: student.email,
      course: student.course,
      branch: student.branch,
      graduation_year: student.graduation_year,
      cgpa: student.cgpa,
      ats_score: student.ats_score,
      trust_score: student.trust_score || 0,
      verifications: {
        degree: student.degree_verified,
        police: student.police_verified,
        aadhaar: student.aadhaar_verified
      },
      skills: student.skills || [],
      city: student.city,
      state: student.state
    }, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(url)); link.setAttribute("download", `${student.name ? student.name.replace(/\s+/g, '_') : 'candidate'}_profile.json`); document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const policeVerCount = students.filter(s => s.police_verified).length
  const avgAts = students.length ? Math.round(students.reduce((a, s) => a + (s.ats_score || 0), 0) / students.length) : 0
  const avgTrust = students.length ? Math.round(students.reduce((a, s) => a + (s.trust_score || 0), 0) / students.length) : 0

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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Available Talent', value: students.length, icon: Users, accent: '#10b981', gradient: 'from-emerald-500/15 to-emerald-400/5' },
          { label: 'Police Verified', value: policeVerCount, icon: Shield, accent: '#8b5cf6', gradient: 'from-violet-500/15 to-violet-400/5' },
          { label: 'Avg ATS Score', value: avgAts, icon: TrendingUp, accent: '#3b82f6', gradient: 'from-blue-500/15 to-blue-400/5' },
          { label: 'Avg Trust Score', value: `${avgTrust}%`, icon: CheckCircle2, accent: '#14b8a6', gradient: 'from-teal-500/15 to-teal-400/5' },
          { label: 'Saved', value: savedIds.size, icon: BookmarkCheck, accent: '#f59e0b', gradient: 'from-amber-500/15 to-amber-400/5' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className={`rounded-2xl p-5 border border-white/5 bg-gradient-to-br ${stat.gradient}`}>
            <stat.icon size={18} style={{ color: stat.accent }} className="mb-3" />
            <p className="font-heading text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-[10px] font-semibold tracking-wider uppercase text-white/30 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* AI Matchmaker */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent overflow-hidden shadow-lg shadow-emerald-500/5 p-1 relative">
        <div className="bg-[#0e0e14] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] pointer-events-none rounded-full" />
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 text-xl shadow-inner">
            ✨
          </div>
          <div className="flex-1 w-full">
            <h3 className="font-heading font-bold text-white text-sm mb-2 flex items-center gap-2">
              AI Job Matcher <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 font-bold">Beta</span>
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input 
                value={aiJobDesc}
                onChange={e => setAiJobDesc(e.target.value)}
                placeholder="Describe ideal hire (e.g. 'Frontend Dev with high ATS and React skills')..." 
                className="flex-1 h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                onKeyDown={e => e.key === 'Enter' && handleAiMatch()}
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleAiMatch} 
                  disabled={loadingAi || !aiJobDesc}
                  className="flex-1 sm:flex-none px-6 h-11 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50 whitespace-nowrap shadow-lg shadow-emerald-500/20"
                >
                  {loadingAi ? 'Matching...' : 'Find Matches'}
                </button>
                {aiMatches.length > 0 && (
                  <button onClick={() => {setAiMatches([]); setAiJobDesc('')}} className="px-4 h-11 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-colors">Clear</button>
                )}
              </div>
            </div>
          </div>
        </div>
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
                      <option value="ats_score">ATS Score</option><option value="cgpa">CGPA</option><option value="name">Name</option><option value="trust_score">Trust Score</option><option value="graduation_year">Year</option>
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
          {paginated.map((s, i) => {
            const aiMatch = aiMatches.find(m => m.id === s.id)
            return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`group rounded-2xl border bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${aiMatch ? 'border-emerald-500/40 shadow-emerald-500/10' : 'border-white/10 hover:border-white/15'}`}
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

              {aiMatch && (
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-1">✨ AI Match ({aiMatch.match_score}%)</p>
                  <p className="text-xs text-white/70 leading-relaxed font-medium">{aiMatch.reason}</p>
                </div>
              )}

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

              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group/cb">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${compareIds.has(s.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-white/5 border-white/20 group-hover/cb:border-emerald-500/50'}`}>
                    {compareIds.has(s.id) && <CheckCircle2 size={12} className="text-black" />}
                  </div>
                  <span className={`text-[11px] font-semibold transition-colors ${compareIds.has(s.id) ? 'text-emerald-400' : 'text-white/40 group-hover/cb:text-white/60'}`}>Compare</span>
                </label>
              </div>
            </motion.div>
          )})}
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
                {paginated.map((s) => {
                  const aiMatch = aiMatches.find(m => m.id === s.id)
                  return (
                  <tr key={s.id} className={`transition-colors group ${aiMatch ? 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.05]' : 'hover:bg-white/[0.02]'}`}>
                    <td className="px-5 py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-300 text-xs font-bold">{(s.name || 'C')[0].toUpperCase()}</div>
                      <div><p className="font-medium text-white/80">{s.name || 'Candidate'}</p><p className="text-[10px] text-white/30">{s.email || '—'}</p></div>
                    </td>
                    <td className="px-5 py-3 text-white/60">{s.course || '—'} <span className="text-white/30">•</span> {s.graduation_year || '—'}</td>
                    <td className="px-5 py-3"><span className="font-bold" style={{ color: `hsl(${(s.ats_score || 0) * 1.2}, 70%, 50%)` }}>{s.ats_score || 0}</span></td>
                    <td className="px-5 py-3 text-white/60">{s.cgpa || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[{ ok: s.police_verified, l: 'P' }, { ok: s.aadhaar_verified, l: 'A' }, { ok: s.degree_verified, l: 'D' }].map((b, j) => (
                            <span key={j} className={`text-[8px] font-bold w-5 h-5 rounded flex items-center justify-center ${b.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/15 border border-white/5'}`}>{b.l}</span>
                          ))}
                        </div>
                        <span className="text-[10px] text-white/30">{s.verified_docs_count || 0}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 flex items-center gap-2">
                      <button onClick={() => setSelectedStudent(s)} className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-colors">View</button>
                      <button onClick={() => toggleSave(s.id)} className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-white/30">
                        {savedIds.has(s.id) ? <BookmarkCheck size={16} className="text-emerald-400" /> : <Bookmark size={16} />}
                      </button>
                      <label className="cursor-pointer p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <input type="checkbox" checked={compareIds.has(s.id)} onChange={() => toggleCompare(s.id)} className="accent-emerald-500 rounded" />
                      </label>
                    </td>
                  </tr>
                )})}
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
                <p className="font-heading text-3xl font-bold text-teal-400">{selectedStudent.trust_score || 0}%</p>
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
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Verifications <span className="text-emerald-400/60 ml-2">{selectedStudent.verified_docs_count || 0} docs verified</span></h4>
            <div className="space-y-2 mb-5">
              {[
                { key: 'resume', label: 'Resume / ATS', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { key: 'degree', label: 'Degree Certificate', icon: GraduationCap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { key: 'marksheet_10th', label: '10th Marksheet', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { key: 'marksheet_12th', label: '12th Marksheet', icon: BookOpen, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { key: 'passport', label: 'Other Credential', icon: Paperclip, color: 'text-teal-400', bg: 'bg-teal-500/10' },
                { key: 'police', label: 'Police Verification', icon: Shield, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { key: 'aadhaar', label: 'Aadhaar KYC', icon: CreditCard, color: 'text-teal-400', bg: 'bg-teal-500/10' },
              ].map((item, i) => {
                const record = (selectedStudent.verifications || []).find((r: any) => r.type === item.key)
                const isVerified = record && ['verified', 'ai_approved', 'admin_verified'].includes(record.status)
                const isPending = record && ['pending', 'needs_review'].includes(record.status)
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className={`p-1.5 rounded-lg ${item.bg}`}><item.icon size={14} className={item.color} /></div>
                    <span className="text-sm text-white/70 flex-1">{item.label}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                      isVerified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      isPending ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-white/5 text-white/30 border border-white/5'
                    }`}>
                      {isVerified ? 'Verified ✓' : isPending ? 'Pending' : 'Not Uploaded'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => toggleSave(selectedStudent.id)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg" style={{ background: savedIds.has(selectedStudent.id) ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)', color: savedIds.has(selectedStudent.id) ? '#34d399' : 'rgba(255,255,255,0.6)', border: `1px solid ${savedIds.has(selectedStudent.id) ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)'}` }}>
                {savedIds.has(selectedStudent.id) ? <><BookmarkCheck size={16} /> Saved</> : <><Bookmark size={16} /> Save Candidate</>}
              </button>
              {selectedStudent.email && (
                <a href={`mailto:${selectedStudent.email}`} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors shadow-lg">
                  <Mail size={16} /> Contact
                </a>
              )}
              <button onClick={() => handleExportProfile(selectedStudent)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 transition-colors shadow-lg">
                <Download size={16} /> Export JSON
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Compare Floating Action Button */}
      <AnimatePresence>
        {compareIds.size > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
            <div className="flex items-center gap-4 bg-emerald-950/90 border border-emerald-500/30 backdrop-blur-md pl-6 pr-2 py-2 rounded-full shadow-2xl shadow-emerald-500/20">
              <p className="text-sm font-bold text-white whitespace-nowrap"><span className="text-emerald-400">{compareIds.size}</span> / 3 Selected</p>
              <button 
                onClick={() => setShowCompareModal(true)} 
                disabled={compareIds.size < 2} 
                className="px-5 py-2.5 bg-emerald-500 text-black font-bold text-sm rounded-full disabled:opacity-50 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                Compare Candidates
              </button>
              <button onClick={() => setCompareIds(new Set())} className="p-2.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"><X size={16} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowCompareModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-500/30 bg-[#0e0e14] shadow-2xl shadow-emerald-500/10" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 z-10 p-6 border-b border-white/10 bg-[#0e0e14]/90 backdrop-blur-md flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-2xl text-white">Compare Candidates</h2>
                  <p className="text-xs text-white/50 mt-1">Side-by-side analysis of key metrics</p>
                </div>
                <button onClick={() => setShowCompareModal(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"><X size={24} /></button>
              </div>

              <div className="p-6">
                <div className="grid gap-6 grid-flow-col auto-cols-fr">
                  {students.filter(s => compareIds.has(s.id)).map(student => (
                    <div key={student.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4">
                        <button onClick={() => toggleCompare(student.id)} className="text-white/20 hover:text-red-400 transition-colors"><X size={16} /></button>
                      </div>
                      
                      {/* Compare Identity */}
                      <div className="flex flex-col items-center text-center mb-6">
                         <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold text-3xl mb-4 shadow-lg shadow-emerald-500/20">{(student.name || 'C')[0].toUpperCase()}</div>
                         <h3 className="font-heading font-bold text-lg text-white mb-1">{student.name || 'Candidate'}</h3>
                         <p className="text-xs font-semibold text-emerald-400">{student.course || '—'} <span className="text-white/30">•</span> {student.graduation_year || '—'}</p>
                      </div>

                      {/* Compare Metrics Blocks */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center flex items-center justify-between">
                          <span className="text-xs text-white/40 font-bold uppercase tracking-wider">ATS Score</span>
                          <span className="text-xl font-heading font-bold" style={{ color: `hsl(${(student.ats_score || 0) * 1.2}, 70%, 50%)` }}>{student.ats_score || 0}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center flex items-center justify-between">
                          <span className="text-xs text-white/40 font-bold uppercase tracking-wider">CGPA</span>
                          <span className="text-xl font-heading font-bold text-teal-400">{student.cgpa || '0.0'}</span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Verifications <span className="text-emerald-400/50 ml-1">{student.verified_docs_count || 0} verified</span></h4>
                        <div className="space-y-2">
                          {[
                            { key: 'resume', label: 'Resume', icon: FileText },
                            { key: 'degree', label: 'Degree', icon: GraduationCap },
                            { key: 'marksheet_10th', label: '10th', icon: BookOpen },
                            { key: 'marksheet_12th', label: '12th', icon: BookOpen },
                            { key: 'police', label: 'Police', icon: Shield },
                            { key: 'aadhaar', label: 'Aadhaar', icon: CreditCard },
                          ].map((v, i) => {
                            const record = (student.verifications || []).find((r: any) => r.type === v.key)
                            const ok = record && ['verified', 'ai_approved', 'admin_verified'].includes(record.status)
                            return (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-xs text-white/60 flex items-center gap-2"><v.icon size={12} className={ok ? 'text-emerald-400' : 'text-white/20'} /> {v.label}</span>
                                {ok ? <span className="text-emerald-400"><CheckCircle2 size={16} /></span> : <span className="text-white/20"><X size={16} /></span>}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5 flex gap-2">
                        <button onClick={() => { setShowCompareModal(false); setSelectedStudent(student) }} className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-white/5 hover:bg-white/10 transition-colors">View Full</button>
                        <button onClick={() => toggleSave(student.id)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-colors border" style={{ background: savedIds.has(student.id) ? 'transparent' : 'rgba(16,185,129,0.1)', color: savedIds.has(student.id) ? '#34d399' : '#10b981', borderColor: savedIds.has(student.id) ? 'transparent' : 'rgba(16,185,129,0.2)' }}>
                           {savedIds.has(student.id) ? 'Saved' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

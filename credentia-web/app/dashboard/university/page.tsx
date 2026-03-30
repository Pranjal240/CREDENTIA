'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Users, CheckCircle2, Shield, Info, Home, Building, Download, Search, Filter, ChevronDown, ChevronUp, SortAsc, SortDesc, Eye, X, CreditCard, FileText, TrendingUp, ArrowUpDown, ChevronLeft, ChevronRight, ExternalLink, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function UniversityDashboard() {
  const [students, setStudents] = useState<any[]>([])
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDegree, setFilterDegree] = useState<string>('all')
  const [filterPolice, setFilterPolice] = useState<string>('all')
  const [filterCourse, setFilterCourse] = useState<string>('all')
  const [filterYear, setFilterYear] = useState<string>('all')
  const [cgpaMin, setCgpaMin] = useState('')
  const [cgpaMax, setCgpaMax] = useState('')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('students').select('*, profiles(email), verifications(*)').eq('university_id', session.user.id).order('created_at', { ascending: false })
      
      const mappedStudents = (data || []).map((s: any) => ({
        ...s,
        email: s.profiles?.email || '',
      }))
      
      setStudents(mappedStudents)
      setLoading(false)
    }
    load()
  }, [])

  // Derived data
  const courses = useMemo(() => Array.from(new Set(students.map(s => s.course).filter(Boolean))), [students])
  const years = useMemo(() => Array.from(new Set(students.map(s => s.graduation_year).filter(Boolean))).sort(), [students])

  const filtered = useMemo(() => {
    let result = students.filter(s => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!(s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.roll_number?.toLowerCase().includes(q))) return false
      }
      if (filterDegree === 'verified' && !s.degree_verified) return false
      if (filterDegree === 'pending' && s.degree_verified) return false
      if (filterPolice === 'verified' && !s.police_verified) return false
      if (filterPolice === 'pending' && s.police_verified) return false
      if (filterCourse !== 'all' && s.course !== filterCourse) return false
      if (filterYear !== 'all' && s.graduation_year?.toString() !== filterYear) return false
      if (cgpaMin && (parseFloat(s.cgpa) || 0) < parseFloat(cgpaMin)) return false
      if (cgpaMax && (parseFloat(s.cgpa) || 0) > parseFloat(cgpaMax)) return false
      return true
    })

    result.sort((a, b) => {
      let aVal = a[sortBy], bVal = b[sortBy]
      if (sortBy === 'name') { aVal = aVal?.toLowerCase() || ''; bVal = bVal?.toLowerCase() || '' }
      if (sortBy === 'cgpa' || sortBy === 'ats_score' || sortBy === 'graduation_year') { aVal = parseFloat(aVal) || 0; bVal = parseFloat(bVal) || 0 }
      if (sortBy === 'created_at') { aVal = new Date(aVal).getTime(); bVal = new Date(bVal).getTime() }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [students, searchQuery, filterDegree, filterPolice, filterCourse, filterYear, cgpaMin, cgpaMax, sortBy, sortDir])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const degreeVerifiedCount = students.filter(s => s.degree_verified).length
  const policeVerifiedCount = students.filter(s => s.police_verified).length
  const avgCgpa = students.length ? (students.reduce((a, s) => a + (parseFloat(s.cgpa) || 0), 0) / students.length).toFixed(1) : '0.0'
  const integrityScore = students.length ? Math.round((students.filter(s => s.academic_verified).length / students.length) * 100) : 0

  const handleExportCSV = () => {
    if (filtered.length === 0) return
    const headers = ['Name', 'Email', 'Roll No.', 'Course', 'Branch', 'Year', 'CGPA', 'Degree Verified', 'Police Verified', 'ATS Score', 'Joined']
    const rows = filtered.map(s => [
      `"${s.name || ''}"`, `"${s.email || ''}"`, `"${s.roll_number || ''}"`, `"${s.course || ''}"`, `"${s.branch || ''}"`,
      s.graduation_year || '', s.cgpa || '', s.degree_verified ? 'Yes' : 'No', s.police_verified ? 'Yes' : 'No',
      s.ats_score || '', new Date(s.created_at).toLocaleDateString()
    ])
    const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csv)); link.setAttribute("download", `university_registry_${new Date().toISOString().split('T')[0]}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('desc') }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /><span className="text-xs text-white/30 tracking-wider font-semibold">LOADING REGISTRY...</span></div></div>

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/5 border border-indigo-500/20 flex items-center justify-center text-indigo-400"><Building size={28} /></div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-white mb-1">University Registry</h1>
            <p className="text-sm text-white/40">Manage your institution&apos;s alumni and verify academic credentials.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold rounded-lg hover:bg-indigo-500/20 transition-colors"><Download size={16} /> Export CSV</button>
          <Link href="/" className="flex items-center gap-2 px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"><Home size={16} /> Landing</Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Students', value: students.length, icon: Users, accent: '#8b5cf6', gradient: 'from-purple-500/20 to-purple-400/5' },
          { label: 'Degree Verified', value: degreeVerifiedCount, icon: GraduationCap, accent: '#10b981', gradient: 'from-emerald-500/20 to-emerald-400/5' },
          { label: 'Police Verified', value: policeVerifiedCount, icon: Shield, accent: '#3b82f6', gradient: 'from-blue-500/20 to-blue-400/5' },
          { label: 'Avg CGPA', value: avgCgpa, icon: TrendingUp, accent: '#f59e0b', gradient: 'from-amber-500/20 to-amber-400/5' },
          { label: 'Integrity Score', value: `${integrityScore}%`, icon: CheckCircle2, accent: '#14b8a6', gradient: 'from-teal-500/20 to-teal-400/5' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className={`rounded-2xl p-5 border border-white/5 bg-gradient-to-br ${stat.gradient}`}>
            <stat.icon size={20} style={{ color: stat.accent }} className="mb-3" />
            <p className="font-heading text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-[10px] font-semibold tracking-wide uppercase text-white/40 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="p-4 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1) }} placeholder="Search by name, email, or roll number..." className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-colors">
            <Filter size={16} /> Filters {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="pt-3">
                  <label className="text-[9px] text-white/25 uppercase tracking-wider mb-1 block">Degree Status</label>
                  <select value={filterDegree} onChange={e => { setFilterDegree(e.target.value); setPage(1) }} className="w-full h-9 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70 focus:outline-none">
                    <option value="all">All</option><option value="verified">Verified</option><option value="pending">Pending</option>
                  </select>
                </div>
                <div className="pt-3">
                  <label className="text-[9px] text-white/25 uppercase tracking-wider mb-1 block">Police Status</label>
                  <select value={filterPolice} onChange={e => { setFilterPolice(e.target.value); setPage(1) }} className="w-full h-9 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70 focus:outline-none">
                    <option value="all">All</option><option value="verified">Verified</option><option value="pending">Pending</option>
                  </select>
                </div>
                <div className="pt-3">
                  <label className="text-[9px] text-white/25 uppercase tracking-wider mb-1 block">Course</label>
                  <select value={filterCourse} onChange={e => { setFilterCourse(e.target.value); setPage(1) }} className="w-full h-9 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70 focus:outline-none">
                    <option value="all">All Courses</option>{courses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="pt-3">
                  <label className="text-[9px] text-white/25 uppercase tracking-wider mb-1 block">Year</label>
                  <select value={filterYear} onChange={e => { setFilterYear(e.target.value); setPage(1) }} className="w-full h-9 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70 focus:outline-none">
                    <option value="all">All Years</option>{years.map(y => <option key={y} value={y?.toString()}>{y}</option>)}
                  </select>
                </div>
                <div className="pt-3">
                  <label className="text-[9px] text-white/25 uppercase tracking-wider mb-1 block">Min CGPA</label>
                  <input type="number" step="0.1" min="0" max="10" value={cgpaMin} onChange={e => { setCgpaMin(e.target.value); setPage(1) }} placeholder="0.0" className="w-full h-9 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70 focus:outline-none" />
                </div>
                <div className="pt-3">
                  <label className="text-[9px] text-white/25 uppercase tracking-wider mb-1 block">Max CGPA</label>
                  <input type="number" step="0.1" min="0" max="10" value={cgpaMax} onChange={e => { setCgpaMax(e.target.value); setPage(1) }} placeholder="10.0" className="w-full h-9 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/70 focus:outline-none" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <h2 className="font-heading font-medium text-base text-white">Student Directory <span className="text-white/30 text-sm ml-2">({filtered.length} found)</span></h2>
          <div className="flex items-center gap-2">
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }} className="h-8 px-2 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 focus:outline-none">
              <option value={10}>10 / page</option><option value={25}>25 / page</option><option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {paginated.length === 0 ? (
          <div className="p-16 text-center">
            <Users size={32} className="mx-auto text-indigo-400/30 mb-3" />
            <p className="font-heading font-bold text-lg text-white mb-1">{students.length === 0 ? 'No Students Linked Yet' : 'No Results'}</p>
            <p className="text-sm text-white/40 max-w-md mx-auto">{students.length === 0 ? 'Students can link their profiles to your university from their Dashboard → Settings → "Link to University". Once linked, they will appear here for verification.' : 'Try adjusting your filters.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0e0e14]">
                <tr>
                  {[
                    { label: 'Student', field: 'name' },
                    { label: 'Course / Year', field: 'course' },
                    { label: 'CGPA', field: 'cgpa' },
                    { label: 'ATS', field: 'ats_score' },
                    { label: 'Verifications', field: null },
                    { label: 'Joined', field: 'created_at' },
                    { label: 'Actions', field: null },
                  ].map((col, idx) => (
                    <th key={idx} onClick={() => col.field && toggleSort(col.field)} className={`text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5 ${col.field ? 'cursor-pointer hover:text-white/60 select-none' : ''}`}>
                      <span className="flex items-center gap-1">{col.label} {col.field && sortBy === col.field && (sortDir === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginated.map((s, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">{(s.name || 'U')[0].toUpperCase()}</div>
                        <div><p className="font-medium text-white/90 group-hover:text-indigo-300 transition-colors">{s.name || 'Unnamed'}</p><p className="text-[11px] text-white/30">{s.email || '—'}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="font-medium text-white/80">{s.course || '—'}</span><br /><span className="text-[11px] text-white/40">{s.branch || ''} • {s.graduation_year || '—'}</span></td>
                    <td className="px-5 py-3"><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/80 text-xs font-bold font-mono">{s.cgpa || 'N/A'}</span></td>
                    <td className="px-5 py-3"><span className="text-xs font-bold" style={{ color: `hsl(${(s.ats_score || 0) * 1.2}, 70%, 50%)` }}>{s.ats_score || '—'}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        {[
                          { ok: s.degree_verified, label: 'DEG', color: '#f59e0b' },
                          { ok: s.police_verified, label: 'PCC', color: '#8b5cf6' },
                          { ok: s.aadhaar_verified, label: 'KYC', color: '#14b8a6' },
                        ].map((b, j) => (
                          <span key={j} className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded border ${b.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/5 text-white/20'}`}>{b.label}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-white/40">{new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => setSelectedStudent(s)} className="text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-white/30">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 disabled:opacity-30 hover:bg-white/10 transition-colors"><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${page === p ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>{p}</button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 disabled:opacity-30 hover:bg-white/10 transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedStudent(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0e14] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-500/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-lg">{(selectedStudent.name || 'U')[0].toUpperCase()}</div>
                <div><p className="font-heading font-bold text-white">{selectedStudent.name || 'Unnamed'}</p><p className="text-xs text-white/40">{selectedStudent.email || '—'}</p></div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-lg hover:bg-white/5 text-white/30"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { l: 'Course', v: selectedStudent.course }, { l: 'Branch', v: selectedStudent.branch },
                { l: 'Year', v: selectedStudent.graduation_year }, { l: 'CGPA', v: selectedStudent.cgpa },
                { l: 'Roll No.', v: selectedStudent.roll_number }, { l: 'ATS Score', v: selectedStudent.ats_score },
                { l: 'City', v: selectedStudent.city }, { l: 'State', v: selectedStudent.state },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-[9px] text-white/25 uppercase tracking-wider mb-0.5">{item.l}</p>
                  <p className="text-sm text-white/80 font-medium">{item.v || '—'}</p>
                </div>
              ))}
            </div>
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Verification Status</h4>
            <div className="space-y-2">
              {[
                { label: 'Degree', verified: selectedStudent.degree_verified, icon: GraduationCap },
                { label: 'Police', verified: selectedStudent.police_verified, icon: Shield },
                { label: 'Aadhaar', verified: selectedStudent.aadhaar_verified, icon: CreditCard },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <item.icon size={16} className={item.verified ? 'text-emerald-400' : 'text-white/20'} />
                  <span className="text-sm text-white/70 flex-1">{item.label}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${item.verified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-white/30 border border-white/5'}`}>
                    {item.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

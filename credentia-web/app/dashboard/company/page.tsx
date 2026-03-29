'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Users, Shield, FileText, Search, ExternalLink, Star } from 'lucide-react'
import { getScoreColor } from '@/lib/utils'

export default function CompanyDashboard() {
  const [students, setStudents] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [policeFilter, setPoliceFilter] = useState('all')
  const [atsMin, setAtsMin] = useState(0)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('students').select('*, profiles!inner(full_name, email, avatar_url)').eq('profile_is_public', true).limit(100)
      setStudents(data || [])
      setFiltered(data || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    let result = students
    if (search) result = result.filter((s: any) => (s.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()))
    if (policeFilter === 'yes') result = result.filter((s: any) => s.police_verified)
    if (policeFilter === 'no') result = result.filter((s: any) => !s.police_verified)
    if (atsMin > 0) result = result.filter((s: any) => (s.ats_score || 0) >= atsMin)
    setFiltered(result)
  }, [search, policeFilter, atsMin, students])

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-2 border-[#F5C542] border-t-transparent rounded-full animate-spin" /></div>

  const policeCount = students.filter((s: any) => s.police_verified).length
  const highAts = students.filter((s: any) => (s.ats_score || 0) >= 75).length

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-syne text-2xl font-extrabold text-white mb-6">Company Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Candidates', value: students.length, icon: Users },
          { label: 'Police Verified', value: policeCount, icon: Shield },
          { label: 'High ATS (>75)', value: highAts, icon: FileText },
          { label: 'Recently Added', value: students.filter((s: any) => { const d = new Date(s.created_at); return Date.now() - d.getTime() < 7 * 86400000 }).length, icon: Star },
        ].map((s, i) => (
          <div key={i} className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5">
            <s.icon size={18} className="text-[#9999AA] mb-2" />
            <p className="font-syne text-2xl font-extrabold text-white">{s.value}</p>
            <p className="text-[#9999AA] text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9999AA]" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#13131A] border border-[#2A2A3A] text-white text-sm focus:border-[#F5C542] outline-none" placeholder="Search by name..." />
        </div>
        <div className="flex gap-2">
          {(['all', 'yes', 'no'] as const).map(v => (
            <button key={v} onClick={() => setPoliceFilter(v)} className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${policeFilter === v ? 'bg-[#F5C542] text-black' : 'bg-[#13131A] border border-[#2A2A3A] text-[#9999AA]'}`}>
              Police: {v === 'all' ? 'All' : v === 'yes' ? '✅' : '❌'}
            </button>
          ))}
        </div>
        <select value={atsMin} onChange={e => setAtsMin(Number(e.target.value))} className="h-10 px-3 rounded-xl bg-[#13131A] border border-[#2A2A3A] text-white text-sm outline-none">
          <option value={0}>ATS: Any</option>
          <option value={50}>ATS ≥ 50</option>
          <option value={75}>ATS ≥ 75</option>
          <option value={90}>ATS ≥ 90</option>
        </select>
      </div>

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s: any, i: number) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5 hover:border-[#F5C542]/30 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5C542] to-[#D4A017] flex items-center justify-center text-black font-bold text-sm">
                  {(s.profiles?.full_name || 'U')[0]}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{s.profiles?.full_name || 'Student'}</p>
                  <p className="text-[#9999AA] text-xs">{s.profiles?.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`text-xs px-2.5 py-1 rounded-full ${s.police_verified ? 'bg-green-500/10 text-green-400' : 'bg-[#1C1C26] text-[#9999AA]'}`}>Police {s.police_verified ? '✅' : '⬜'}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full ${s.aadhaar_verified ? 'bg-green-500/10 text-green-400' : 'bg-[#1C1C26] text-[#9999AA]'}`}>Aadhaar {s.aadhaar_verified ? '✅' : '⬜'}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full ${s.degree_verified ? 'bg-green-500/10 text-green-400' : 'bg-[#1C1C26] text-[#9999AA]'}`}>Degree {s.degree_verified ? '✅' : '⬜'}</span>
                {s.ats_score > 0 && <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ color: getScoreColor(s.ats_score), background: `${getScoreColor(s.ats_score)}15` }}>ATS: {s.ats_score}</span>}
              </div>
              {s.share_token && (
                <a href={`/verify/${s.share_token}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#F5C542] text-xs hover:underline">
                  <ExternalLink size={12} /> View Full Profile
                </a>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-12 text-center">
          <Search size={40} className="text-[#2A2A3A] mx-auto mb-4" />
          <p className="text-white font-medium">No candidates match your filters</p>
          <p className="text-[#9999AA] text-sm mt-1">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  )
}

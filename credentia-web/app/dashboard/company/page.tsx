'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Users, Search, Shield, CheckCircle2, ExternalLink, Filter, TrendingUp, Link as LinkIcon, Home, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default function CompanyDashboard() {
  const [students, setStudents] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [minAts, setMinAts] = useState(0)
  const [policeOnly, setPoliceOnly] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('students')
        .select('*, profiles!inner(full_name, email)')
        .eq('profile_is_public', true)
        .order('ats_score', { ascending: false })
        .limit(50)
      setStudents(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = students.filter(s => {
    const name = s.profiles?.full_name?.toLowerCase() || ''
    if (search && !name.includes(search.toLowerCase())) return false
    if (s.ats_score < minAts) return false
    if (policeOnly && !s.police_verified) return false
    return true
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        <span className="text-xs text-white/30 tracking-wider">LOADING CANDIDATES...</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white mb-1">Company Dashboard</h1>
          <p className="text-sm mt-1 text-white/40">Discover and verify high-trust candidates quickly.</p>
        </div>
        <Link href="/" className="hidden sm:flex items-center gap-2 btn-secondary px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-white">
          <Home size={16} /> Returns to Landing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Available Talent', value: students.length, icon: Users, accent: '#10b981', gradient: 'from-emerald-500/20 to-emerald-400/5' },
          { label: 'Police Verified Profiles', value: students.filter(s => s.police_verified).length, icon: Shield, accent: '#3b82f6', gradient: 'from-blue-500/20 to-blue-400/5' },
          { label: 'Platform Avg ATS', value: students.length ? Math.round(students.reduce((a, s) => a + (s.ats_score || 0), 0) / students.length) : 0, icon: TrendingUp, accent: '#8b5cf6', gradient: 'from-purple-500/20 to-purple-400/5' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`rounded-2xl p-5 border border-white/5 bg-gradient-to-br ${stat.gradient}`}>
            <div className="flex items-center gap-3 mb-2">
              <stat.icon size={20} style={{ color: stat.accent }} />
            </div>
            <p className="font-heading text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-[11px] font-medium tracking-wide uppercase text-white/40 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="rounded-2xl p-5 border border-white/10 bg-white/[0.02] flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidate names..." className="w-full h-12 pl-12 pr-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-teal-500/50 transition-colors placeholder-white/20" />
        </div>
        <div className="flex items-center gap-4 bg-white/5 px-5 py-2 rounded-xl border border-white/10">
          <Filter size={16} className="text-white/40" />
          <label className="text-xs flex items-center gap-2 text-white/60">
            Min ATS:
            <input type="number" min={0} max={100} value={minAts} onChange={e => setMinAts(Number(e.target.value))} className="w-16 h-8 px-2 rounded-lg text-sm bg-black/40 border border-white/10 text-white text-center focus:outline-none focus:border-teal-500/50" />
          </label>
          <div className="w-px h-6 bg-white/10 mx-2" />
          <label className="flex items-center gap-2 text-xs cursor-pointer text-white/60 hover:text-white transition-colors">
            <input type="checkbox" checked={policeOnly} onChange={e => setPoliceOnly(e.target.checked)} className="w-4 h-4 rounded bg-black/40 border-white/10 text-teal-500 focus:ring-teal-500 focus:ring-offset-0" />
            Strict Police Verified
          </label>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      <div className="space-y-4">
        <h2 className="font-heading font-medium text-white/80 px-1">Candidate Directory <span className="text-white/30 text-sm ml-2">({filtered.length} found)</span></h2>
        
        {filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
            <Search size={40} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/60">No candidates match these specific filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="group rounded-2xl p-5 border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                   <div className="flex flex-col items-end gap-1">
                     <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">ATS Match</span>
                     <span className="font-heading text-2xl font-bold" style={{ color: `hsl(${s.ats_score * 1.2}, 70%, 50%)` }}>{s.ats_score || 0}<span className="text-sm opacity-50">/100</span></span>
                   </div>
                </div>

                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner border border-white/10" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2))' }}>
                    {(s.profiles?.full_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-lg text-white group-hover:text-teal-400 transition-colors">{s.profiles?.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-white/40">{s.course || 'B.Tech'} {s.branch || 'Computer Science'} • Class of {s.graduation_year || '2025'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="flex gap-2">
                    {[{ ok: s.police_verified, label: 'Police', icon: Shield }, { ok: s.aadhaar_verified, label: 'ID', icon: CheckCircle2 }, { ok: s.degree_verified, label: 'Degree', icon: GraduationCap }].map((b, j) => (
                      <div key={j} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider border ${b.ok ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-white/20 border-white/5'}`}>
                        <b.icon size={12} /> {b.label}
                      </div>
                    ))}
                  </div>
                  
                  {s.share_token ? (
                    <a href={`/verify/${s.share_token}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 text-xs font-semibold transition-colors border border-teal-500/20">
                      <LinkIcon size={14} /> Profile
                    </a>
                  ) : (
                    <span className="text-xs text-white/20 italic">Private</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

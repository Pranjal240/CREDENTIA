'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Users, Search, Shield, CheckCircle2, ExternalLink } from 'lucide-react'

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-syne text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Company Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>Browse verified candidates</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-5 border flex flex-col md:flex-row gap-4" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgb(var(--text-muted))' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates..." className="w-full h-10 pl-10 pr-4 rounded-xl text-sm" style={{ background: 'rgb(var(--bg-input))', border: '1px solid rgba(var(--border-default), 0.8)', color: 'rgb(var(--text-primary))' }} />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs flex items-center gap-2" style={{ color: 'rgb(var(--text-secondary))' }}>
            Min ATS:
            <input type="number" min={0} max={100} value={minAts} onChange={e => setMinAts(Number(e.target.value))} className="w-16 h-10 px-3 rounded-xl text-sm text-center" style={{ background: 'rgb(var(--bg-input))', border: '1px solid rgba(var(--border-default), 0.8)', color: 'rgb(var(--text-primary))' }} />
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'rgb(var(--text-secondary))' }}>
            <input type="checkbox" checked={policeOnly} onChange={e => setPoliceOnly(e.target.checked)} className="rounded" />
            Police Verified
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Candidates', value: students.length, icon: Users },
          { label: 'Police Verified', value: students.filter(s => s.police_verified).length, icon: Shield },
          { label: 'Avg ATS Score', value: students.length ? Math.round(students.reduce((a, s) => a + (s.ats_score || 0), 0) / students.length) : 0, icon: CheckCircle2 },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl p-4 border text-center" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
            <stat.icon size={20} className="mx-auto mb-2" style={{ color: 'rgb(var(--accent))' }} />
            <p className="font-syne text-xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{stat.value}</p>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Candidate cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12"><p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>No candidates found matching filters</p></div>
        ) : filtered.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="rounded-2xl p-5 border flex items-center justify-between gap-4" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--teal)))' }}>
                {(s.profiles?.full_name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-syne font-bold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>{s.profiles?.full_name || 'Unknown'}</p>
                <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{s.course} {s.branch} • {s.graduation_year}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {[{ ok: s.police_verified, label: '🛡️' }, { ok: s.aadhaar_verified, label: '🪪' }, { ok: s.degree_verified, label: '🎓' }].map((b, j) => (
                  <span key={j} className="text-xs px-2 py-1 rounded-lg" style={{ background: b.ok ? 'rgba(var(--success), 0.1)' : 'rgba(var(--border-default), 0.3)', opacity: b.ok ? 1 : 0.4 }}>{b.label}</span>
                ))}
              </div>
              <span className="font-syne font-bold text-sm px-3 py-1 rounded-lg" style={{ background: 'rgba(var(--accent), 0.1)', color: 'rgb(var(--accent))' }}>{s.ats_score || 0}</span>
              {s.share_token && (
                <a href={`/verify/${s.share_token}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ color: 'rgb(var(--text-muted))' }}>
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

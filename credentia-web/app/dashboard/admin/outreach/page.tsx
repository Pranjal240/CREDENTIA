'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Building, Users, CheckCircle2, AlertCircle, Globe, MapPin } from 'lucide-react'

export default function UniversityOutreach() {
  const [universities, setUniversities] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'universities' | 'companies'>('universities')

  useEffect(() => {
    const load = async () => {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email, role, created_at').in('role', ['university', 'company']).order('created_at', { ascending: false })
      const all = profiles || []
      setUniversities(all.filter(p => p.role === 'university').map(p => ({ id: p.id, university_name: p.full_name, profiles: p, is_verified: true, created_at: p.created_at })))
      setCompanies(all.filter(p => p.role === 'company').map(p => ({ id: p.id, company_name: p.full_name, profiles: p, is_verified: true, created_at: p.created_at })))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><Building size={24} className="text-emerald-400" /> Institutions & Companies</h1>
        <p className="text-sm text-white/40 mt-1">Manage university and company registrations on the platform.</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/5">
        <button onClick={() => setActiveTab('universities')} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'universities' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}><Building size={14} /> Universities ({universities.length})</button>
        <button onClick={() => setActiveTab('companies')} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'companies' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}><Globe size={14} /> Companies ({companies.length})</button>
      </div>

      {activeTab === 'universities' && (
        universities.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
            <Building size={40} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/50 font-medium">No universities registered yet</p>
            <p className="text-sm text-white/30 mt-1">Universities that sign up will appear here for approval.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {universities.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0"><Building size={22} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-white text-sm">{u.university_name || u.profiles?.full_name || 'Unnamed University'}</p>
                  <p className="text-xs text-white/30 mt-0.5">{u.profiles?.email || 'No email'} {u.state ? `• ${u.city || ''}, ${u.state}` : ''}</p>
                  <div className="flex gap-2 mt-2">
                    {u.ugc_id && <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">UGC: {u.ugc_id}</span>}
                    {u.naac_grade && <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">NAAC: {u.naac_grade}</span>}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${u.is_verified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                  {u.is_verified ? 'Verified' : 'Pending'}
                </span>
              </motion.div>
            ))}
          </div>
        )
      )}

      {activeTab === 'companies' && (
        companies.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
            <Globe size={40} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/50 font-medium">No companies registered yet</p>
            <p className="text-sm text-white/30 mt-1">Companies that sign up will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0"><Globe size={22} /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-white text-sm">{c.company_name || c.profiles?.full_name || 'Unnamed Company'}</p>
                  <p className="text-xs text-white/30 mt-0.5">{c.profiles?.email || 'No email'} {c.industry ? `• ${c.industry}` : ''}</p>
                  <div className="flex gap-2 mt-2">
                    {c.company_size && <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{c.company_size}</span>}
                    {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="text-[9px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20 transition-colors">Website ↗</a>}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${c.is_verified ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                  {c.is_verified ? 'Verified' : 'Pending'}
                </span>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

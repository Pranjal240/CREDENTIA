'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Building, Globe, Users, CheckCircle2, Clock, Mail, Trophy } from 'lucide-react'

export default function UniversityOutreach() {
  const [universities, setUniversities] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'universities' | 'companies'>('universities')
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        // Use service-role API route — bypasses RLS completely
        const res = await fetch('/api/admin/entities')
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
        const data = await res.json()
        setUniversities(data.universities || [])
        setCompanies(data.companies || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
      {type === 'university' ? (
        <Building size={40} className="mx-auto mb-4 text-white/10" />
      ) : (
        <Globe size={40} className="mx-auto mb-4 text-white/10" />
      )}
      <p className="text-white/50 font-medium">No {type === 'university' ? 'universities' : 'companies'} registered yet</p>
      <p className="text-sm text-white/30 mt-2 max-w-sm mx-auto">
        {type === 'university'
          ? 'Universities that sign up with role="university" will appear here.'
          : 'Companies that sign up with role="company" will appear here.'}
      </p>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
          <Building size={24} className="text-emerald-400" /> Institutions & Companies
        </h1>
        <p className="text-sm text-white/40 mt-1">
          All registered universities and companies on the platform.
        </p>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          ⚠ {error}
        </div>
      )}

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Universities', value: universities.length, icon: Building, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Companies', value: companies.length, icon: Globe, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Verified Institutions', value: universities.length + companies.length, icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: 'Total Registered', value: universities.length + companies.length, icon: Users, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-xl p-4 border border-white/5"
            style={{ background: s.bg }}>
            <s.icon size={18} style={{ color: s.color }} className="mb-2" />
            <p className="font-heading text-xl font-bold text-white">{s.value}</p>
            <p className="text-[9px] font-semibold tracking-wider uppercase text-white/30 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/5">
        <button
          onClick={() => setActiveTab('universities')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'universities' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          <Building size={14} /> Universities ({universities.length})
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'companies' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          <Globe size={14} /> Companies ({companies.length})
        </button>
      </div>

      {activeTab === 'universities' && (
        universities.length === 0 ? <EmptyState type="university" /> : (
          <div className="space-y-3">
            {universities.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg flex-shrink-0">
                  {(u.full_name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-white text-sm">{u.full_name || 'Unnamed University'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Mail size={11} className="text-white/25 flex-shrink-0" />
                    <p className="text-xs text-white/30 truncate">{u.email}</p>
                  </div>
                  <p className="text-[10px] text-white/20 mt-0.5">
                    Joined {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  Active
                </span>
              </motion.div>
            ))}
          </div>
        )
      )}

      {activeTab === 'companies' && (
        companies.length === 0 ? <EmptyState type="company" /> : (
          <div className="space-y-3">
            {companies.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg flex-shrink-0">
                  {(c.full_name || 'C')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-white text-sm">{c.full_name || 'Unnamed Company'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Mail size={11} className="text-white/25 flex-shrink-0" />
                    <p className="text-xs text-white/30 truncate">{c.email}</p>
                  </div>
                  <p className="text-[10px] text-white/20 mt-0.5">
                    Joined {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  Active
                </span>
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

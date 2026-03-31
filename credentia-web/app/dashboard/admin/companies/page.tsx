'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Building, Globe, Mail, RefreshCw } from 'lucide-react'

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<any[]>([])
  const [universities, setUniversities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'companies' | 'universities'>('companies')
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      // Use service-role API — bypasses RLS
      const res = await fetch('/api/admin/entities')
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setCompanies(data.companies || [])
      setUniversities(data.universities || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
    </div>
  )

  const list = activeTab === 'companies' ? companies : universities

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
            <Building size={24} className="text-red-400" /> Institutions & Companies
          </h1>
          <p className="text-sm text-white/40 mt-1">Manage university and company registrations on the platform.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          ⚠ {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 border border-white/5" style={{ background: 'rgba(16,185,129,0.06)' }}>
          <Globe size={18} className="text-emerald-400 mb-2" />
          <p className="font-heading text-2xl font-bold text-white">{companies.length}</p>
          <p className="text-[9px] font-semibold tracking-wider uppercase text-white/30 mt-0.5">Registered Companies</p>
        </div>
        <div className="rounded-xl p-4 border border-white/5" style={{ background: 'rgba(99,102,241,0.06)' }}>
          <Building size={18} className="text-indigo-400 mb-2" />
          <p className="font-heading text-2xl font-bold text-white">{universities.length}</p>
          <p className="text-[9px] font-semibold tracking-wider uppercase text-white/30 mt-0.5">Registered Universities</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/5">
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'companies' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          <Globe size={14} /> Companies ({companies.length})
        </button>
        <button
          onClick={() => setActiveTab('universities')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'universities' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
        >
          <Building size={14} /> Universities ({universities.length})
        </button>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
          {activeTab === 'companies'
            ? <Globe size={40} className="mx-auto mb-4 text-white/10" />
            : <Building size={40} className="mx-auto mb-4 text-white/10" />}
          <p className="text-white/50 font-medium">No {activeTab} registered yet</p>
          <p className="text-sm text-white/30 mt-2 max-w-sm mx-auto">
            {activeTab === 'companies'
              ? 'Companies that sign up with role="company" will appear here.'
              : 'Universities that sign up with role="university" will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors"
            >
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                  activeTab === 'companies'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}
              >
                {(item.full_name || item.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-white text-sm">{item.full_name || item.email?.split('@')[0] || 'Unnamed'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Mail size={11} className="text-white/25 flex-shrink-0" />
                  <p className="text-xs text-white/30 truncate">{item.email || '—'}</p>
                </div>
                <p className="text-[9px] text-white/20 mt-0.5">
                  Joined {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex-shrink-0">
                Active
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

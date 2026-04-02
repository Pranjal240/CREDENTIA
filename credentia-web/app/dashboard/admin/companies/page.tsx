'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building, Globe, Mail, RefreshCw, Calendar, Link as LinkIcon, ExternalLink } from 'lucide-react'

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<any[]>([])
  const [universities, setUniversities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'companies' | 'universities'>('companies')
  const [error, setError] = useState('')

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

  useEffect(() => {
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  const list = activeTab === 'companies' ? companies : universities

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
            <Building size={24} className="text-indigo-400" /> Institutions Directory
          </h1>
          <p className="text-sm text-white/40 mt-1">Manage all affiliated universities and business entities.</p>
        </motion.div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white/10 active:scale-95"
          style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {/* Hero Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} onClick={() => setActiveTab('companies')} className={`rounded-2xl p-6 border transition-all cursor-pointer group overflow-hidden relative ${activeTab === 'companies' ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
          <div className={`absolute -right-4 -bottom-4 w-32 h-32 blur-[50px] transition-opacity ${activeTab === 'companies' ? 'opacity-30 bg-indigo-500' : 'opacity-0'}`} />
          <Globe size={24} className={`mb-3 transition-colors ${activeTab === 'companies' ? 'text-indigo-400' : 'text-white/30 group-hover:text-white/50'}`} />
          <p className="font-heading text-4xl font-black text-white leading-none mb-1">{companies.length}</p>
          <p className="text-xs font-bold tracking-widest uppercase text-white/40">Verified Companies</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} onClick={() => setActiveTab('universities')} className={`rounded-2xl p-6 border transition-all cursor-pointer group overflow-hidden relative ${activeTab === 'universities' ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'}`}>
          <div className={`absolute -right-4 -bottom-4 w-32 h-32 blur-[50px] transition-opacity ${activeTab === 'universities' ? 'opacity-30 bg-emerald-500' : 'opacity-0'}`} />
          <Building size={24} className={`mb-3 transition-colors ${activeTab === 'universities' ? 'text-emerald-400' : 'text-white/30 group-hover:text-white/50'}`} />
          <p className="font-heading text-4xl font-black text-white leading-none mb-1">{universities.length}</p>
          <p className="text-xs font-bold tracking-widest uppercase text-white/40">Partner Universities</p>
        </motion.div>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.2 }}
          >
            {list.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-white/5 bg-white/[0.01]">
                {activeTab === 'companies' ? <Globe size={48} className="mx-auto mb-5 text-white/10" /> : <Building size={48} className="mx-auto mb-5 text-white/10" />}
                <p className="text-white/70 font-heading text-xl font-bold">No {activeTab} registrations yet</p>
                <p className="text-sm text-white/30 mt-2 max-w-sm mx-auto">
                  New users signing up with the <code className="bg-black/30 px-1 py-0.5 rounded text-white/50">{activeTab.slice(0,-3)}y</code> role will appear in this directory automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {list.map((item, i) => {
                   const rc = activeTab === 'companies' ? '#6366f1' : '#10b981'
                   const active = item.is_active !== false
                   return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col hover:bg-white/[0.04] hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative"
                    >
                      <div className="absolute top-0 right-0 p-4">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                          {active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-14 h-14 rounded-xl border flex items-center justify-center font-heading font-black text-2xl flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform" style={{ backgroundColor: `${rc}10`, borderColor: `${rc}20`, color: rc }}>
                          {(item.full_name || item.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 pt-1 relative z-10">
                          <p className="font-heading font-bold text-white text-lg truncate pr-16">{item.full_name || item.email?.split('@')[0] || 'Unnamed Entity'}</p>
                          <div className="max-w-fit mt-1">
                             <a href={`mailto:${item.email}`} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors text-xs truncate border border-white/5" title={item.email}>
                               <Mail size={12} className="flex-shrink-0" /> <span className="truncate">{item.email}</span>
                             </a>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                           <Calendar size={14} className="text-white/20" />
                           <span className="text-[10px] text-white/40 uppercase font-medium mt-0.5">{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center justify-end gap-2 text-right">
                           <span className="text-[10px] text-white/30 uppercase font-medium">Network ID</span>
                           <code className="text-[9px] bg-black/40 text-white/50 px-1.5 py-0.5 rounded truncate max-w-[60px]">{item.id.split('-')[0]}</code>
                        </div>
                      </div>
                      
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-current transition-colors opacity-30" style={{ color: rc }} />
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

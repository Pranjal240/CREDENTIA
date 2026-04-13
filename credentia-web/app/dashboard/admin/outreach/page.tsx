'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building, Globe, CheckCircle2, Clock, Mail, ToggleLeft, Loader2, Bell, AlertCircle, RefreshCw, Phone, MapPin, Calendar, XCircle, Eye, X, Briefcase, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function UniversityOutreach() {
  const [universities, setUniversities] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'universities' | 'companies'>('universities')
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [actionError, setActionError] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<any>(null)

  const load = async () => {
    try {
      const res = await fetch('/api/admin/entities')
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
      const data = await res.json()
      setUniversities(data.universities || [])
      setCompanies(data.companies || [])
      setError('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const channel = supabase.channel('admin_outreach_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'universities' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const toggleUniversityVerification = async (uniId: string, currentVerified: boolean) => {
    setActionLoading(prev => ({ ...prev, [uniId]: true }))
    setActionError('')
    try {
      const res = await fetch('/api/admin/update-entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: uniId,
          role: 'university',
          entityUpdates: { is_verified: !currentVerified },
        })
      })
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Request failed: ${res.status}`)
      }
      
      setUniversities(prev => prev.map(u =>
        u.id === uniId ? { ...u, entityData: { ...(u.entityData || {}), is_verified: !currentVerified } } : u
      ))
    } catch (err: any) {
      console.error('[Approve] Error:', err)
      setActionError(err.message || 'Failed to update verification status')
    }
    setActionLoading(prev => ({ ...prev, [uniId]: false }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  const verifiedUniCount = universities.filter(u => u.entityData?.is_verified).length
  const pendingUniCount = universities.filter(u => !u.entityData?.is_verified).length

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Building size={24} className="text-emerald-400 flex-shrink-0" /> Institutions & Companies
          </h1>
          <p className="text-sm text-white/40 mt-1">All registered universities and companies on the platform.</p>
        </div>
        <button onClick={() => { setLoading(true); load() }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-white/10 bg-white/[0.03] text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all self-start">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {actionError && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle size={16} /> {actionError}
          <button onClick={() => setActionError('')} className="ml-auto text-white/40 hover:text-white/60">✕</button>
        </motion.div>
      )}

      {pendingUniCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-4 py-3 flex items-center gap-3 border border-orange-500/20 bg-orange-500/5"
        >
          <div className="w-8 h-8 rounded-full bg-orange-500/15 flex items-center justify-center flex-shrink-0">
            <Bell size={16} className="text-orange-400 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-400">{pendingUniCount} Universit{pendingUniCount === 1 ? 'y' : 'ies'} Pending Approval</p>
            <p className="text-xs text-white/40">New university registrations require your verification before they can access analytics and student data.</p>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Universities', value: universities.length, icon: Building, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
          { label: 'Companies', value: companies.length, icon: Globe, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Verified Unis', value: verifiedUniCount, icon: CheckCircle2, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: 'Pending', value: pendingUniCount, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-xl p-3 sm:p-4 border border-white/5" style={{ background: s.bg }}>
            <s.icon size={18} style={{ color: s.color }} className="mb-2" />
            <p className="font-heading text-xl font-bold text-white">{s.value}</p>
            <p className="text-[9px] font-semibold tracking-wider uppercase text-white/30 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/5">
        <button onClick={() => setActiveTab('universities')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'universities' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
          <Building size={14} /> Universities ({universities.length})
        </button>
        <button onClick={() => setActiveTab('companies')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'companies' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
          <Globe size={14} /> Companies ({companies.length})
        </button>
      </div>

      {/* Universities Tab */}
      {activeTab === 'universities' && (
        universities.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
            <Building size={40} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/50 font-medium">No universities registered yet</p>
            <p className="text-sm text-white/30 mt-2">Universities that sign up will appear here for verification.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {universities.map((u, i) => {
              const isVerified = u.entityData?.is_verified === true
              const isToggling = actionLoading[u.id]
              return (
                <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                    isVerified ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]' : 'border-orange-500/20 bg-orange-500/[0.03] hover:bg-orange-500/[0.05]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                      isVerified ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                    }`}>
                      {(u.full_name || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                        {u.full_name || 'Unnamed University'}
                        {!isVerified && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20">NEW</span>
                        )}
                        {isVerified && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">VERIFIED</span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-white/30">
                          <Mail size={11} className="flex-shrink-0" /> {u.email}
                        </span>
                        {u.phone && (
                          <span className="flex items-center gap-1 text-xs text-white/30">
                            <Phone size={11} className="flex-shrink-0" /> {u.phone}
                          </span>
                        )}
                      </div>
                      {u.entityData?.ugc_id && (
                        <p className="text-[10px] text-white/25 mt-0.5">UGC ID: {u.entityData.ugc_id}</p>
                      )}
                      <p className="text-[10px] text-white/20 mt-0.5 flex items-center gap-1">
                        <Calendar size={10} /> Joined {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button type="button" onClick={() => setSelectedEntity({ ...u, _type: 'university' })}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-white/10 bg-white/[0.03] text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all">
                        <Eye size={14} /> View
                      </button>
                      <button type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleUniversityVerification(u.id, isVerified) }}
                        disabled={isToggling}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border disabled:opacity-50 cursor-pointer select-none active:scale-95 ${
                          isVerified
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30'
                            : 'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30'
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isVerified ? (
                          <ShieldCheck size={16} />
                        ) : (
                          <ToggleLeft size={16} />
                        )}
                        {isToggling ? 'Processing...' : isVerified ? 'Verified ✓' : 'Approve'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )
      )}

      {/* Companies Tab */}
      {activeTab === 'companies' && (
        companies.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
            <Globe size={40} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/50 font-medium">No companies registered yet</p>
            <p className="text-sm text-white/30 mt-2">Companies that sign up will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 hover:bg-white/[0.04] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg flex-shrink-0">
                    {(c.full_name || 'C')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-white text-sm">{c.full_name || 'Unnamed Company'}</p>
                    {c.entityData?.description && (
                      <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{c.entityData.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {c.entityData?.industry && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/5 text-white/30 border border-white/5">
                          {c.entityData.industry}
                        </span>
                      )}
                      {c.entityData?.website && (
                        <span className="flex items-center gap-1 text-[10px] text-white/25">
                          <Globe size={10} /> {c.entityData.website}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1 text-[10px] text-white/25">
                          <Phone size={10} /> {c.phone}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/20 mt-0.5 flex items-center gap-1">
                      <Calendar size={10} /> Joined {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button type="button" onClick={() => setSelectedEntity({ ...c, _type: 'company' })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-white/10 bg-white/[0.03] text-white/50 hover:text-white/80 hover:bg-white/[0.06] transition-all">
                      <Eye size={14} /> View
                    </button>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Active
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEntity && (
          <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 pt-16 sm:pt-4 bg-black/60 backdrop-blur-md overflow-y-auto" onClick={() => setSelectedEntity(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0e0e14] p-6 shadow-2xl my-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading text-lg font-bold text-white flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                    selectedEntity._type === 'university' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  }`}>
                    {(selectedEntity.full_name || 'X')[0].toUpperCase()}
                  </div>
                  {selectedEntity.full_name}
                </h2>
                <button onClick={() => setSelectedEntity(null)} className="p-2 rounded-xl hover:bg-white/5 text-white/40"><X size={18} /></button>
              </div>

              <div className="space-y-3">
                <InfoRow label="Type" value={selectedEntity._type === 'university' ? 'University' : 'Company'} />
                <InfoRow label="Email" value={selectedEntity.email || '—'} />
                <InfoRow label="Phone" value={selectedEntity.phone || '—'} />
                <InfoRow label="Joined" value={new Date(selectedEntity.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
                <InfoRow label="Account Status" value={selectedEntity.is_active !== false ? 'Active' : 'Inactive'} />

                {selectedEntity._type === 'university' && (
                  <>
                    <div className="border-t border-white/5 my-3"></div>
                    <InfoRow label="University Name" value={selectedEntity.entityData?.university_name || selectedEntity.full_name || '—'} />
                    <InfoRow label="Verification" value={selectedEntity.entityData?.is_verified ? '✅ Verified' : '⏳ Pending'} />
                    <InfoRow label="UGC ID" value={selectedEntity.entityData?.ugc_id || '—'} />
                  </>
                )}

                {selectedEntity._type === 'company' && (
                  <>
                    <div className="border-t border-white/5 my-3"></div>
                    <InfoRow label="Company Name" value={selectedEntity.entityData?.company_name || selectedEntity.full_name || '—'} />
                    <InfoRow label="Industry" value={selectedEntity.entityData?.industry || '—'} />
                    <InfoRow label="Website" value={selectedEntity.entityData?.website || '—'} />
                    <InfoRow label="Description" value={selectedEntity.entityData?.description || '—'} multiline />
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InfoRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 sm:w-32 flex-shrink-0">{label}</p>
      <p className={`text-sm text-white/70 flex-1 ${multiline ? '' : 'truncate'}`}>{value}</p>
    </div>
  )
}

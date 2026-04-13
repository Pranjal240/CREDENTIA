'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building, Globe, Mail, RefreshCw, Calendar, Link as LinkIcon, ExternalLink, X, ToggleLeft, ToggleRight, Edit2, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<any[]>([])
  const [universities, setUniversities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'companies' | 'universities'>('companies')
  const [error, setError] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [savingEdit, setSavingEdit] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
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

    // Realtime: auto-refresh when companies, universities, or profiles change
    const channel = supabase.channel('admin_entities_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'universities' }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleEditSave = async () => {
    if (!selectedEntity) return
    setSavingEdit(true)
    try {
      const isCompany = selectedEntity.role === 'company'
      
      const profileUpdates: any = {}
      if (editForm.full_name !== selectedEntity.full_name) profileUpdates.full_name = editForm.full_name
      if (editForm.phone !== selectedEntity.phone) profileUpdates.phone = editForm.phone
      if (editForm.is_active !== selectedEntity.is_active) profileUpdates.is_active = editForm.is_active
      
      const entityUpdates: any = {}
      if (isCompany) {
        if (editForm.description !== selectedEntity.entityData?.description) entityUpdates.description = editForm.description
        if (editForm.industry !== selectedEntity.entityData?.industry) entityUpdates.industry = editForm.industry
        if (editForm.website !== selectedEntity.entityData?.website) entityUpdates.website = editForm.website
        if (editForm.company_name !== selectedEntity.entityData?.company_name) entityUpdates.company_name = editForm.company_name || editForm.full_name
      } else {
        if (editForm.is_verified !== selectedEntity.entityData?.is_verified) entityUpdates.is_verified = editForm.is_verified
        if (editForm.ugc_id !== selectedEntity.entityData?.ugc_id) entityUpdates.ugc_id = editForm.ugc_id
        if (editForm.university_name !== selectedEntity.entityData?.university_name) entityUpdates.university_name = editForm.university_name || editForm.full_name
      }

      await fetch('/api/admin/update-entity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedEntity.id, role: selectedEntity.role, profileUpdates, entityUpdates })
      })

      await load()
      setSelectedEntity(null)
      setIsEditing(false)
    } catch (e: any) {
      alert("Failed to save: " + e.message)
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  )

  const list = activeTab === 'companies' ? companies : universities

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
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
                      onClick={() => {
                        setSelectedEntity(item)
                        setEditForm({
                          full_name: item.full_name || '',
                          phone: item.phone || '',
                          is_active: item.is_active !== false,
                          ...item.entityData
                        })
                        setIsEditing(false)
                      }}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="cursor-pointer rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col hover:bg-white/[0.04] hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative"
                    >
                      <div className="absolute top-0 right-0 p-4">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                          {active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex items-start gap-4 mb-5">
                        <div className="w-14 h-14 rounded-xl border flex items-center justify-center font-heading font-black text-2xl flex-shrink-0 shadow-inner overflow-hidden group-hover:scale-105 transition-transform" style={{ backgroundColor: `${rc}10`, borderColor: `${rc}20`, color: rc }}>
                          {item.avatar_url ? (
                            <img src={item.avatar_url} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            (item.entityData?.company_name?.[0]?.toUpperCase() || item.entityData?.university_name?.[0]?.toUpperCase() || item.full_name?.[0]?.toUpperCase() || item.email?.[0]?.toUpperCase() || '?')
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-1 relative z-10">
                          <p className="font-heading font-bold text-white text-lg truncate pr-16">{item.entityData?.company_name || item.entityData?.university_name || item.full_name || item.email?.split('@')[0] || 'Unnamed Entity'}</p>
                          {/* Show the original Gmail name if it differs from the entity manually set name */}
                          {item.full_name && (item.entityData?.company_name || item.entityData?.university_name) && item.full_name !== (item.entityData?.company_name || item.entityData?.university_name) && (
                            <p className="text-[10px] uppercase font-bold tracking-widest text-white/30 truncate mt-0.5">Original: {item.full_name}</p>
                          )}
                          <div className="max-w-fit mt-1 flex flex-col gap-1">
                             <a href={`mailto:${item.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors text-xs truncate border border-white/5" title={item.email}>
                               <Mail size={12} className="flex-shrink-0" /> <span className="truncate">{item.email}</span>
                             </a>
                             {item.role === 'university' && item.entityData?.is_verified === false && (
                               <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/10 text-orange-400 text-xs truncate border border-orange-500/20">
                                 <ShieldAlert size={12} /> <span className="truncate">Pending Verification</span>
                               </div>
                             )}
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

      {/* Modal */}
      {selectedEntity && (
        <div className="fixed inset-0 z-[100] overflow-y-auto p-4 flex no-scrollbar" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedEntity(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="m-auto relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#0e0e14] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
                {selectedEntity.role === 'company' ? <Globe className="text-indigo-400" /> : <Building className="text-emerald-400" />}
                {isEditing ? `Edit ${selectedEntity.role === 'company' ? 'Company' : 'University'}` : (selectedEntity.full_name || 'Details')}
              </h2>
              <button onClick={() => setSelectedEntity(null)} className="p-2 rounded-xl hover:bg-white/5 text-white/40 transition-colors"><X size={20} /></button>
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">Entity Name (Profile)</label>
                    <input value={editForm.full_name || ''} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500/50 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">Phone Number</label>
                    <input value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500/50 outline-none" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">Login Status</p>
                    <p className="text-xs text-white/40">Can this entity log in?</p>
                  </div>
                  <button onClick={() => setEditForm({...editForm, is_active: !editForm.is_active})} className={`flex items-center gap-2 text-sm font-bold ${editForm.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                    {editForm.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />} {editForm.is_active ? 'Active' : 'Disabled'}
                  </button>
                </div>

                {selectedEntity.role === 'company' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">Industry</label>
                        <input value={editForm.industry || ''} onChange={e => setEditForm({...editForm, industry: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500/50 outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">Website</label>
                        <input value={editForm.website || ''} onChange={e => setEditForm({...editForm, website: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500/50 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">Description</label>
                      <textarea value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full h-24 p-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500/50 outline-none resize-none" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
                      <div>
                        <p className="text-sm font-medium text-white flex items-center gap-2"><ShieldAlert size={16} className="text-orange-400"/> Approval Status</p>
                        <p className="text-xs text-white/40">Is this university approved to use the platform?</p>
                      </div>
                      <button onClick={() => setEditForm({...editForm, is_verified: !editForm.is_verified})} className={`flex items-center gap-2 text-sm font-bold ${editForm.is_verified ? 'text-emerald-400' : 'text-orange-400'}`}>
                        {editForm.is_verified ? <CheckCircle2 size={24} /> : <ToggleLeft size={24} />} {editForm.is_verified ? 'Approved' : 'Pending'}
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">UGC ID (Accreditation Code)</label>
                      <input value={editForm.ugc_id || ''} onChange={e => setEditForm({...editForm, ugc_id: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500/50 outline-none" />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors">Cancel</button>
                  <button onClick={handleEditSave} disabled={savingEdit} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                    {savingEdit ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-black overflow-hidden shadow-inner flex-shrink-0">
                    {selectedEntity.avatar_url ? (
                      <img src={selectedEntity.avatar_url} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-white/50">{(selectedEntity.entityData?.company_name?.[0] || selectedEntity.entityData?.university_name?.[0] || selectedEntity.full_name?.[0] || selectedEntity.email?.[0] || '?').toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-lg font-bold text-white truncate">{selectedEntity.entityData?.company_name || selectedEntity.entityData?.university_name || selectedEntity.full_name || 'Unnamed'}</h3>
                    <p className="text-sm text-white/40">{selectedEntity.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${selectedEntity.is_active !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                         {selectedEntity.is_active !== false ? 'Active Account' : 'Disabled Account'}
                       </span>
                       {selectedEntity.role === 'university' && (
                         <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ${selectedEntity.entityData?.is_verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'}`}>
                           {selectedEntity.entityData?.is_verified ? 'Approved' : 'Pending Approval'}
                         </span>
                       )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: 'Phone', v: selectedEntity.phone || '—' },
                    { l: 'Network ID', v: selectedEntity.id?.split('-')[0] },
                    { l: 'Joined', v: new Date(selectedEntity.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                    ...(selectedEntity.role === 'company' ? [
                      { l: 'Industry', v: selectedEntity.entityData?.industry || '—' },
                      { l: 'Website', v: selectedEntity.entityData?.website || '—' }
                    ] : [
                      { l: 'UGC ID', v: selectedEntity.entityData?.ugc_id || '—' },
                    ])
                  ].map((d, i) => (
                    <div key={i} className="flex flex-col justify-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-white/30 mb-0.5">{d.l}</p>
                      <p className="text-sm text-white/90 font-medium truncate">{d.v}</p>
                    </div>
                  ))}
                </div>

                {selectedEntity.role === 'company' && selectedEntity.entityData?.description && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-white/30 mb-2">Description</p>
                    <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{selectedEntity.entityData.description}</p>
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-white/10 flex justify-end">
                  <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all flex items-center gap-2 border border-white/10">
                    <Edit2 size={16} /> Edit Entity
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

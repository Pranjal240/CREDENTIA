'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Building2, Search, Briefcase, ChevronRight, CheckCircle2, Globe, Send, X, Loader2, MapPin, Users, Mail, Phone } from 'lucide-react'

export default function StudentApplyPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompany, setSelectedEntity] = useState<any>(null)
  
  const [jobTitle, setJobTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [appliedRoles, setAppliedRoles] = useState<Record<string, boolean>>({})
  const [applySuccess, setApplySuccess] = useState(false)
  const [applyError, setApplyError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        // Fetch active companies
        const res = await fetch('/api/student/companies', { cache: 'no-store' })
        const data = await res.json()
        if (data.companies) setCompanies(data.companies)

        // Fetch my existing applications via server-side API (bypasses RLS)
        const appsRes = await fetch('/api/student/my-applications')
        const appsData = await appsRes.json()
        if (appsData.applications) {
          const dict: Record<string, boolean> = {}
          appsData.applications.forEach((a: any) => dict[a.company_id] = true)
          setAppliedRoles(dict)
        }

      } catch (err) {
        console.error(err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()

    const channel = supabase.channel('student-companies-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, (payload) => {
        const newData = payload.new as any;
        if (!newData.id) return;
        setCompanies(prev => prev.map(c => 
          c.id === newData.id ? { ...c, entityData: { ...c.entityData, ...newData } } : c
        ))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        const newData = payload.new as any;
        if (!newData.id) return;
        setCompanies(prev => prev.map(c => 
          c.id === newData.id ? { ...c, ...newData } : c
        ))
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  const handleApply = async () => {
    if (!selectedCompany || !jobTitle.trim()) return
    setIsApplying(true)
    setApplyError('')
    try {
      // Use server-side API to bypass RLS
      const res = await fetch('/api/student/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: selectedCompany.id,
          job_title: jobTitle,
          notes: notes
        })
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Application failed')

      setAppliedRoles({ ...appliedRoles, [selectedCompany.id]: true })
      setApplySuccess(true)
      setTimeout(() => {
        setSelectedEntity(null)
        setJobTitle('')
        setNotes('')
        setApplySuccess(false)
      }, 1500)
    } catch (err: any) {
      setApplyError(err.message || 'Failed to apply')
    } finally {
      setIsApplying(false)
    }
  }

  const filtered = companies.filter(c => {
    const displayName = (c.entityData?.company_name || c.full_name || '').toLowerCase()
    const q = searchQuery.toLowerCase()
    return displayName.includes(q) ||
      c.entityData?.industry?.toLowerCase().includes(q) ||
      c.entityData?.description?.toLowerCase().includes(q)
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pt-8 pb-12 relative px-1">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-heading text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase size={24} className="text-emerald-400 flex-shrink-0" /> Company Opportunities
          </h1>
          <p className="text-sm text-white/40 mt-1">Browse and apply to verified companies in the Credentia network.</p>
        </motion.div>
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search companies or industries..." 
            className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50 transition-colors" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((company, i) => {
          const isApplied = appliedRoles[company.id]
          const isVerified = company.is_active !== false
          if (!isVerified) return null

          return (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-[24px] border border-white/10 bg-[#16161e]/80 backdrop-blur-md p-6 flex flex-col transition-all group relative overflow-hidden shadow-xl"
            >
              {/* Background Glow Effect */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="flex flex-row items-center gap-4 mb-4 relative z-10">
                <div className="w-16 h-16 rounded-[18px] flex items-center justify-center font-heading font-black text-3xl flex-shrink-0 shadow-inner bg-gradient-to-br from-emerald-500/20 to-teal-500/5 border border-emerald-500/30 text-emerald-400 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                  {company.avatar_url ? (
                    <img src={company.avatar_url} alt="Company logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    (company.entityData?.company_name?.[0]?.toUpperCase() || company.full_name?.[0]?.toUpperCase() || 'C')
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-white text-lg sm:text-xl truncate flex items-center gap-2 tracking-tight group-hover:text-emerald-300 transition-colors">
                    {company.entityData?.company_name || company.full_name || 'Unnamed Company'} 
                    {isVerified && <CheckCircle2 size={18} className="text-blue-400 flex-shrink-0" />}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {company.entityData?.industry && (
                      <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-md bg-white/5 text-emerald-400/80 border border-emerald-500/10">
                        {company.entityData.industry}
                      </span>
                    )}
                    {company.entityData?.website && (
                      <span className="flex flex-row items-center gap-1.5 text-[11px] font-medium text-white/40 truncate max-w-[150px] hover:text-white/70 transition-colors cursor-pointer">
                        <Globe size={12} className="flex-shrink-0" /> {company.entityData.website.replace(/^https?:\/\//, '')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Company description */}
              <p className="text-sm text-white/50 leading-relaxed line-clamp-3 mb-6 relative z-10">
                {company.entityData?.description || 'No description provided by the company.'}
              </p>

              <div className="mt-auto pt-5 flex items-center justify-between relative z-10 before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent">
                <p className="text-[11px] text-white/30 uppercase tracking-widest flex items-center gap-1.5 font-semibold">
                  <Building2 size={14} className="text-white/20" /> {company.entityData?.company_name || company.full_name || 'Company'}
                </p>
                <button
                  onClick={() => !isApplied && setSelectedEntity(company)}
                  disabled={isApplied}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative overflow-hidden group/btn ${
                    isApplied 
                    ? 'bg-white/5 text-emerald-400/60 cursor-not-allowed border border-emerald-500/20' 
                    : 'bg-gradient-to-r from-emerald-500 hover:from-emerald-400 to-teal-500 hover:to-teal-400 text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.5)]'
                  }`}
                >
                  {isApplied ? <><CheckCircle2 size={16} /> Applied</> : <><Send size={16} className="group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" /> Apply Now</>}
                </button>
              </div>
            </motion.div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center rounded-2xl border border-white/5 bg-white/[0.01]">
            <Building2 size={48} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/70 font-heading text-lg font-bold">No companies found</p>
            <p className="text-sm text-white/30 mt-1">Check back later for new opportunities.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedCompany && (
          <div className="fixed inset-0 z-[100] bg-[#0a0a0f]/80 backdrop-blur-md overflow-y-auto p-4 flex" onClick={() => { setSelectedEntity(null); setApplyError(''); setApplySuccess(false) }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.4 }}
              className="m-auto relative w-full max-w-lg flex flex-col rounded-[2rem] border border-white/10 bg-[#12121a] p-5 sm:p-6 shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />

              <div className="flex items-center justify-between mb-4 relative z-10 flex-shrink-0">
                <h2 className="font-heading text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-emerald-500/20 to-teal-500/5 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
                    <Briefcase size={16} />
                  </div>
                  Apply
                </h2>
                <button onClick={() => { setSelectedEntity(null); setApplyError(''); setApplySuccess(false) }} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"><X size={18} /></button>
              </div>

              {/* Company info summary in modal */}
              <div className="rounded-[16px] bg-white/[0.02] border border-white/5 p-3 mb-5 space-y-2 relative z-10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 flex items-center justify-center text-white/80 font-bold text-lg flex-shrink-0 shadow-inner overflow-hidden">
                      {selectedCompany.avatar_url ? (
                        <img src={selectedCompany.avatar_url} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        selectedCompany.entityData?.company_name?.[0]?.toUpperCase() || selectedCompany.full_name?.[0]?.toUpperCase() || 'C'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                    <p className="font-heading font-bold text-white text-base truncate tracking-tight">{selectedCompany.entityData?.company_name || selectedCompany.full_name || 'Unnamed Company'}</p>
                    {selectedCompany.entityData?.industry && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/80 mt-0.5 block">{selectedCompany.entityData.industry}</span>
                    )}
                  </div>
                </div>
                {selectedCompany.entityData?.description && (
                  <p className="text-[11px] text-white/40 leading-relaxed line-clamp-2 mt-1">{selectedCompany.entityData.description}</p>
                )}
              </div>

                {applySuccess ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10 relative z-10">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={48} className="text-emerald-400" />
                    </div>
                    <p className="font-heading font-bold text-white text-2xl tracking-tight">Application Submitted!</p>
                    <p className="text-sm text-white/40 mt-2">The company has been notified securely.</p>
                  </motion.div>
                ) : (
                <div className="space-y-4 relative z-10 w-full">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5 block">Job Title / Role</label>
                    <input 
                      value={jobTitle} 
                      onChange={e => setJobTitle(e.target.value)} 
                      placeholder="e.g. Frontend Developer, Intern" 
                      className="w-full h-11 px-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:bg-white/[0.05] focus:border-emerald-500/50 outline-none transition-all placeholder:text-white/20" 
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5 block">Optional Notes / Pitch</label>
                    <textarea 
                      value={notes} 
                      onChange={e => setNotes(e.target.value)} 
                      placeholder="Why are you a good fit?" 
                      className="w-full h-20 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:bg-white/[0.05] focus:border-emerald-500/50 outline-none resize-none transition-all placeholder:text-white/20" 
                    />
                  </div>

                  <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl p-3 mt-1.5">
                    <p className="text-[11px] text-emerald-400/90 flex items-start sm:items-center gap-2 font-medium leading-tight">
                      <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5 sm:mt-0" /> 
                      Your verified profile and credentials will be automatically shared with the company securely.
                    </p>
                  </div>

                  {applyError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl px-3 py-2 text-xs flex items-center gap-2 mt-2" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
                      <X size={14} className="flex-shrink-0" /> {applyError}
                    </motion.div>
                  )}

                  <button 
                    onClick={handleApply} 
                    disabled={isApplying || !jobTitle.trim()} 
                    className="flex-shrink-0 w-full h-12 mt-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-50 text-white font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_30px_rgba(16,185,129,0.5)] group/submit"
                  >
                    {isApplying ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} className="group-hover/submit:-translate-y-0.5 group-hover/submit:translate-x-0.5 transition-transform" /> Submit Application</>}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

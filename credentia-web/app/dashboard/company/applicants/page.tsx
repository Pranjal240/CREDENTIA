'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, CheckCircle2, XCircle, Clock, FileText, 
  ChevronRight, Search, Shield, GraduationCap, Building2, MapPin, Briefcase
} from 'lucide-react'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import { supabase } from '@/lib/supabase'

export default function CompanyApplicantsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const load = async () => {
    try {
      const res = await fetch('/api/company/applications')
      const data = await res.json()
      if (data.applications) setApplications(data.applications)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()

    // Realtime: auto-refresh when applications change
    const channel = supabase.channel('company_applicants_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        load()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const updateStatus = async (appId: string, status: string) => {
    // Optimistic UI
    setApplications(apps => apps.map(a => a.id === appId ? { ...a, status } : a))
    try {
      await fetch('/api/company/applications/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, status })
      })
    } catch (e) {
      alert("Failed to update status")
      load() // Reload if failed
    }
  }

  const filtered = useMemo(() => {
    return applications.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!a.job_title?.toLowerCase().includes(q) && 
            !a.applicant?.full_name?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [applications, statusFilter, searchQuery])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  )

  const statusColors: any = {
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    accepted: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rejected: 'text-red-400 bg-red-500/10 border-red-500/20'
  }
  const statusIcons: any = {
    pending: <Clock size={14} />,
    accepted: <CheckCircle2 size={14} />,
    rejected: <XCircle size={14} />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
            <Users size={24} className="text-emerald-400" /> Incoming Applications
          </h1>
          <p className="text-sm text-white/40 mt-1">Review verified student applications for your posted listings.</p>
        </motion.div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search applicants or job titles..." 
            className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/50" 
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white focus:outline-none">
          <option value="all">All Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((app, i) => {
            const stu = app.applicant?.student || {}
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 lg:p-6 flex flex-col md:flex-row md:items-center gap-6 hover:bg-white/[0.04] transition-all group overflow-hidden relative"
              >
                <div className="flex-1 flex items-start sm:items-center gap-5">
                  <ProfileAvatar 
                    profile={app.applicant} 
                    userId={app.student_id} 
                    size="lg" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-heading font-bold text-white text-lg">{app.applicant?.full_name || 'Applicant'}</h3>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-widest border ${statusColors[app.status || 'pending']}`}>
                        {statusIcons[app.status || 'pending']} {app.status || 'Pending'}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 md:gap-5 mt-2 text-xs text-white/50">
                      <p className="flex items-center gap-1.5 font-medium text-emerald-400">
                        <Briefcase size={14} /> Applied for: {app.job_title}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <GraduationCap size={14} /> {stu.course || 'Unknown'} {stu.branch ? `(${stu.branch})` : ''} 
                      </p>
                      {(stu.city || stu.state) && (
                        <p className="flex items-center gap-1.5">
                          <MapPin size={14} /> {[stu.city, stu.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {/* Mobile-visible trust score badge */}
                      <p className="flex lg:hidden items-center gap-1.5 font-bold" style={{ color: `hsl(${Math.min(120, (app.applicant?.trust_score || 0) * 1.2)}, 70%, 50%)` }}>
                        <Shield size={14} /> Trust: {app.applicant?.trust_score || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trust Metrics Section — Desktop only */}
                <div className="hidden lg:flex flex-col items-center justify-center px-8 border-l border-white/5">
                  <div className="text-center group">
                    <p className="text-3xl font-heading font-black" style={{ color: `hsl(${Math.min(120, (app.applicant?.trust_score || 0) * 1.2)}, 70%, 50%)` }}>
                      {app.applicant?.trust_score || 0}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 mt-1 flex items-center justify-center gap-1">
                      <Shield size={12} /> ATS Trust
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => updateStatus(app.id, 'accepted')}
                      disabled={app.status === 'accepted'}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500/10 text-xs font-bold transition-colors border border-emerald-500/20"
                    >
                      <CheckCircle2 size={16} /> Accept
                    </button>
                    <button 
                      onClick={() => updateStatus(app.id, 'rejected')}
                      disabled={app.status === 'rejected'}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 disabled:opacity-30 disabled:hover:bg-red-500/10 text-xs font-bold transition-colors border border-red-500/20"
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                  {app.company_notes && (
                    <div className="w-full text-xs text-white/40 bg-white/5 rounded-lg p-3 line-clamp-2 mt-2">
                      <span className="font-bold text-white/60 mb-1 block">Context:</span> {app.company_notes}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {filtered.length === 0 && (
          <div className="py-20 text-center rounded-2xl border border-white/5 bg-white/[0.01]">
            <Users size={48} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/70 font-heading text-lg font-bold">No applicants found</p>
            <p className="text-sm text-white/30 mt-1">Adjust your filters or wait for new applications.</p>
          </div>
        )}
      </div>
    </div>
  )
}

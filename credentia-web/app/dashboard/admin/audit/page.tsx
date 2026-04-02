'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollText, Search, Shield, UserCog, ToggleRight, BookmarkCheck, CheckCircle2, X as XIcon, Activity, Flame, Clock } from 'lucide-react'

const actionIcons: Record<string, any> = {
  change_role: UserCog,
  toggle_company_access: ToggleRight,
  save_candidate: BookmarkCheck,
  unsave_candidate: XIcon,
  bulk_approve: CheckCircle2,
  bulk_reject: XIcon,
}

const actionColors: Record<string, string> = {
  change_role: '#f59e0b',       // amber
  toggle_company_access: '#3b82f6', // blue
  save_candidate: '#10b981',    // emerald
  unsave_candidate: '#ef4444',  // red
  bulk_approve: '#22c55e',      // green
  bulk_reject: '#ef4444',       // red
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState('all')

  const load = async () => {
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200).then(({ data }) => {
      setLogs(data || [])
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
    // Subscribe to new audit logs
    const channel = supabase.channel('audit_log_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, payload => {
         setLogs(prev => [payload.new, ...prev].slice(0, 200))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const actions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)))

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!(l.action?.toLowerCase().includes(q) || l.actor_email?.toLowerCase().includes(q) || l.target_type?.toLowerCase().includes(q))) return false
      }
      if (filterAction !== 'all' && l.action !== filterAction) return false
      return true
    })
  }, [logs, searchQuery, filterAction])

  // Analytics for the top summary row
  const totalEvents = logs.length
  const todayEvents = logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length
  
  const mostFrequentAction = useMemo(() => {
    if (!logs.length) return { action: 'None', count: 0 }
    const counts = logs.reduce((acc, l) => { acc[l.action] = (acc[l.action] || 0) + 1; return acc }, {} as Record<string, number>)
    const max = Object.entries(counts).sort((a: any, b: any) => b[1]-a[1])[0]
    return { action: max[0].replace(/_/g, ' '), count: max[1] }
  }, [logs])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><ScrollText size={24} className="text-indigo-400" /> Audit Center</h1>
          <p className="text-sm text-white/40 mt-1">Review all administrative and system actions continuously.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Tracked Events', value: totalEvents, icon: Activity, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          { label: 'Events Today', value: todayEvents, icon: Flame, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Top Action', value: mostFrequentAction.action, sub: `${mostFrequentAction.count} times`, icon: Clock, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-2xl p-5 border border-white/5 bg-white/[0.02] flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: s.bg, color: s.color }}><s.icon size={24} /></div>
             <div>
               <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-0.5">{s.label}</p>
               <p className="font-heading text-xl font-bold text-white capitalize leading-tight truncate max-w-[150px]">{s.value}</p>
               {s.sub && <p className="text-[10px] text-white/30">{s.sub}</p>}
             </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-white/[0.01] border border-white/5">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search actor, target, or action..." className="w-full h-11 pl-11 pr-4 rounded-xl text-sm bg-white/[0.03] border border-white/5 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all" />
        </div>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="h-11 px-4 rounded-xl text-sm bg-white/[0.03] border border-white/5 text-white/70 focus:outline-none focus:border-indigo-500/50 cursor-pointer">
          <option value="all">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ').toUpperCase()}</option>)}
        </select>
      </motion.div>

      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <p className="text-xs font-bold text-white/30 uppercase tracking-widest pl-2">Timeline</p>
        <p className="text-[10px] text-indigo-400/80 bg-indigo-500/10 px-2 py-0.5 rounded font-bold">{filtered.length} Results</p>
      </div>

      {/* Timeline List */}
      <div className="relative pl-4 space-y-4 before:absolute before:inset-0 before:ml-[31px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Shield size={40} className="mx-auto mb-4 text-white/5" />
            <p className="text-white/40 font-medium font-heading">No audit logs match criteria</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((log, i) => {
              const Icon = actionIcons[log.action] || Shield
              const color = actionColors[log.action] || '#6366f1'
              
              const dt = new Date(log.created_at)
              const timeString = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              const dateString = dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

              return (
                <motion.div 
                  key={log.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.95, x: -10 }} 
                  animate={{ opacity: 1, scale: 1, x: 0 }} 
                  exit={{ opacity: 0, scale: 0.9, x: 10 }}
                  transition={{ delay: Math.min(i * 0.05, 0.5) }}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                >
                  {/* Timeline Dot */}
                  <div className="absolute left-[7px] md:left-1/2 md:-translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full border-4 border-[#0e0e14] bg-white z-10 scale-90 group-hover:scale-110 transition-transform shadow-[0_0_10px_rgba(255,255,255,0.1)]" style={{ backgroundColor: color }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0e0e14]" />
                  </div>

                  {/* Card Content */}
                  <div className="w-[calc(100%-40px)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:shadow-xl hover:border-white/10 transition-all flex flex-col md:flex-row gap-4 items-start group-hover:-translate-y-1">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, color }}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                         <p className="text-sm text-white/90 font-bold capitalize">{log.action?.replace(/_/g, ' ')}</p>
                         <div className="text-right flex flex-col items-end">
                            <span className="text-xs text-white/50 font-bold">{timeString}</span>
                            <span className="text-[9px] text-white/30 uppercase">{dateString}</span>
                         </div>
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-1.5 text-xs">
                           <span className="text-white/30 w-12 flex-shrink-0 font-medium">Actor:</span>
                           <span className="text-white/70 truncate px-1.5 py-0.5 rounded bg-white/5">{log.actor_email || 'system'}</span>
                        </div>
                        {log.target_type && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                             <span className="text-white/30 w-12 flex-shrink-0 font-medium">Target:</span>
                             <span className="text-white/50 uppercase tracking-widest">{log.target_type}</span>
                          </div>
                        )}
                      </div>

                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <code className="text-[10px] text-white/30 block whitespace-pre-wrap break-all font-mono leading-relaxed bg-[#0e0e14] p-2 rounded-lg border border-white/5 shadow-inner">
                            {JSON.stringify(log.details, null, 2)}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { ScrollText, Search, Shield, UserCog, ToggleRight, BookmarkCheck, CheckCircle2, X as XIcon } from 'lucide-react'

const actionIcons: Record<string, any> = {
  change_role: UserCog,
  toggle_company_access: ToggleRight,
  save_candidate: BookmarkCheck,
  unsave_candidate: XIcon,
  bulk_approve: CheckCircle2,
  bulk_reject: XIcon,
}

const actionColors: Record<string, string> = {
  change_role: '#f59e0b',
  toggle_company_access: '#3b82f6',
  save_candidate: '#10b981',
  unsave_candidate: '#ef4444',
  bulk_approve: '#22c55e',
  bulk_reject: '#ef4444',
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAction, setFilterAction] = useState('all')

  useEffect(() => {
    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200).then(({ data }) => {
      setLogs(data || [])
      setLoading(false)
    })
  }, [])

  const actions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)))

  const filtered = logs.filter(l => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!(l.action?.toLowerCase().includes(q) || l.actor_email?.toLowerCase().includes(q) || l.target_type?.toLowerCase().includes(q))) return false
    }
    if (filterAction !== 'all' && l.action !== filterAction) return false
    return true
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><ScrollText size={24} className="text-indigo-400" /> Audit Logs</h1>
        <p className="text-sm text-white/40 mt-1">Review all administrative actions performed on the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search logs..." className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50" />
        </div>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="h-11 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white/70 focus:outline-none">
          <option value="all">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <p className="text-xs text-white/30">{filtered.length} log entries</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
          <ScrollText size={40} className="mx-auto mb-4 text-white/10" />
          <p className="text-white/50 font-medium">No audit logs found</p>
          <p className="text-sm text-white/30 mt-1">Actions performed by admins will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log, i) => {
            const Icon = actionIcons[log.action] || Shield
            const color = actionColors[log.action] || '#6366f1'
            return (
              <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}15`, color }}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 font-medium">{log.action?.replace(/_/g, ' ')}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] text-white/30">
                    <span>By: {log.actor_email || 'system'}</span>
                    <span>Target: {log.target_type || '—'}</span>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <span>{Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' • ')}</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-white/20 flex-shrink-0 mt-1">{new Date(log.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { FileText, Shield, CreditCard, GraduationCap, CheckCircle2, Clock, AlertCircle, ExternalLink, Search, Filter, Download, Eye, X } from 'lucide-react'

type Verification = { id: string; type: string; status: string; ai_confidence: number; ai_result: any; document_url: string; created_at: string; updated_at: string }

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  resume: { label: 'Resume Analysis', icon: FileText, color: '#3b82f6' },
  police: { label: 'Police Verification', icon: Shield, color: '#8b5cf6' },
  aadhaar: { label: 'Aadhaar Verification', icon: CreditCard, color: '#14b8a6' },
  degree: { label: 'Degree Verification', icon: GraduationCap, color: '#f59e0b' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  ai_approved: { label: 'AI Verified', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  admin_verified: { label: 'Admin Verified', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  verified: { label: 'Verified', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  needs_review: { label: 'Needs Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  not_submitted: { label: 'Not Submitted', color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
}

export default function SavedVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedV, setSelectedV] = useState<Verification | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('verifications').select('*').eq('student_id', session.user.id).order('updated_at', { ascending: false })
      setVerifications(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = verifications.filter(v => {
    if (filterType !== 'all' && v.type !== filterType) return false
    if (filterStatus !== 'all' && v.status !== filterStatus) return false
    if (searchQuery) {
      const tc = typeConfig[v.type]
      if (!tc?.label.toLowerCase().includes(searchQuery.toLowerCase())) return false
    }
    return true
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">My Verifications</h1>
        <p className="text-sm mt-1 text-white/40">View all your saved verification records and detailed AI analysis reports.</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-4 border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search verifications..." className="w-full h-10 pl-10 pr-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50" />
        </div>
        <div className="flex gap-3">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-10 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white/70 focus:outline-none appearance-none cursor-pointer">
            <option value="all">All Types</option>
            <option value="resume">Resume</option>
            <option value="police">Police</option>
            <option value="aadhaar">Aadhaar</option>
            <option value="degree">Degree</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-10 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white/70 focus:outline-none appearance-none cursor-pointer">
            <option value="all">All Status</option>
            <option value="ai_approved">AI Verified</option>
            <option value="admin_verified">Admin Verified</option>
            <option value="pending">Pending</option>
            <option value="needs_review">Needs Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="text-xs text-white/30 px-1">{filtered.length} verification{filtered.length !== 1 ? 's' : ''} found</div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
          <FileText size={40} className="mx-auto mb-4 text-white/10" />
          <p className="text-white/50 font-medium">No verifications found</p>
          <p className="text-sm text-white/30 mt-1">Upload documents to start building your verified profile.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v, i) => {
            const tc = typeConfig[v.type] || { label: v.type, icon: FileText, color: '#fff' }
            const sc = statusConfig[v.status] || statusConfig.not_submitted
            const Icon = tc.icon
            return (
              <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer overflow-hidden"
                onClick={() => setSelectedV(v)}
              >
                <div className="flex items-center gap-4 p-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${tc.color}15`, color: tc.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white/90">{tc.label}</p>
                    <p className="text-xs text-white/30 mt-0.5">Last updated: {new Date(v.updated_at || v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {v.ai_confidence > 0 && <span className="text-xs text-white/30 hidden sm:block">{v.ai_confidence}% confidence</span>}
                    <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    <Eye size={14} className="text-white/20" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedV && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedV(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0e14] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {(() => { const Icon = typeConfig[selectedV.type]?.icon || FileText; return <Icon size={24} style={{ color: typeConfig[selectedV.type]?.color || '#fff' }} /> })()}
                <div>
                  <h3 className="font-heading font-bold text-lg text-white">{typeConfig[selectedV.type]?.label || selectedV.type}</h3>
                  <p className="text-xs text-white/30">ID: {selectedV.id.slice(0, 8)}...</p>
                </div>
              </div>
              <button onClick={() => setSelectedV(null)} className="p-2 rounded-lg hover:bg-white/5 text-white/30"><X size={20} /></button>
            </div>
            
            {/* Status and meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5"><p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Status</p><span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: statusConfig[selectedV.status]?.bg, color: statusConfig[selectedV.status]?.color }}>{statusConfig[selectedV.status]?.label || selectedV.status}</span></div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5"><p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Confidence</p><p className="text-sm font-bold text-white">{selectedV.ai_confidence}%</p></div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5"><p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Created</p><p className="text-xs text-white/70">{new Date(selectedV.created_at).toLocaleDateString('en-IN')}</p></div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5"><p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">Updated</p><p className="text-xs text-white/70">{new Date(selectedV.updated_at).toLocaleDateString('en-IN')}</p></div>
            </div>

            {/* Document link */}
            {selectedV.document_url && (
              <a href={selectedV.document_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-3 mb-6 rounded-xl bg-blue-500/5 border border-blue-500/15 text-blue-400 text-sm font-medium hover:bg-blue-500/10 transition-colors">
                <ExternalLink size={16} /> View Uploaded Document <span className="text-xs text-blue-400/50 ml-auto">Opens in new tab</span>
              </a>
            )}

            {/* AI Result */}
            {selectedV.ai_result && (
              <div>
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">AI Analysis Report</h4>
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-3">
                  {Object.entries(selectedV.ai_result).map(([key, value]) => {
                    if (value === null || value === undefined) return null
                    if (Array.isArray(value)) return (
                      <div key={key}><p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</p><div className="flex flex-wrap gap-1.5">{(value as string[]).map((item, i) => <span key={i} className="px-2 py-0.5 rounded text-[11px] bg-white/5 text-white/60 border border-white/5">{String(item)}</span>)}</div></div>
                    )
                    if (typeof value === 'object') return null
                    return (
                      <div key={key} className="flex items-center justify-between"><p className="text-xs text-white/40">{key.replace(/_/g, ' ')}</p><p className="text-sm text-white/80 font-medium">{String(value)}</p></div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Shield, Search, FileText, CreditCard, GraduationCap, CheckCircle2, Clock, AlertCircle, X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [selectedV, setSelectedV] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const [{ data: v }, { data: p }] = await Promise.all([
        supabase.from('verifications').select('*').order('updated_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, email'),
      ])
      setVerifications(v || [])
      setProfiles(p || [])
      setLoading(false)
    }
    load()
  }, [])

  const enriched = useMemo(() => {
    return verifications.map(v => {
      const prof = profiles.find(p => p.id === v.student_id)
      return { ...v, studentName: prof?.full_name || 'Unknown', studentEmail: prof?.email || '' }
    })
  }, [verifications, profiles])

  const filtered = useMemo(() => {
    return enriched.filter(v => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!(v.studentName?.toLowerCase().includes(q) || v.studentEmail?.toLowerCase().includes(q) || v.type?.includes(q))) return false
      }
      if (filterType !== 'all' && v.type !== filterType) return false
      if (filterStatus !== 'all' && v.status !== filterStatus) return false
      return true
    })
  }, [enriched, searchQuery, filterType, filterStatus])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const handleAction = async (vId: string, action: 'approve' | 'reject') => {
    setActionLoading(prev => ({ ...prev, [vId]: true }))
    try {
      const res = await fetch('/api/admin/police-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId: vId, action })
      })
      if (res.ok) {
        const newStatus = action === 'approve' ? 'admin_verified' : 'rejected'
        setVerifications(prev => prev.map(v => v.id === vId ? { ...v, status: newStatus } : v))
      }
    } catch {}
    setActionLoading(prev => ({ ...prev, [vId]: false }))
  }

  const statusColors: Record<string, { c: string; bg: string; l: string }> = {
    ai_approved: { c: '#22c55e', bg: 'rgba(34,197,94,0.08)', l: 'AI Verified' },
    admin_verified: { c: '#22c55e', bg: 'rgba(34,197,94,0.08)', l: 'Admin OK' },
    verified: { c: '#22c55e', bg: 'rgba(34,197,94,0.08)', l: 'Verified' },
    pending: { c: '#f59e0b', bg: 'rgba(245,158,11,0.08)', l: 'Pending' },
    needs_review: { c: '#f59e0b', bg: 'rgba(245,158,11,0.08)', l: 'Review' },
    rejected: { c: '#ef4444', bg: 'rgba(239,68,68,0.08)', l: 'Rejected' },
  }

  const typeIcons: Record<string, any> = { resume: FileText, police: Shield, aadhaar: CreditCard, degree: GraduationCap }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">All Verifications</h1>
        <p className="text-sm text-white/40 mt-1">Manage every verification record across the platform. Total: {verifications.length}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1) }} placeholder="Search by student name or email..." className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50" />
        </div>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }} className="h-11 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white/70 focus:outline-none">
          <option value="all">All Types</option>
          <option value="resume">Resume</option>
          <option value="police">Police</option>
          <option value="aadhaar">Aadhaar</option>
          <option value="degree">Degree</option>
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }} className="h-11 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white/70 focus:outline-none">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="needs_review">Needs Review</option>
          <option value="ai_approved">AI Verified</option>
          <option value="admin_verified">Admin Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <p className="text-xs text-white/30">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0e0e14]">
              <tr>{['Student', 'Type', 'Status', 'Confidence', 'Document', 'Updated', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map(v => {
                const sc = statusColors[v.status] || { c: '#64748b', bg: 'rgba(100,116,139,0.08)', l: v.status }
                const Icon = typeIcons[v.type] || FileText
                const isPending = ['pending', 'needs_review'].includes(v.status)
                return (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3"><p className="text-xs text-white/80 font-medium">{v.studentName}</p><p className="text-[10px] text-white/30">{v.studentEmail}</p></td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1.5 text-xs text-white/60"><Icon size={14} /> <span className="capitalize">{v.type}</span></span></td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase" style={{ background: sc.bg, color: sc.c }}>{sc.l}</span></td>
                    <td className="px-4 py-3 text-xs text-white/50">{v.ai_confidence}%</td>
                    <td className="px-4 py-3">{v.document_url ? <a href={v.document_url} target="_blank" rel="noreferrer" className="text-blue-400 text-xs flex items-center gap-1"><ExternalLink size={12} /> View</a> : <span className="text-white/20 text-xs">—</span>}</td>
                    <td className="px-4 py-3 text-[10px] text-white/40">{new Date(v.updated_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      {isPending ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => handleAction(v.id, 'approve')} disabled={actionLoading[v.id]} className="px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">✓</button>
                          <button onClick={() => handleAction(v.id, 'reject')} disabled={actionLoading[v.id]} className="px-2.5 py-1 rounded text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50">✗</button>
                        </div>
                      ) : (
                        <button onClick={() => setSelectedV(v)} className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded hover:bg-blue-500/20 transition-colors">Details</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {paginated.length === 0 && <div className="p-12 text-center text-white/30 text-sm">No verifications found.</div>}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 disabled:opacity-30"><ChevronLeft size={14} /></button>
          <span className="text-xs text-white/30">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 disabled:opacity-30"><ChevronRight size={14} /></button>
        </div>
      )}

      {/* Detail modal */}
      {selectedV && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedV(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0e14] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-heading font-bold text-white capitalize">{selectedV.type} Verification</p>
              <button onClick={() => setSelectedV(null)} className="p-2 rounded-lg hover:bg-white/5 text-white/30"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[{ l: 'Student', v: selectedV.studentName }, { l: 'Status', v: selectedV.status.replace(/_/g, ' ') }, { l: 'Confidence', v: `${selectedV.ai_confidence}%` }, { l: 'Updated', v: new Date(selectedV.updated_at).toLocaleString('en-IN') }].map((d, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-[9px] text-white/25 uppercase mb-0.5">{d.l}</p>
                  <p className="text-sm text-white/80">{d.v}</p>
                </div>
              ))}
            </div>
            {selectedV.document_url && <a href={selectedV.document_url} target="_blank" className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl bg-blue-500/5 border border-blue-500/15 text-blue-400 text-sm hover:bg-blue-500/10 transition-colors"><ExternalLink size={14} /> View Document</a>}
            {selectedV.ai_result && (
              <div>
                <h4 className="text-xs font-bold text-white/40 uppercase mb-2">AI Result</h4>
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-2">
                  {Object.entries(selectedV.ai_result).filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object').map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span className="text-xs text-white/40">{k.replace(/_/g, ' ')}</span><span className="text-sm text-white/80">{String(v)}</span></div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

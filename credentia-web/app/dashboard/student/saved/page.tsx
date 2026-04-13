'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { FileText, Shield, CreditCard, GraduationCap, CheckCircle2, Clock, AlertCircle, ExternalLink, Search, Eye, X, BookOpen, Paperclip, Star } from 'lucide-react'

type Verification = { id: string; type: string; status: string; ai_confidence: number; ai_result: any; document_url: string; created_at: string; updated_at: string }
type Document = { id: string; document_type: string; file_url: string; file_name: string | null; file_size: number | null; status: string; uploaded_at: string }

const typeConfig: Record<string, { label: string; icon: any; color: string; group: string }> = {
  resume: { label: 'Resume Analysis', icon: FileText, color: '#3b82f6', group: 'AI Verified' },
  police: { label: 'Police Verification', icon: Shield, color: '#8b5cf6', group: 'AI Verified' },
  aadhaar: { label: 'Aadhaar Verification', icon: CreditCard, color: '#14b8a6', group: 'AI Verified' },
  degree: { label: 'Degree Certificate', icon: GraduationCap, color: '#f59e0b', group: 'AI Verified' },
  marksheet_10th: { label: '10th Class Marksheet', icon: BookOpen, color: '#3b82f6', group: 'Uploaded' },
  marksheet_12th: { label: '12th Class Marksheet', icon: FileText, color: '#8b5cf6', group: 'Uploaded' },
  passport: { label: 'Other Credential', icon: Paperclip, color: '#14b8a6', group: 'Uploaded' },
  pan: { label: 'PAN Card', icon: CreditCard, color: '#f59e0b', group: 'Uploaded' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  ai_approved: { label: 'AI Verified', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  admin_verified: { label: 'Admin Verified', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  verified: { label: 'Verified', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  pending: { label: 'Pending Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  needs_review: { label: 'Needs Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  not_submitted: { label: 'Not Submitted', color: '#64748b', bg: 'rgba(100,116,139,0.08)' },
  under_review: { label: 'Under Review', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
}

export default function SavedVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedV, setSelectedV] = useState<Verification | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const uid = session.user.id

      const [{ data: v }, { data: d }] = await Promise.all([
        supabase.from('verifications').select('*').eq('student_id', uid).order('updated_at', { ascending: false }),
        supabase.from('documents').select('*').eq('user_id', uid).order('uploaded_at', { ascending: false }),
      ])

      setVerifications(v || [])
      // Filter out documents that already have a corresponding verification entry
      // (to avoid duplicates for degree/police/aadhaar which appear in both tables)
      const verifTypes = new Set((v || []).map(x => x.type))
      const docTypeMap: Record<string, string> = { degree: 'degree', police: 'police', aadhaar: 'aadhaar', resume: 'resume' }
      const filteredDocs = (d || []).filter(doc => !docTypeMap[doc.document_type] || !verifTypes.has(docTypeMap[doc.document_type]))
      setDocuments(filteredDocs)
      setLoading(false)
    }
    load()
  }, [])

  // Merge verifications + document-only entries into a unified list
  const allItems = [
    ...verifications.map(v => ({ ...v, _source: 'verification' as const })),
    // Documents that don't have a matching verification
    ...documents.map(d => ({
      id: d.id,
      type: d.document_type,
      status: d.status,
      ai_confidence: 0,
      ai_result: { file_name: d.file_name, uploaded_at: d.uploaded_at },
      document_url: d.file_url,
      created_at: d.uploaded_at,
      updated_at: d.uploaded_at,
      _source: 'document' as const,
    })),
  ]

  const filtered = allItems.filter(v => {
    if (filterType !== 'all' && v.type !== filterType) return false
    if (filterStatus !== 'all' && v.status !== filterStatus) return false
    if (searchQuery) {
      const tc = typeConfig[v.type]
      if (!tc?.label.toLowerCase().includes(searchQuery.toLowerCase())) return false
    }
    return true
  })

  const verifiedCount = verifications.filter(v => ['ai_approved', 'admin_verified', 'verified'].includes(v.status)).length

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">My Verifications</h1>
        <p className="text-sm mt-1 text-white/40">All your saved verification records, documents, and detailed AI analysis reports.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: allItems.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
          { label: 'AI Verified', value: verifiedCount, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
          { label: 'Pending', value: allItems.filter(v => ['pending', 'needs_review', 'under_review'].includes(v.status)).length, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
          { label: 'Documents', value: verifications.length + documents.length, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-xl p-4 border border-white/5"
            style={{ background: s.bg }}
          >
            <p className="font-heading text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
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
            <option value="marksheet_10th">10th Marksheet</option>
            <option value="marksheet_12th">12th Marksheet</option>
            <option value="passport">Other Credential</option>
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
      <div className="text-xs text-white/30 px-1">{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
          <FileText size={40} className="mx-auto mb-4 text-white/10" />
          <p className="text-white/50 font-medium">No verifications found</p>
          <p className="text-sm text-white/30 mt-1">Upload documents to start building your verified profile.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v, i) => {
            const tc = typeConfig[v.type] || { label: v.type, icon: FileText, color: '#fff', group: '' }
            const sc = statusConfig[v.status] || statusConfig.not_submitted
            const Icon = tc.icon
            const isVerif = (v as any)._source === 'verification'
            return (
              <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer overflow-hidden"
                onClick={() => isVerif ? setSelectedV(v as Verification) : null}
              >
                <div className="flex items-center gap-4 p-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${tc.color}15`, color: tc.color }}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white/90">{tc.label}</p>
                      {tc.group && (
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold"
                          style={{ background: tc.group === 'AI Verified' ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.05)', color: tc.group === 'AI Verified' ? '#a78bfa' : 'rgba(255,255,255,0.3)' }}>
                          {tc.group}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">
                      {isVerif
                        ? `Last updated: ${new Date(v.updated_at || v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                        : `Uploaded: ${new Date(v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {(v as any).ai_confidence > 0 && <span className="text-xs text-white/30 hidden sm:block">{(v as any).ai_confidence}% confidence</span>}
                    <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                    {v.document_url && (
                      <a href={v.document_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="View Document">
                        <ExternalLink size={13} className="text-white/30 hover:text-blue-400" />
                      </a>
                    )}
                    {isVerif && <Eye size={14} className="text-white/20" />}
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
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Analysis Report</h4>
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-5 space-y-5">
                  {(() => {
                    const r = selectedV.ai_result
                    const vType = selectedV.type

                    // ── Resume ──
                    if (vType === 'resume') {
                      return (
                        <>
                          {/* ATS Score Hero */}
                          {r.ats_score !== undefined && (
                            <div className="flex items-center gap-5 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <div className="relative w-20 h-20 flex-shrink-0">
                                <svg className="w-20 h-20 -rotate-90"><circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" /><circle cx="40" cy="40" r="34" stroke={Number(r.ats_score) >= 70 ? '#22c55e' : Number(r.ats_score) >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="5" fill="none" strokeDasharray={`${2*Math.PI*34}`} strokeDashoffset={`${2*Math.PI*34*(1-Number(r.ats_score||0)/100)}`} strokeLinecap="round" /></svg>
                                <span className="absolute inset-0 flex items-center justify-center font-bold text-xl text-white">{r.ats_score}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white mb-1">ATS Compatibility Score</p>
                                <p className="text-xs text-white/35 leading-relaxed">{r.summary || 'Your resume has been analyzed for ATS compatibility.'}</p>
                              </div>
                            </div>
                          )}

                          {/* Info Grid  */}
                          {(r.student_name || r.phone_number || r.cgpa || r.branch || r.course || r.city) && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {[
                                { l: 'Name', v: r.student_name },
                                { l: 'Phone', v: r.phone_number },
                                { l: 'CGPA', v: r.cgpa },
                                { l: 'Branch', v: r.branch },
                                { l: 'Course', v: r.course },
                                { l: 'City', v: r.city },
                              ].filter(x => x.v).map((x, i) => (
                                <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                  <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">{x.l}</p>
                                  <p className="text-sm text-white/80 font-medium truncate">{x.v}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Strengths */}
                          {r.strengths?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">✅ Strengths</p>
                              <div className="flex flex-wrap gap-2">
                                {r.strengths.map((s: string, i: number) => (
                                  <span key={i} className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/8 text-emerald-300/90 border border-emerald-500/15">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Top Skills */}
                          {r.top_skills?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">🎯 Top Skills</p>
                              <div className="flex flex-wrap gap-2">
                                {r.top_skills.map((s: string, i: number) => (
                                  <span key={i} className="px-3 py-1.5 rounded-lg text-xs bg-blue-500/8 text-blue-300/90 border border-blue-500/15 font-medium">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Improvements */}
                          {r.improvements?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">💡 Improvements</p>
                              <div className="flex flex-wrap gap-2">
                                {r.improvements.map((s: string, i: number) => (
                                  <span key={i} className="px-3 py-1.5 rounded-lg text-xs bg-amber-500/8 text-amber-300/90 border border-amber-500/15">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Keywords */}
                          {r.keywords_found?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-2">🔑 Keywords Found</p>
                              <div className="flex flex-wrap gap-1.5">
                                {r.keywords_found.map((k: string, i: number) => (
                                  <span key={i} className="px-2.5 py-1 rounded-md text-[11px] bg-violet-500/8 text-violet-300/80 border border-violet-500/10">{k}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )
                    }

                    // ── Degree ──
                    if (vType === 'degree') {
                      return (
                        <>
                          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {r.verified ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-amber-400" />}
                            <span className="text-sm font-semibold text-white">{r.verified ? 'Degree Verified' : 'Pending Verification'}</span>
                            {r.confidence && <span className="text-xs text-white/30 ml-auto">{r.confidence}% confidence</span>}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { l: 'University', v: r.university_name },
                              { l: 'Degree', v: r.degree },
                              { l: 'Course', v: r.course },
                              { l: 'Year of Passing', v: r.year_of_passing },
                              { l: 'CGPA / Grade', v: r.grade_cgpa },
                              { l: 'Roll Number', v: r.roll_number },
                            ].filter(x => x.v).map((x, i) => (
                              <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">{x.l}</p>
                                <p className="text-sm text-white/80 font-medium">{x.v}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )
                    }

                    // ── Police ──
                    if (vType === 'police') {
                      return (
                        <>
                          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {r.is_police_certificate ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-amber-400" />}
                            <span className="text-sm font-semibold text-white">{r.is_police_certificate ? 'Valid Police Certificate' : 'Not Recognized'}</span>
                            {r.confidence && <span className="text-xs text-white/30 ml-auto">{r.confidence}% confidence</span>}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { l: 'Certificate #', v: r.certificate_number },
                              { l: 'Authority', v: r.issuing_authority },
                              { l: 'Applicant', v: r.applicant_name },
                              { l: 'District', v: r.district },
                              { l: 'State', v: r.state },
                              { l: 'Issue Date', v: r.issue_date },
                            ].filter(x => x.v).map((x, i) => (
                              <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">{x.l}</p>
                                <p className="text-sm text-white/80 font-medium">{x.v}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )
                    }

                    // ── Aadhaar ──
                    if (vType === 'aadhaar') {
                      return (
                        <>
                          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {r.verified ? <CheckCircle2 size={18} className="text-emerald-400" /> : <AlertCircle size={18} className="text-amber-400" />}
                            <span className="text-sm font-semibold text-white">{r.verified ? 'Aadhaar Verified' : 'Pending Verification'}</span>
                            {r.confidence && <span className="text-xs text-white/30 ml-auto">{r.confidence}% confidence</span>}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { l: 'Name', v: r.name },
                              { l: 'Date of Birth', v: r.dob },
                              { l: 'Gender', v: r.gender },
                              { l: 'State', v: r.state },
                              { l: 'Aadhaar', v: r.aadhaar_last4 ? `XXXX-XXXX-${r.aadhaar_last4}` : null },
                            ].filter(x => x.v).map((x, i) => (
                              <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">{x.l}</p>
                                <p className="text-sm text-white/80 font-medium">{x.v}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )
                    }

                    // ── Fallback: generic display for marksheets/other ──
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(r).filter(([, val]) => val !== null && val !== undefined && typeof val !== 'object').map(([key, value]) => (
                          <div key={key} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1">{key.replace(/_/g, ' ')}</p>
                            <p className="text-sm text-white/80 font-medium break-words">{String(value)}</p>
                          </div>
                        ))}
                        {Object.entries(r).filter(([, val]) => Array.isArray(val)).map(([key, value]) => (
                          <div key={key} className="col-span-full">
                            <p className="text-[9px] text-white/25 uppercase tracking-wider mb-2">{key.replace(/_/g, ' ')}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {(value as string[]).map((item, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-md text-[11px] bg-white/5 text-white/60 border border-white/5">{String(item)}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

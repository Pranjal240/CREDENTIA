'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { BookmarkCheck, Trash2, Shield, CreditCard, GraduationCap, Mail, Users, Eye, X } from 'lucide-react'

export default function SavedCandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      const { data: saved } = await supabase.from('saved_candidates').select('student_id, created_at').eq('company_id', session.user.id).order('created_at', { ascending: false })
      if (saved && saved.length > 0) {
        const ids = saved.map((s: any) => s.student_id)
        const { data: students } = await supabase.from('students').select('*, profiles(email)').in('id', ids)
        const mappedStudents = (students || []).map((st: any) => ({
          ...st,
          email: st.profiles?.email || '',
        }))
        const merged = saved.map((s: any) => ({ ...s, student: mappedStudents.find((st: any) => st.id === s.student_id) })).filter((s: any) => s.student)
        setCandidates(merged)
      }
      setLoading(false)
    }
    load()
  }, [])

  const removeSaved = async (studentId: string) => {
    const res = await fetch('/api/company/save-candidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: userId, studentId, action: 'unsave' }),
    })
    if (res.ok) setCandidates(prev => prev.filter(c => c.student_id !== studentId))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><BookmarkCheck size={24} className="text-emerald-400" /> Saved Candidates</h1>
        <p className="text-sm mt-1 text-white/40">Your bookmarked candidates for quick access and comparison.</p>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
          <Users size={40} className="mx-auto mb-4 text-white/10" />
          <p className="text-white/50 font-medium">No saved candidates yet</p>
          <p className="text-sm text-white/30 mt-1">Browse the Talent Search to find and bookmark candidates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((c, i) => {
            const s = c.student
            return (
              <motion.div key={c.student_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-4 group hover:bg-white/[0.04] transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-300 font-bold text-sm flex-shrink-0">{(s.name || 'C')[0].toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-white text-sm">{s.name || 'Candidate'}</p>
                  <p className="text-xs text-white/30">{s.course || 'N/A'} • Year: {s.graduation_year || '—'} • ATS: {s.ats_score || 0}</p>
                  <div className="flex gap-1 mt-1.5">
                    {[{ ok: s.police_verified, l: 'PCC' }, { ok: s.aadhaar_verified, l: 'KYC' }, { ok: s.degree_verified, l: 'DEG' }].map((b, j) => (
                      <span key={j} className={`text-[7px] uppercase font-bold px-1.5 py-0.5 rounded border ${b.ok ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/[0.03] text-white/20'}`}>{b.l}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-white/20 hidden sm:block">Saved {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  <button onClick={() => setSelectedStudent(s)} className="px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors"><Eye size={14} /></button>
                  {s.email && <a href={`mailto:${s.email}`} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/70 transition-colors"><Mail size={14} /></a>}
                  <button onClick={() => removeSaved(c.student_id)} className="px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10 text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Quick detail modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedStudent(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0e0e14] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-heading font-bold text-white">{selectedStudent.name || 'Candidate'}</p>
              <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-lg hover:bg-white/5 text-white/30"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[{ l: 'Course', v: selectedStudent.course }, { l: 'CGPA', v: selectedStudent.cgpa }, { l: 'Year', v: selectedStudent.graduation_year }, { l: 'ATS', v: selectedStudent.ats_score }, { l: 'City', v: selectedStudent.city }, { l: 'State', v: selectedStudent.state }].map((d, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <p className="text-[9px] text-white/25 uppercase mb-0.5">{d.l}</p>
                  <p className="text-sm text-white/80">{d.v || '—'}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

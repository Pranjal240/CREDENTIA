'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Shield, CreditCard, GraduationCap, Link2, TrendingUp, Eye, CheckCircle2, Clock, AlertCircle, ArrowRight, Sparkles, ExternalLink, X, Download, ChevronDown, ChevronUp, Building, FolderOpen, Settings } from 'lucide-react'

export default function StudentDashboard() {
  const [student, setStudent] = useState<any>(null)
  const [verifications, setVerifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [universityName, setUniversityName] = useState<string | null>(null)
  const [docCount, setDocCount] = useState(0)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const uid = session.user.id
      setUserId(uid)
      const [{ data: s }, { data: v }, { data: docs }] = await Promise.all([
        supabase.from('students').select('*, profiles(email, linked_university_id)').eq('id', uid).single(),
        supabase.from('verifications').select('*').eq('student_id', uid).order('updated_at', { ascending: false }),
        supabase.from('documents').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      ])
      setStudent(s)
      setVerifications(v || [])
      // Fetch university name if linked
      const uniId = s?.university_id || s?.profiles?.linked_university_id
      if (uniId) {
        const { data: uni } = await supabase.from('profiles').select('full_name').eq('id', uniId).single()
        setUniversityName(uni?.full_name || null)
      }
      setDocCount((docs as any)?.count || 0)
      setLoading(false)
    }
    load()

    // Realtime: re-fetch when verifications OR student row changes
    const channel = supabase
      .channel('student-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) return
          supabase.from('verifications').select('*').eq('student_id', session.user.id).order('updated_at', { ascending: false })
            .then(({ data: v }) => { if (v) setVerifications(v) })
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students' }, () => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) return
          supabase.from('students').select('*, profiles(email, linked_university_id)').eq('id', session.user.id).single()
            .then(({ data: s }) => { if (s) setStudent(s) })
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const getStatus = (type: string) => {
    const v = verifications.find(x => x.type === type)
    if (!v || v.status === 'not_submitted') return { label: 'Upload Now', color: '#6366f1', bgColor: 'rgba(99,102,241,0.08)', icon: AlertCircle, ready: false, status: 'not_submitted' }
    if (v.status === 'pending' || v.status === 'needs_review') return { label: 'Pending Review', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.08)', icon: Clock, ready: false, status: v.status }
    if (v.status === 'ai_approved' || v.status === 'admin_verified' || v.status === 'verified') return { label: 'Verified ✓', color: '#22c55e', bgColor: 'rgba(34,197,94,0.08)', icon: CheckCircle2, ready: true, status: v.status }
    if (v.status === 'rejected') return { label: 'Rejected', color: '#ef4444', bgColor: 'rgba(239,68,68,0.08)', icon: AlertCircle, ready: false, status: v.status }
    return { label: 'Not Submitted', color: '#ef4444', bgColor: 'rgba(239,68,68,0.08)', icon: AlertCircle, ready: false, status: v.status }
  }

  const getVerification = (type: string) => verifications.find(x => x.type === type)

  const verifiedCount = verifications.filter(v => ['ai_approved', 'admin_verified', 'verified'].includes(v.status)).length
  const totalDocs = verifications.length
  const trustScore = student?.trust_score ?? 0

  const tasks = [
    { type: 'resume', label: 'Resume Analysis', desc: 'Get your ATS score with AI-powered analysis', icon: FileText, href: '/dashboard/student/resume', accent: '#3b82f6', gradient: 'from-blue-600/20 to-blue-400/5' },
    { type: 'police', label: 'Police Verification', desc: 'Upload PCC or paste verification link', icon: Shield, href: '/dashboard/student/police', accent: '#8b5cf6', gradient: 'from-violet-600/20 to-violet-400/5' },
    { type: 'aadhaar', label: 'Aadhaar Verification', desc: 'Privacy-first identity card verification', icon: CreditCard, href: '/dashboard/student/aadhaar', accent: '#14b8a6', gradient: 'from-teal-600/20 to-teal-400/5' },
    { type: 'degree', label: 'Degree Verification', desc: 'Upload degree certificate for AI check', icon: GraduationCap, href: '/dashboard/student/degree', accent: '#f59e0b', gradient: 'from-amber-600/20 to-amber-400/5' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs text-white/30 tracking-wider">LOADING DASHBOARD...</span>
        </div>
      </div>
    )
  }

  const renderAnalysisDetail = (type: string, v: any) => {
    if (!v || !v.ai_result) return <p className="text-sm text-white/30">No analysis data available yet.</p>
    const r = v.ai_result

    if (type === 'resume') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90"><circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" /><circle cx="40" cy="40" r="34" stroke={r.ats_score >= 70 ? '#22c55e' : r.ats_score >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="5" fill="none" strokeDasharray={`${2*Math.PI*34}`} strokeDashoffset={`${2*Math.PI*34*(1-(r.ats_score||0)/100)}`} strokeLinecap="round" /></svg>
              <span className="absolute inset-0 flex items-center justify-center font-bold text-lg text-white">{r.ats_score || 0}</span>
            </div>
            <div><p className="text-sm text-white/80 font-medium">ATS Score</p><p className="text-xs text-white/30">{r.summary || 'Resume analyzed successfully'}</p></div>
          </div>
          {r.strengths?.length > 0 && (
            <div><p className="text-xs font-bold text-green-400 mb-1">✅ Strengths</p><ul className="space-y-1">{r.strengths.slice(0,3).map((s: string, i: number) => <li key={i} className="text-xs text-white/50 flex gap-2"><CheckCircle2 size={12} className="mt-0.5 text-green-400 shrink-0" />{s}</li>)}</ul></div>
          )}
          {r.improvements?.length > 0 && (
            <div><p className="text-xs font-bold text-amber-400 mb-1">💡 Improvements</p><ul className="space-y-1">{r.improvements.slice(0,3).map((s: string, i: number) => <li key={i} className="text-xs text-white/50 flex gap-2"><AlertCircle size={12} className="mt-0.5 text-amber-400 shrink-0" />{s}</li>)}</ul></div>
          )}
          {r.keywords_found?.length > 0 && (
            <div><p className="text-xs font-bold text-blue-400 mb-1">🔑 Keywords</p><div className="flex flex-wrap gap-1.5">{r.keywords_found.slice(0,8).map((k: string, i: number) => <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-300">{k}</span>)}</div></div>
          )}
        </div>
      )
    }
    if (type === 'police') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">{r.is_police_certificate ? <CheckCircle2 size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-red-400" />}<span className="text-sm font-medium text-white/80">{r.is_police_certificate ? 'Valid Certificate' : 'Not Recognized'}</span><span className="text-xs text-white/30 ml-auto">Confidence: {r.confidence || v.ai_confidence}%</span></div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[{ l: 'Certificate #', v: r.certificate_number }, { l: 'Authority', v: r.issuing_authority }, { l: 'District', v: r.district }, { l: 'State', v: r.state }, { l: 'Issued', v: r.issue_date }, { l: 'Name', v: r.applicant_name }].filter(x => x.v).map((x, i) => <div key={i}><p className="text-white/25 uppercase tracking-wider text-[9px] mb-0.5">{x.l}</p><p className="text-white/70 font-medium">{x.v}</p></div>)}
          </div>
        </div>
      )
    }
    if (type === 'aadhaar') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">{r.verified ? <CheckCircle2 size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-red-400" />}<span className="text-sm font-medium text-white/80">{r.verified ? 'Aadhaar Verified' : 'Inconclusive'}</span><span className="text-xs text-white/30 ml-auto">Confidence: {r.confidence || v.ai_confidence}%</span></div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[{ l: 'Name', v: r.name }, { l: 'DOB', v: r.dob }, { l: 'Gender', v: r.gender }, { l: 'State', v: r.state }, { l: 'Aadhaar', v: r.aadhaar_last4 ? `XXXX-XXXX-${r.aadhaar_last4}` : null }].filter(x => x.v).map((x, i) => <div key={i}><p className="text-white/25 uppercase tracking-wider text-[9px] mb-0.5">{x.l}</p><p className="text-white/70 font-medium">{x.v}</p></div>)}
          </div>
        </div>
      )
    }
    if (type === 'degree') {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">{r.verified ? <CheckCircle2 size={16} className="text-green-400" /> : <AlertCircle size={16} className="text-red-400" />}<span className="text-sm font-medium text-white/80">{r.verified ? 'Degree Verified' : 'Inconclusive'}</span><span className="text-xs text-white/30 ml-auto">Confidence: {r.confidence || v.ai_confidence}%</span></div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[{ l: 'University', v: r.university_name }, { l: 'Degree', v: r.degree }, { l: 'Course', v: r.course }, { l: 'Year', v: r.year_of_passing }, { l: 'CGPA/Grade', v: r.grade_cgpa }, { l: 'Roll No.', v: r.roll_number }].filter(x => x.v).map((x, i) => <div key={i}><p className="text-white/25 uppercase tracking-wider text-[9px] mb-0.5">{x.l}</p><p className="text-white/70 font-medium">{x.v}</p></div>)}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white mb-1">Student Dashboard</h1>
          <p className="text-sm text-white/40">Track your verification progress and manage your digital credentials.</p>
        </div>
        {/* Progress bar */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 w-full sm:w-72">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white/50">Profile Completion</span>
            <span className="text-xs font-bold text-emerald-400">{trustScore}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${trustScore}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" />
          </div>
          <p className="text-[10px] text-white/25 mt-1.5">{verifiedCount} document{verifiedCount !== 1 ? 's' : ''} verified{totalDocs > verifiedCount ? ` · ${totalDocs - verifiedCount} pending` : ''}</p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ATS Score', value: getVerification('resume')?.ai_result?.ats_score || student?.ats_score || '—', icon: TrendingUp, suffix: getVerification('resume')?.ai_result?.ats_score || student?.ats_score ? '/100' : '', gradient: 'from-blue-600/20 to-blue-400/5', iconColor: '#60a5fa', border: 'rgba(59,130,246,0.15)' },
          { label: 'Verified', value: verifiedCount, icon: CheckCircle2, suffix: ` doc${verifiedCount !== 1 ? 's' : ''}`, gradient: 'from-emerald-600/20 to-emerald-400/5', iconColor: '#34d399', border: 'rgba(34,197,94,0.15)' },
          { label: 'Profile Views', value: student?.profile_views || 0, icon: Eye, suffix: '', gradient: 'from-violet-600/20 to-violet-400/5', iconColor: '#a78bfa', border: 'rgba(139,92,246,0.15)' },
          { label: 'Trust Score', value: trustScore, icon: Shield, suffix: '%', gradient: 'from-teal-600/20 to-teal-400/5', iconColor: '#2dd4bf', border: 'rgba(20,184,166,0.15)' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`relative rounded-2xl p-5 overflow-hidden bg-gradient-to-br ${stat.gradient}`}
            style={{ border: `1px solid ${stat.border}` }}
          >
            <div className="flex items-start justify-between mb-3">
              <stat.icon size={20} style={{ color: stat.iconColor }} />
            </div>
            <p className="font-heading text-2xl font-bold text-white">
              {stat.value}
              <span className="text-sm font-normal text-white/25 ml-0.5">{stat.suffix}</span>
            </p>
            <p className="text-[11px] mt-1 text-white/30 uppercase tracking-wider font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── My University + My Documents quick cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* My University */}
        <Link href="/dashboard/student/settings"
          className="group flex items-center gap-4 p-4 rounded-2xl transition-all hover:translate-y-[-2px]"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))', border: '1px solid rgba(99,102,241,0.15)' }}
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <Building size={20} className="text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium">My University</p>
            <p className="text-sm font-semibold text-white/90 truncate mt-0.5">
              {universityName || (
                <span className="text-amber-400/70">Not linked — click to set up</span>
              )}
            </p>
          </div>
          {universityName ? (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 realtime-dot" /> Active
            </span>
          ) : (
            <Settings size={14} className="text-white/15 flex-shrink-0" />
          )}
        </Link>

        {/* My Documents */}
        <Link href="/dashboard/student/degree"
          className="group flex items-center gap-4 p-4 rounded-2xl transition-all hover:translate-y-[-2px]"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.04))', border: '1px solid rgba(245,158,11,0.15)' }}
        >
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <FolderOpen size={20} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium">My Documents</p>
            <p className="text-sm font-semibold text-white/90 mt-0.5">
              {docCount > 0 ? `${docCount} document${docCount !== 1 ? 's' : ''} uploaded` : 'No documents yet'}
            </p>
          </div>
          <ArrowRight size={14} className="text-white/15 group-hover:text-amber-400 transition-colors flex-shrink-0" />
        </Link>
      </div>

      {/* ── Verification Checklist with Expandable Details ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-blue-400" />
          <h2 className="font-heading font-bold text-white text-sm">Verification Checklist</h2>
          <span className="text-xs text-white/20 ml-auto">Click to expand details</span>
        </div>

        <div className="space-y-3">
          {tasks.map((task, i) => {
            const status = getStatus(task.type)
            const v = getVerification(task.type)
            const isExpanded = expandedCard === task.type
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {/* Main row - always visible */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer group transition-all hover:bg-white/[0.02]"
                  onClick={() => setExpandedCard(isExpanded ? null : task.type)}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110" style={{ background: `${task.accent}15`, color: task.accent }}>
                    <task.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{task.label}</p>
                    <p className="text-xs text-white/30 mt-0.5">{task.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: status.bgColor, color: status.color }}>
                      {status.label}
                    </span>
                    {isExpanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                  </div>
                </div>

                {/* Expandable detail section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="pt-4">
                          {v ? renderAnalysisDetail(task.type, v) : (
                            <p className="text-sm text-white/30">No verification data yet. Upload your document to get started.</p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Link href={task.href} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:translate-y-[-1px]" style={{ background: `${task.accent}15`, color: task.accent, border: `1px solid ${task.accent}30` }}>
                            {v ? 'Re-upload / View' : 'Upload Now'} <ArrowRight size={12} />
                          </Link>
                          {v?.document_url && (
                            <a href={v.document_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-colors">
                              <ExternalLink size={12} /> View Uploaded File
                            </a>
                          )}
                          {v && (
                            <span className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] text-white/25 border border-white/5">
                              <Clock size={10} /> {v.updated_at ? new Date(v.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Verified Link CTA ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Link
          href="/dashboard/student/my-link"
          className="group flex items-center justify-between p-5 rounded-2xl transition-all duration-300 hover:translate-y-[-2px]"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))', border: '1px solid rgba(59,130,246,0.12)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center"><Link2 size={20} className="text-blue-400" /></div>
            <div>
              <p className="font-heading font-bold text-sm text-white">Generate Verified Link</p>
              <p className="text-xs text-white/30 mt-0.5">Share one link with every company you apply to</p>
            </div>
          </div>
          <ArrowRight size={18} className="text-white/20 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
        </Link>
      </motion.div>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/dashboard/student/saved" className="group flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 size={16} className="text-emerald-400" /></div>
          <div><p className="text-sm font-medium text-white/80 group-hover:text-white">View All Verifications</p><p className="text-[11px] text-white/25">See detailed reports for each document</p></div>
          <ArrowRight size={14} className="text-white/10 ml-auto group-hover:text-white/30" />
        </Link>
        <Link href="/dashboard/student/settings" className="group flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center"><TrendingUp size={16} className="text-blue-400" /></div>
          <div><p className="text-sm font-medium text-white/80 group-hover:text-white">Profile Settings</p><p className="text-[11px] text-white/25">Edit your details and preferences</p></div>
          <ArrowRight size={14} className="text-white/10 ml-auto group-hover:text-white/30" />
        </Link>
      </div>

      {/* ── Recent Activity ── */}
      <div className="mt-8">
        <h2 className="font-heading font-bold text-white text-sm mb-4">Recent Activity</h2>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          {verifications.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={32} className="mx-auto text-white/10 mb-2" />
              <p className="text-sm text-white/40">No activity yet. Start your first verification above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifications.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()).slice(0, 6).map((v, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== Math.min(verifications.length, 6) - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-[-16px] w-[2px] bg-white/5" />
                  )}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 ${
                    ['ai_approved', 'verified', 'admin_verified'].includes(v.status) ? 'bg-emerald-500/20 text-emerald-400' :
                    ['pending', 'needs_review'].includes(v.status) ? 'bg-amber-500/20 text-amber-400' :
                    v.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {['ai_approved', 'verified', 'admin_verified'].includes(v.status) ? <CheckCircle2 size={12} /> :
                     ['pending', 'needs_review'].includes(v.status) ? <Clock size={12} /> :
                     <AlertCircle size={12} />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-white/90">
                      {v.type === 'resume' ? 'Resume Analysis' : v.type === 'police' ? 'Police Verification' : v.type === 'aadhaar' ? 'Aadhaar Identity' : v.type === 'marksheet_10th' ? '10th Marksheet' : v.type === 'marksheet_12th' ? '12th Marksheet' : v.type === 'degree' ? 'Degree Certificate' : 'Document Upload'}
                      {' '}<span className="text-white/40 font-normal">— {v.status.replace(/_/g, ' ')}</span>
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">{new Date(v.updated_at || v.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  {v.ai_confidence > 0 && <span className="text-xs text-white/20 self-center">{v.ai_confidence}% conf.</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

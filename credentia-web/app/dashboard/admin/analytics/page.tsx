'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Users, Shield, FileText, CheckCircle2, GraduationCap, RefreshCw, BarChart2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminAnalytics() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [verifications, setVerifications] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setProfiles(data.profiles || [])
      setVerifications(data.verifications || [])
      setAllStudents(data.students || [])
      setStudents((data.students || []).filter((s: any) => s.ats_score > 0))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const channel = supabase.channel('admin_analytics_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Derived metrics
  const userGrowthData = useMemo(() => {
    const counts: Record<string, number> = {}
    let cumulative = 0
    profiles.forEach(p => {
      const month = new Date(p.created_at).toLocaleString('default', { month: 'short', year: '2-digit' })
      counts[month] = (counts[month] || 0) + 1
    })
    return Object.entries(counts).map(([month, count]) => {
      cumulative += count
      return { month, newUsers: count, totalUsers: cumulative }
    })
  }, [profiles])

  const roleDistribution = useMemo(() => {
    const counts = profiles.reduce((acc, p) => {
      acc[p.role || 'student'] = (acc[p.role || 'student'] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const total = profiles.length || 1
    return [
      { name: 'Students', value: counts.student || 0, color: '#3b82f6', per: ((counts.student || 0)/total)*100 },
      { name: 'Companies', value: counts.company || 0, color: '#10b981', per: ((counts.company || 0)/total)*100 },
      { name: 'Universities', value: counts.university || 0, color: '#8b5cf6', per: ((counts.university || 0)/total)*100 },
      { name: 'Admins', value: counts.admin || 0, color: '#f43f5e', per: ((counts.admin || 0)/total)*100 },
    ]
  }, [profiles])

  const verificationStatusData = useMemo(() => {
    const typeMap: Record<string, string> = { resume: 'Resume', police: 'Police', aadhaar: 'Aadhaar', degree: 'Degree', marksheet_10th: '10th', marksheet_12th: '12th', passport: 'Other' }
    const counts = verifications.reduce((acc, v) => {
      const type = typeMap[v.type] || 'Other'
      if (!acc[type]) acc[type] = { name: type, verified: 0, pending: 0, rejected: 0, total: 0 }
      acc[type].total++
      if (['ai_approved', 'admin_verified', 'verified'].includes(v.status)) acc[type].verified++
      else if (['rejected'].includes(v.status)) acc[type].rejected++
      else acc[type].pending++
      return acc
    }, {} as Record<string, {name: string, verified: number, pending: number, rejected: number, total: number}>)
    return Object.values(counts)
  }, [verifications])

  const mkBuckets = (arr: any[], key: string) => {
    const b = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
    arr.forEach(s => {
      const v = s[key] || 0
      if (v <= 20) b['0-20']++
      else if (v <= 40) b['21-40']++
      else if (v <= 60) b['41-60']++
      else if (v <= 80) b['61-80']++
      else b['81-100']++
    })
    const max = Math.max(...Object.values(b), 1)
    return Object.entries(b).map(([range, count]) => ({ range, count, max }))
  }

  const trustScoreDistribution = useMemo(() => mkBuckets(allStudents, 'trust_score'), [allStudents])
  const atsDistribution = useMemo(() => mkBuckets(students, 'ats_score'), [students])

  const avgTrustScore = allStudents.length ? Math.round(allStudents.reduce((a, s) => a + (s.trust_score || 0), 0) / allStudents.length) : 0

  const stats = [
    { label: 'Total Users', value: profiles.length, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Total Verifications', value: verifications.length, icon: Shield, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Verified Documents', value: verifications.filter(v => ['ai_approved', 'admin_verified', 'verified'].includes(v.status)).length, icon: CheckCircle2, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Avg ATS Score', value: students.length ? Math.round(students.reduce((a, s) => a + (s.ats_score || 0), 0) / students.length) : 0, icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Avg Trust Score', value: `${avgTrustScore}%`, icon: GraduationCap, color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>

  // Max value for growth scale
  const maxGrowth = Math.max(...userGrowthData.map(d => d.totalUsers), 1)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Platform-Wide Analytics</h1>
          <p className="text-sm mt-1 text-white/40">Real-time metrics measuring the entire Credentia ecosystem.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          ⚠ {error}
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <AnimatePresence>
          {stats.map((s, i) => (
            <motion.div key={i} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05, type: 'spring' }} className="rounded-2xl p-5 border border-white/5 bg-white/[0.02]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">{s.label}</p>
                  <p className="font-heading text-2xl font-bold text-white">{s.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg, color: s.color }}><s.icon size={20} /></div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* User Growth (Bars) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 rounded-2xl p-6 border border-white/5 bg-white/[0.02] flex flex-col">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-blue-400" /> Platform Total Growth</h2>
          <div className="flex-1 flex items-end gap-3 min-h-[16rem]">
            {userGrowthData.length === 0 ? (
               <div className="flex-1 text-center text-white/30 text-sm py-12">No data yet.</div>
            ) : (
               userGrowthData.map((d, i) => {
                 const h = (d.totalUsers / maxGrowth) * 100
                 return (
                   <div key={d.month} className="flex-1 flex flex-col items-center justify-end gap-2 group">
                     <div className="w-full relative flex items-end justify-center h-full rounded-md overflow-hidden bg-white/[0.01] hover:bg-white/[0.03] transition-colors pb-6 pt-2">
                        <motion.div 
                          className="w-full rounded-t-sm" style={{ background: 'linear-gradient(to top, rgba(59,130,246,0.8), rgba(59,130,246,0.3))', bottom: 0, position: 'absolute' }}
                          initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 0.8, delay: i * 0.05 + 0.3 }}
                        />
                        <span className="absolute bottom-1 text-[10px] text-blue-300 font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10">{d.totalUsers}</span>
                     </div>
                     <span className="text-[10px] font-medium text-white/40 uppercase">{d.month}</span>
                   </div>
                 )
               })
            )}
          </div>
        </motion.div>

        {/* Roles Distribution (Stacked Flex) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Users size={16} className="text-emerald-400" /> Global User Distribution</h2>
          <div className="h-64 flex flex-col justify-center">
            {profiles.length === 0 ? (
              <div className="text-center text-white/30 text-sm">No profiles found.</div>
            ) : (
              <div className="space-y-4">
                <div className="w-full h-8 rounded-full overflow-hidden flex shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                  {roleDistribution.map((r, i) => r.per > 0 && (
                    <motion.div key={r.name} initial={{ width: 0 }} animate={{ width: `${r.per}%` }} transition={{ duration: 0.8, delay: 0.4 }} style={{ backgroundColor: r.color }} className="h-full border-r border-black/20 last:border-0" title={`${r.name}: ${r.value}`} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4">
                  {roleDistribution.map(r => r.value > 0 && (
                    <div key={r.name} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                      <div className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: r.color }} />
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-white/40 uppercase mb-0.5">{r.name}</p>
                        <p className="text-lg font-bold text-white leading-none">{r.value} <span className="text-xs text-white/30 font-normal">({Math.round(r.per)}%)</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Verification Status (Custom Bars) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Shield size={16} className="text-violet-400" /> Verifications by Type</h2>
          <div className="h-64 flex items-end gap-3 justify-between pt-8">
             {verificationStatusData.length === 0 ? (
               <div className="w-full text-center text-white/30 text-sm">No data yet.</div>
             ) : (
               verificationStatusData.map((d: any, i) => {
                 const overallMax = Math.max(...verificationStatusData.map((v: any) => v.total), 1)
                 const totalH = (d.total / overallMax) * 100
                 const vH = (d.verified / Math.max(d.total, 1)) * 100
                 const pH = (d.pending / Math.max(d.total, 1)) * 100
                 const rH = (d.rejected / Math.max(d.total, 1)) * 100
                 return (
                   <div key={d.name} className="flex-1 flex flex-col items-center justify-end gap-3 h-full group">
                     {/* The stacked bar container */}
                     <div className="w-full relative flex flex-col justify-end gap-1 rounded-md overflow-hidden bg-white/[0.02] p-1 pb-0 w-12 hover:bg-white/[0.05] transition-colors cursor-pointer" style={{ height: `${Math.max(totalH, 15)}%` }}>
                        
                        <div className="w-full flex-1 flex flex-col justify-end gap-[1px]">
                          {/* Rejected */}
                          {d.rejected > 0 && <motion.div className="w-full bg-red-500 rounded-t-sm" initial={{ height: 0 }} animate={{ height: `${rH}%` }} transition={{ duration: 0.5, delay: i*0.05+0.2 }} title={`${d.rejected} Rejected`} />}
                          {/* Pending */}
                          {d.pending > 0 && <motion.div className="w-full bg-amber-500 rounded-t-sm" initial={{ height: 0 }} animate={{ height: `${pH}%` }} transition={{ duration: 0.5, delay: i*0.05+0.3 }} title={`${d.pending} Pending`} />}
                          {/* Verified */}
                          {d.verified > 0 && <motion.div className="w-full bg-emerald-500 rounded-t-sm" initial={{ height: 0 }} animate={{ height: `${vH}%` }} transition={{ duration: 0.5, delay: i*0.05+0.4 }} title={`${d.verified} Verified`} />}
                        </div>
                        
                        {/* Hover popup */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 p-2 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-xl">
                          <p className="text-[10px] text-white/50 mb-1">{d.name} Breakdown</p>
                          <div className="flex gap-2">
                            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded">{d.verified} ✓</span>
                            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-1 rounded">{d.pending} ⧖</span>
                            <span className="text-xs text-red-500 font-bold bg-red-500/10 px-1 rounded">{d.rejected} ✗</span>
                          </div>
                        </div>
                     </div>
                     <span className="text-[10px] font-medium text-white/40 uppercase truncate max-w-[50px]">{d.name}</span>
                   </div>
                 )
               })
             )}
          </div>
        </motion.div>

        {/* ATS Distribution (Custom Bar) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><BarChart2 size={16} className="text-amber-400" /> ATS Score Distribution</h2>
          <div className="h-64 flex items-end gap-2 pt-8">
            {atsDistribution.length === 0 ? (
               <div className="w-full text-center text-white/30 text-sm">No data yet.</div>
            ) : (
               atsDistribution.map((d, i) => {
                 const h = d.max > 0 ? (d.count / d.max) * 100 : 0
                 return (
                   <div key={d.range} className="flex-1 flex flex-col items-center justify-end gap-3 h-full group">
                     <span className="text-xs font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">{d.count}</span>
                     <div className="w-full relative rounded-md overflow-hidden bg-white/[0.01] hover:bg-white/[0.03] transition-colors p-1 pb-0 w-12" style={{ height: '100%' }}>
                        <motion.div 
                          className="w-full rounded-t-sm absolute bottom-0 left-0 bg-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.5)] border-t border-amber-400"
                          initial={{ height: 0 }} animate={{ height: `${Math.max(h, 2)}%` }} transition={{ duration: 0.6, delay: i*0.05 + 0.4 }}
                        />
                     </div>
                     <span className="text-[10px] font-medium text-white/40">{d.range}</span>
                   </div>
                 )
               })
            )}
          </div>
        </motion.div>

      </div>

      {/* Trust Score Distribution */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2"><Shield size={16} className="text-teal-400" /> Trust Score Distribution (All Students)</h2>
          <span className="text-xs text-white/30 uppercase tracking-wider font-bold bg-white/5 px-3 py-1 rounded-lg">Avg: <span className="text-teal-400">{avgTrustScore}%</span></span>
        </div>
        <div className="h-48 flex items-end gap-4 pt-6">
          {trustScoreDistribution.length === 0 ? (
             <div className="w-full text-center text-white/30 text-sm">No data yet.</div>
          ) : (
             trustScoreDistribution.map((d, i) => {
               const h = d.max > 0 ? (d.count / d.max) * 100 : 0
               return (
                 <div key={d.range} className="flex-1 flex flex-col items-center justify-end gap-3 h-full group">
                   <span className="text-[10px] px-2 py-1 bg-teal-500/20 text-teal-300 font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity -mb-2 z-10 scale-90 group-hover:scale-100">{d.count} Students</span>
                   <div className="w-full relative rounded-md overflow-hidden bg-white/[0.01] hover:bg-white/[0.04] transition-colors p-1 pb-0" style={{ height: '100%' }}>
                      <motion.div 
                        className="w-full rounded-t-sm absolute bottom-0 left-0 bg-teal-500/80 shadow-[0_0_20px_rgba(20,184,166,0.3)] border-t border-teal-400"
                        initial={{ height: 0 }} animate={{ height: `${Math.max(h, 4)}%` }} transition={{ duration: 0.6, delay: i * 0.1 + 0.5 }}
                      />
                   </div>
                   <span className="text-xs font-bold text-white/60 group-hover:text-teal-400 transition-colors">{d.range}</span>
                 </div>
               )
             })
          )}
        </div>
      </motion.div>
    </div>
  )
}

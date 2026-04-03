'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
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
      // We process all students for ATS, even if 0, so the chart isn't empty.
      setStudents(data.students || [])
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
  const computedStudents = useMemo(() => {
    return allStudents.map(s => {
      const resumeVer = verifications.filter(v => v.student_id === s.id && v.type === 'resume').pop()
      const ats = resumeVer?.ai_result?.ats_score || s.ats_score || 0
      return { ...s, ats_score: ats }
    })
  }, [allStudents, verifications])

  const userGrowthData = useMemo(() => {
    const counts: Record<string, number> = {}
    let cumulative = 0
    // Generate empty buckets if profiles is small
    if (profiles.length < 2) {
      const now = new Date()
      for(let i=5; i>=0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        counts[d.toLocaleString('default', { month: 'short', year: '2-digit' })] = 0
      }
    }
    
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
    
    // Add default values to ensure chart never looks entirely blank
    return [
      { name: 'Students', value: counts.student || 0, color: '#3b82f6' },
      { name: 'Companies', value: counts.company || 0, color: '#10b981' },
      { name: 'Universities', value: counts.university || 0, color: '#8b5cf6' },
      { name: 'Admins', value: counts.admin || 0, color: '#f43f5e' },
    ]
  }, [profiles])

  const verificationStatusData = useMemo(() => {
    const typeMap: Record<string, string> = { resume: 'Resume', police: 'Police', aadhaar: 'Aadhaar', degree: 'Degree', marksheet_10th: '10th', marksheet_12th: '12th', passport: 'Other' }
    const counts = verifications.reduce((acc, v) => {
      const type = typeMap[v.type] || 'Other'
      if (!acc[type]) acc[type] = { name: type, verified: 0, pending: 0, rejected: 0 }
      if (['ai_approved', 'admin_verified', 'verified'].includes(v.status)) acc[type].verified++
      else if (['rejected'].includes(v.status)) acc[type].rejected++
      else acc[type].pending++
      return acc
    }, {} as Record<string, {name: string, verified: number, pending: number, rejected: number}>)
    
    // Default filler to make empty state look good
    if (Object.keys(counts).length === 0) {
      return [
        { name: 'Resume', verified: 0, pending: 0, rejected: 0 },
        { name: 'Aadhaar', verified: 0, pending: 0, rejected: 0 },
        { name: '10th', verified: 0, pending: 0, rejected: 0 },
        { name: '12th', verified: 0, pending: 0, rejected: 0 },
      ]
    }
    
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
    return Object.entries(b).map(([range, count]) => ({ range, count }))
  }

  const trustScoreDistribution = useMemo(() => mkBuckets(computedStudents, 'trust_score'), [computedStudents])
  const atsDistribution = useMemo(() => mkBuckets(computedStudents, 'ats_score'), [computedStudents])

  const avgTrustScore = computedStudents.length ? Math.round(computedStudents.reduce((a, s) => a + (s.trust_score || 0), 0) / computedStudents.length) : 0
  
  // Calculate Avg ATS Score filtering only valid positive scores, but at least showing 0
  const validATS = computedStudents.filter(s => s.ats_score > 0)
  const avgAtsScore = validATS.length ? Math.round(validATS.reduce((a, s) => a + (s.ats_score || 0), 0) / validATS.length) : 0

  const stats = [
    { label: 'Total Users', value: profiles.length, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Total Verifications', value: verifications.length, icon: Shield, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Verified Documents', value: verifications.filter(v => ['ai_approved', 'admin_verified', 'verified'].includes(v.status)).length, icon: CheckCircle2, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Avg ATS Score', value: avgAtsScore, icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Avg Trust Score', value: `${avgTrustScore}%`, icon: GraduationCap, color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0e0e14]/90 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-xl shadow-black/50">
          <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: p.color || p.fill }} />
                <span className="text-white/80 text-xs">{p.name}:</span>
                <span className="text-white font-bold text-sm ml-auto">{p.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Platform-Wide Analytics</h1>
          <p className="text-sm mt-1 text-white/40">Real-time metrics measuring the entire Credentia ecosystem.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white/5 bg-white/[0.02]"
          style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, type: "spring", stiffness: 100 }} className="rounded-2xl p-5 border border-white/5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-[40px] opacity-10 group-hover:opacity-30 transition-opacity" style={{ background: s.color }} />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1.5">{s.label}</p>
                <p className="font-heading text-3xl font-black text-white">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden" style={{ background: s.bg, color: s.color }}>
                 <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10" />
                 <s.icon size={18} className="relative z-10 drop-shadow-md" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* User Growth (Area) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 rounded-2xl p-6 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-blue-400" /> Platform Total Growth</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={10} tickMargin={12} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="totalUsers" name="Total Users" stroke="#3b82f6" strokeWidth={4} fill="url(#colorUsers)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#0e0e14', strokeWidth: 3 }} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Roles Distribution (Pie) */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="rounded-2xl p-4 sm:p-6 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent flex flex-col min-h-0">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Users size={16} className="text-emerald-400" /> Global User Distribution</h2>
          
          {/* Pie Chart — percentage radii scale with the container */}
          <div className="w-full relative flex-1 min-h-[140px] max-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={roleDistribution} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" cy="50%" 
                  innerRadius="55%" outerRadius="78%" 
                  paddingAngle={6}
                  stroke="none"
                  isAnimationActive={true}
                  animationBegin={200}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {roleDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />)}
                </Pie>
                <RechartsTooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
               <p className="text-2xl sm:text-3xl font-black text-white leading-none">{profiles.length}</p>
               <p className="text-[8px] sm:text-[9px] uppercase tracking-widest font-bold text-white/30 mt-0.5">Users</p>
            </motion.div>
          </div>
          
          {/* Legend — standard flow, never overlaps */}
          <div className="w-full grid grid-cols-2 gap-1.5 sm:gap-2 pt-3 sm:pt-4">
            {roleDistribution.map((r, i) => (
               <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + (i * 0.1) }} key={r.name} className="flex items-center gap-1.5 sm:gap-2 bg-white/[0.02] border border-white/5 p-1.5 sm:p-2 rounded-lg">
                 <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.color, boxShadow: `0 0 10px ${r.color}80` }} />
                 <div className="min-w-0">
                   <p className="text-[9px] sm:text-[10px] uppercase font-bold text-white/40 leading-none mb-0.5 sm:mb-1 truncate">{r.name}</p>
                   <p className="text-xs sm:text-sm font-black text-white leading-none">{r.value}</p>
                 </div>
               </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Verification Status (Stacked Bar) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl p-6 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Shield size={16} className="text-violet-400" /> Verifications by Type</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={verificationStatusData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} tickMargin={12} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px', opacity: 0.6 }} />
                <Bar dataKey="verified" name="Verified" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} animationDuration={1000} />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" animationDuration={1000} />
                <Bar dataKey="rejected" name="Rejected" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ATS Distribution (Bar) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl p-6 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><BarChart2 size={16} className="text-amber-400" /> ATS Score Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={atsDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barSize={40}>
                <defs>
                  <linearGradient id="colorAts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="range" stroke="rgba(255,255,255,0.2)" fontSize={10} tickMargin={12} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" name="Students" fill="url(#colorAts)" radius={[4, 4, 0, 0]} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* Trust Score Distribution */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-2xl p-6 border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2"><Shield size={16} className="text-teal-400" /> Trust Score Distribution (All Students)</h2>
          <span className="text-xs text-teal-300 bg-teal-500/10 px-3 py-1 rounded-lg border border-teal-500/20 font-bold uppercase tracking-widest">Avg Default: {avgTrustScore}%</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trustScoreDistribution} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} barSize={50}>
              <defs>
                <linearGradient id="colorTrust" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.9}/>
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="range" stroke="rgba(255,255,255,0.2)" fontSize={10} tickMargin={12} axisLine={false} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" name="Students" fill="url(#colorTrust)" radius={[6, 6, 0, 0]} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
}

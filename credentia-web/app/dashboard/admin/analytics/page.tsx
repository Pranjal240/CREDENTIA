'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, Users, Shield, FileText, CheckCircle2, AlertCircle, Clock, Building, GraduationCap, RefreshCw } from 'lucide-react'
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
      // Use service-role API to bypass RLS (admin-only endpoint)
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
    // Realtime — auto-refresh on changes
    const channel = supabase.channel('admin_analytics_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Process data for charts
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
    }, {} as Record<string, any>)
    return Object.values(counts)
  }, [verifications])

  const trustScoreDistribution = useMemo(() => {
    const buckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
    allStudents.forEach(s => {
      const score = s.trust_score || 0
      if (score <= 20) buckets['0-20']++
      else if (score <= 40) buckets['21-40']++
      else if (score <= 60) buckets['41-60']++
      else if (score <= 80) buckets['61-80']++
      else buckets['81-100']++
    })
    return Object.entries(buckets).map(([range, count]) => ({ range, count }))
  }, [allStudents])

  const atsDistribution = useMemo(() => {
    const buckets = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 }
    students.forEach(s => {
      const score = s.ats_score || 0
      if (score <= 20) buckets['0-20']++
      else if (score <= 40) buckets['21-40']++
      else if (score <= 60) buckets['41-60']++
      else if (score <= 80) buckets['61-80']++
      else buckets['81-100']++
    })
    return Object.entries(buckets).map(([range, count]) => ({ range, count }))
  }, [students])

  const avgTrustScore = allStudents.length ? Math.round(allStudents.reduce((a, s) => a + (s.trust_score || 0), 0) / allStudents.length) : 0
  
  const stats = [
    { label: 'Total Users', value: profiles.length, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Total Verifications', value: verifications.length, icon: Shield, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Verified Documents', value: verifications.filter(v => ['ai_approved', 'admin_verified', 'verified'].includes(v.status)).length, icon: CheckCircle2, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Avg ATS Score', value: students.length ? Math.round(students.reduce((a, s) => a + (s.ats_score || 0), 0) / students.length) : 0, icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Avg Trust Score', value: `${avgTrustScore}%`, icon: GraduationCap, color: '#14b8a6', bg: 'rgba(20,184,166,0.1)' },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>

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
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl p-5 border border-white/5 bg-white/[0.02]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-1">{s.label}</p>
                <p className="font-heading text-2xl font-bold text-white">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.bg, color: s.color }}><s.icon size={20} /></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* User Growth (Area) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-blue-400" /> Platform Total Growth</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0e0e14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="totalUsers" name="Total Users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Roles Distribution (Pie) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Users size={16} className="text-emerald-400" /> Global User Distribution</h2>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleDistribution} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {roleDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.05)" />)}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#0e0e14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute bottom-0 w-full flex justify-center flex-wrap gap-3">
              {roleDistribution.filter(r => r.value > 0).map(r => (
                <div key={r.name} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} /><span className="text-[10px] text-white/50">{r.name} ({r.value})</span></div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Verification Status (Stacked Bar) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><Shield size={16} className="text-violet-400" /> All Platform Verifications by Type</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={verificationStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0e0e14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="verified" name="Verified" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" />
                <Bar dataKey="rejected" name="Rejected" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ATS Distribution (Bar) */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2"><FileText size={16} className="text-amber-400" /> ATS Score Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={atsDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="range" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0e0e14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="count" name="Students" fill="url(#colorAts)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* Trust Score Distribution */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold text-white flex items-center gap-2"><Shield size={16} className="text-teal-400" /> Trust Score Distribution (All Students)</h2>
          <span className="text-xs text-white/30">Avg: <span className="text-teal-400 font-bold">{avgTrustScore}%</span></span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trustScoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTrust" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="range" stroke="rgba(255,255,255,0.2)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} />
              <RechartsTooltip contentStyle={{ backgroundColor: '#0e0e14', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
              <Bar dataKey="count" name="Students" fill="url(#colorTrust)" radius={[4, 4, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
}

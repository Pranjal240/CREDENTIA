'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { BarChart3, Users, Shield, GraduationCap, TrendingUp, CreditCard, CheckCircle2, Sparkles, BookmarkCheck, ArrowUpRight } from 'lucide-react'

export default function CompanyAnalytics() {
  const [students, setStudents] = useState<any[]>([])
  const [savedCount, setSavedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: stuData } = await supabase.from('students').select('*').eq('profile_is_public', true)
      setStudents(stuData || [])
      const { count } = await supabase.from('saved_candidates').select('*', { count: 'exact', head: true }).eq('company_id', session.user.id)
      setSavedCount(count || 0)
      setLoading(false)
    }
    load()
  }, [])

  const stats = useMemo(() => {
    const list = students
    const total = list.length
    const policeV = list.filter(s => s.police_verified).length
    const aadhaarV = list.filter(s => s.aadhaar_verified).length
    const degreeV = list.filter(s => s.degree_verified).length
    const avgAts = total ? Math.round(list.reduce((a, s) => a + (s.ats_score || 0), 0) / total) : 0
    const fullyVerified = list.filter(s => s.degree_verified && s.police_verified && s.aadhaar_verified).length
    const highAts = list.filter(s => (s.ats_score || 0) >= 70).length

    // ATS distribution
    const atsRanges = [
      { label: '0-30', count: list.filter(s => (s.ats_score || 0) <= 30).length, color: '#ef4444' },
      { label: '31-50', count: list.filter(s => (s.ats_score || 0) > 30 && (s.ats_score || 0) <= 50).length, color: '#f59e0b' },
      { label: '51-70', count: list.filter(s => (s.ats_score || 0) > 50 && (s.ats_score || 0) <= 70).length, color: '#3b82f6' },
      { label: '71-90', count: list.filter(s => (s.ats_score || 0) > 70 && (s.ats_score || 0) <= 90).length, color: '#10b981' },
      { label: '91-100', count: list.filter(s => (s.ats_score || 0) > 90).length, color: '#22c55e' },
    ]

    // Top courses
    const courseBreakdown = (Object.entries(
      list.reduce((acc: Record<string, number>, s) => {
        const c = s.course || 'Unknown'
        acc[c] = (acc[c] || 0) + 1
        return acc
      }, {})
    ) as [string, number][]).sort((a, b) => b[1] - a[1]).slice(0, 8)

    return { total, policeV, aadhaarV, degreeV, avgAts, fullyVerified, highAts, atsRanges, courseBreakdown }
  }, [students])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>

  const maxAts = Math.max(...(stats.atsRanges.map(r => r.count) || [1]), 1)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><BarChart3 size={24} className="text-emerald-400" /> Talent Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Insights into the available talent pool, verification distribution, and candidate quality.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Candidates', value: stats.total, icon: Users, accent: '#10b981', gradient: 'from-emerald-500/15 to-emerald-400/5' },
          { label: 'Avg ATS Score', value: stats.avgAts, icon: TrendingUp, accent: '#3b82f6', gradient: 'from-blue-500/15 to-blue-400/5' },
          { label: 'High ATS (70+)', value: stats.highAts, icon: Sparkles, accent: '#22c55e', gradient: 'from-green-500/15 to-green-400/5' },
          { label: 'Fully Verified', value: stats.fullyVerified, icon: CheckCircle2, accent: '#14b8a6', gradient: 'from-teal-500/15 to-teal-400/5' },
          { label: 'Police Verified', value: stats.policeV, icon: Shield, accent: '#8b5cf6', gradient: 'from-violet-500/15 to-violet-400/5' },
          { label: 'Saved by You', value: savedCount, icon: BookmarkCheck, accent: '#f59e0b', gradient: 'from-amber-500/15 to-amber-400/5' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`rounded-xl p-4 border border-white/5 bg-gradient-to-br ${s.gradient}`}>
            <s.icon size={16} style={{ color: s.accent }} className="mb-2" />
            <p className="font-heading text-xl font-bold text-white">{s.value}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Talent Quality Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ATS distribution bar chart */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-heading font-bold text-sm text-white mb-6">ATS Score Distribution</h2>
          <div className="flex items-end gap-3 sm:gap-6 h-48">
            {stats.atsRanges.map((range, i) => (
              <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: 'easeOut' }} className="flex-1 flex flex-col items-center gap-2" style={{ transformOrigin: 'bottom' }}>
                <span className="text-xs font-bold text-white">{range.count}</span>
                <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${maxAts > 0 ? (range.count / maxAts) * 100 : 0}%`, minHeight: 4, background: range.color, opacity: 0.8 }} />
                <span className="text-[10px] text-white/40 font-medium">{range.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Course breakdown */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-heading font-bold text-sm text-white mb-4">Top Courses in Pool</h2>
          {stats.courseBreakdown.length === 0 ? (
            <p className="text-sm text-white/30">No data available.</p>
          ) : (
            <div className="space-y-3">
              {stats.courseBreakdown.map(([course, count], i) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{course}</span>
                      <span className="text-white/40">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }} className="h-full bg-emerald-500 rounded-full" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Verification coverage */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-heading font-bold text-sm text-white mb-4">Verification Coverage</h2>
        <div className="space-y-4">
          {[
            { label: 'Police Verification', count: stats.policeV, color: '#8b5cf6', icon: Shield },
            { label: 'Aadhaar KYC', count: stats.aadhaarV, color: '#14b8a6', icon: CreditCard },
            { label: 'Degree Certificate', count: stats.degreeV, color: '#f59e0b', icon: GraduationCap },
          ].map((item, i) => {
            const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0
            return (
              <div key={i} className="flex items-center gap-4">
                <item.icon size={18} style={{ color: item.color }} className="flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/70">{item.label}</span>
                    <span className="text-xs text-white/40">{item.count}/{stats.total} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 + i * 0.1 }} className="h-full rounded-full" style={{ background: item.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Talent Quality Insight */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-6">
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpRight size={18} className="text-emerald-400" />
          <h3 className="font-heading font-bold text-sm text-white">Talent Quality Snapshot</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <p className="font-heading text-2xl font-bold text-white">{stats.total > 0 ? Math.round((stats.highAts / stats.total) * 100) : 0}%</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">High ATS Rate</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <p className="font-heading text-2xl font-bold text-white">{stats.total > 0 ? Math.round((stats.fullyVerified / stats.total) * 100) : 0}%</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Full Verify Rate</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <p className="font-heading text-2xl font-bold text-white">{stats.total > 0 ? Math.round((stats.policeV / stats.total) * 100) : 0}%</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">BG Check Rate</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <p className="font-heading text-2xl font-bold text-white">{stats.degreeV}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">Degree Verified</p>
          </div>
        </div>
      </div>
    </div>
  )
}

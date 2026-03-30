'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart3, Users, Shield, GraduationCap, TrendingUp, CreditCard, FileText } from 'lucide-react'

export default function CompanyAnalytics() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: students } = await supabase.from('students').select('*').eq('profile_is_public', true)
      const list = students || []
      const policeV = list.filter(s => s.police_verified).length
      const aadhaarV = list.filter(s => s.aadhaar_verified).length
      const degreeV = list.filter(s => s.degree_verified).length
      const avgAts = list.length ? Math.round(list.reduce((a, s) => a + (s.ats_score || 0), 0) / list.length) : 0

      // ATS distribution
      const atsRanges = [
        { label: '0-30', count: list.filter(s => (s.ats_score || 0) <= 30).length, color: '#ef4444' },
        { label: '31-50', count: list.filter(s => (s.ats_score || 0) > 30 && (s.ats_score || 0) <= 50).length, color: '#f59e0b' },
        { label: '51-70', count: list.filter(s => (s.ats_score || 0) > 50 && (s.ats_score || 0) <= 70).length, color: '#3b82f6' },
        { label: '71-90', count: list.filter(s => (s.ats_score || 0) > 70 && (s.ats_score || 0) <= 90).length, color: '#10b981' },
        { label: '91-100', count: list.filter(s => (s.ats_score || 0) > 90).length, color: '#22c55e' },
      ]

      setStats({ total: list.length, policeV, aadhaarV, degreeV, avgAts, atsRanges })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>

  const maxAts = Math.max(...(stats?.atsRanges.map((r: any) => r.count) || [1]))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><BarChart3 size={24} className="text-emerald-400" /> Talent Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Insights into the available talent pool and verification distribution.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Candidates', value: stats.total, icon: Users, accent: '#10b981' },
          { label: 'Avg ATS Score', value: stats.avgAts, icon: TrendingUp, accent: '#3b82f6' },
          { label: 'Police Verified', value: stats.policeV, icon: Shield, accent: '#8b5cf6' },
          { label: 'Degree Verified', value: stats.degreeV, icon: GraduationCap, accent: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-5 border border-white/5 bg-white/[0.02]">
            <s.icon size={18} style={{ color: s.accent }} className="mb-3" />
            <p className="font-heading text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ATS distribution bar chart */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-heading font-bold text-sm text-white mb-6">ATS Score Distribution</h2>
        <div className="flex items-end gap-4 h-48">
          {stats.atsRanges.map((range: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-white">{range.count}</span>
              <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: `${maxAts > 0 ? (range.count / maxAts) * 100 : 0}%`, minHeight: 4, background: range.color, opacity: 0.8 }} />
              <span className="text-[10px] text-white/40 font-medium">{range.label}</span>
            </div>
          ))}
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
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

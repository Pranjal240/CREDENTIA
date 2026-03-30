'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart3, Users, GraduationCap, TrendingUp, Shield, CreditCard } from 'lucide-react'

export default function UniversityAnalytics() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: students } = await supabase.from('students').select('*').eq('university_id', session.user.id)
      const list = students || []
      const degreeV = list.filter(s => s.degree_verified).length
      const policeV = list.filter(s => s.police_verified).length
      const aadhaarV = list.filter(s => s.aadhaar_verified).length
      const avgCgpa = list.length ? (list.reduce((a, s) => a + (parseFloat(s.cgpa) || 0), 0) / list.length).toFixed(1) : '0.0'

      const courseBreakdown = (Object.entries(
        list.reduce((acc: Record<string, number>, s) => {
          const c = s.course || 'Unknown'
          acc[c] = (acc[c] || 0) + 1
          return acc
        }, {})
      ) as [string, number][]).sort((a, b) => b[1] - a[1])

      const yearBreakdown = (Object.entries(
        list.reduce((acc: Record<string, number>, s) => {
          const y = s.graduation_year?.toString() || 'Unknown'
          acc[y] = (acc[y] || 0) + 1
          return acc
        }, {})
      ) as [string, number][]).sort((a, b) => a[0].localeCompare(b[0]))

      setStats({ total: list.length, degreeV, policeV, aadhaarV, avgCgpa, courseBreakdown, yearBreakdown })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><BarChart3 size={24} className="text-indigo-400" /> University Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Insights into your institution&apos;s student verification data.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.total, icon: Users, accent: '#8b5cf6' },
          { label: 'Degree Verified', value: stats.degreeV, icon: GraduationCap, accent: '#f59e0b' },
          { label: 'Avg CGPA', value: stats.avgCgpa, icon: TrendingUp, accent: '#10b981' },
          { label: 'Police Verified', value: stats.policeV, icon: Shield, accent: '#3b82f6' },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-5 border border-white/5 bg-white/[0.02]">
            <s.icon size={18} style={{ color: s.accent }} className="mb-3" />
            <p className="font-heading text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Course Breakdown */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-heading font-bold text-sm text-white mb-4">Course Breakdown</h2>
          {stats.courseBreakdown.length === 0 ? (
            <p className="text-sm text-white/30">No data available.</p>
          ) : (
            <div className="space-y-3">
              {stats.courseBreakdown.map(([course, count]: [string, number], i: number) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{course}</span>
                      <span className="text-white/40">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Year Breakdown */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="font-heading font-bold text-sm text-white mb-4">Graduation Year</h2>
          {stats.yearBreakdown.length === 0 ? (
            <p className="text-sm text-white/30">No data available.</p>
          ) : (
            <div className="space-y-3">
              {stats.yearBreakdown.map(([year, count]: [string, number], i: number) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/60">{year}</span>
                      <span className="text-white/40">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
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
            { label: 'Degree Certificate', count: stats.degreeV, color: '#f59e0b', icon: GraduationCap },
            { label: 'Police Check', count: stats.policeV, color: '#8b5cf6', icon: Shield },
            { label: 'Aadhaar KYC', count: stats.aadhaarV, color: '#14b8a6', icon: CreditCard },
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
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
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

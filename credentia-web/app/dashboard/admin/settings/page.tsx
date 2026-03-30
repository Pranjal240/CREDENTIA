'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings, Shield, TrendingUp, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function GlobalSettings() {
  const [stats, setStats] = useState({ students: 0, verifications: 0, approved: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [{ count: sCount }, { data: vData }] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('verifications').select('status'),
      ])
      const vList = vData || []
      setStats({
        students: sCount || 0,
        verifications: vList.length,
        approved: vList.filter(v => ['ai_approved', 'admin_verified', 'verified'].includes(v.status)).length,
        pending: vList.filter(v => ['pending', 'needs_review'].includes(v.status)).length,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><Settings size={24} className="text-blue-400" /> Global Settings</h1>
        <p className="text-sm text-white/40 mt-1">Platform configuration and system overview.</p>
      </div>

      {/* Platform Stats */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h2 className="font-heading font-bold text-sm text-white">Platform Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Students', value: stats.students, color: '#8b5cf6' },
            { label: 'Total Verifications', value: stats.verifications, color: '#3b82f6' },
            { label: 'Approved', value: stats.approved, color: '#22c55e' },
            { label: 'Pending Review', value: stats.pending, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
              <p className="font-heading text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Configuration */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2"><Shield size={16} className="text-emerald-400" /> AI Verification Settings</h2>
        <div className="space-y-4">
          {[
            { label: 'AI Confidence Threshold', desc: 'Minimum confidence percentage for auto-approval', value: '70%', key: 'ai_threshold' },
            { label: 'Auto-Approve Resume Scores', desc: 'Automatically approve resumes above this ATS score', value: '60', key: 'auto_resume' },
            { label: 'Manual Review Required', desc: 'Types requiring manual admin review', value: 'Police Verification', key: 'manual_types' },
          ].map((setting, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div>
                <p className="text-sm font-medium text-white/80">{setting.label}</p>
                <p className="text-xs text-white/30 mt-0.5">{setting.desc}</p>
              </div>
              <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">{setting.value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs">
          <AlertCircle size={14} />
          <span>Settings changes require a server restart to take effect. Contact the development team for modifications.</span>
        </div>
      </div>

      {/* Data Management */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2"><TrendingUp size={16} className="text-teal-400" /> Data Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-sm font-medium text-white/80">Database Provider</p>
            <p className="text-xs text-white/30 mt-1">Supabase (PostgreSQL)</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-sm font-medium text-white/80">File Storage</p>
            <p className="text-xs text-white/30 mt-1">Cloudflare R2</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-sm font-medium text-white/80">AI Provider</p>
            <p className="text-xs text-white/30 mt-1">Groq (LLaMA)</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-sm font-medium text-white/80">Email Service</p>
            <p className="text-xs text-white/30 mt-1">Resend</p>
          </div>
        </div>
      </div>
    </div>
  )
}

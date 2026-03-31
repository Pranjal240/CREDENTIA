'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, Shield, TrendingUp, Save, Loader2, CheckCircle2, AlertCircle, RefreshCw, Database, Cpu, Globe } from 'lucide-react'

type Setting = { key: string; value: string; label: string; description: string; updated_at?: string }

const SETTING_META: Record<string, { type: 'number' | 'text' | 'select' | 'toggle'; options?: string[]; min?: number; max?: number; suffix?: string }> = {
  ai_confidence_threshold: { type: 'number', min: 0, max: 100, suffix: '%' },
  auto_resume_threshold: { type: 'number', min: 0, max: 100 },
  manual_review_types: { type: 'select', options: ['police', 'police,aadhaar', 'police,aadhaar,degree', 'none'] },
  maintenance_mode: { type: 'toggle' },
}

export default function GlobalSettings() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [stats, setStats] = useState({ students: 0, verifications: 0, approved: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [settingsRes, { supabase }] = await Promise.all([
        fetch('/api/admin/settings'),
        import('@/lib/supabase'),
      ])

      const settingsData = await settingsRes.json()
      const loadedSettings: Setting[] = settingsData.settings || []
      setSettings(loadedSettings)
      setEditValues(Object.fromEntries(loadedSettings.map((s: Setting) => [s.key, s.value])))

      const [{ count: sCount }, { data: vData }] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('verifications').select('status'),
      ])
      const vList = vData || []
      setStats({
        students: sCount || 0,
        verifications: vList.length,
        approved: vList.filter((v: any) => ['ai_approved', 'admin_verified', 'verified'].includes(v.status)).length,
        pending: vList.filter((v: any) => ['pending', 'needs_review'].includes(v.status)).length,
      })
    } catch (err: any) {
      setError('Failed to load settings: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      const payload = Object.entries(editValues).map(([key, value]) => ({ key, value }))
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      load() // Reload to show updated timestamps
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const renderInput = (setting: Setting) => {
    const meta = SETTING_META[setting.key] || { type: 'text' }
    const value = editValues[setting.key] ?? setting.value

    if (meta.type === 'toggle') {
      const isOn = value === 'true'
      return (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditValues(prev => ({ ...prev, [setting.key]: isOn ? 'false' : 'true' }))}
            className={`w-12 h-7 rounded-full transition-all duration-300 relative ${isOn ? 'bg-red-500' : 'bg-white/10'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all duration-300 shadow ${isOn ? 'left-6' : 'left-1'}`} />
          </button>
          <span className={`text-xs font-semibold ${isOn ? 'text-red-400' : 'text-white/40'}`}>
            {isOn ? 'ON — Platform is in maintenance mode' : 'OFF'}
          </span>
        </div>
      )
    }

    if (meta.type === 'select') {
      return (
        <select
          value={value}
          onChange={e => setEditValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
          className="h-10 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
        >
          {meta.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <input
          type={meta.type === 'number' ? 'number' : 'text'}
          value={value}
          min={meta.min}
          max={meta.max}
          onChange={e => setEditValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
          className="w-28 h-10 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50 text-center font-mono font-bold"
        />
        {meta.suffix && <span className="text-sm text-white/40">{meta.suffix}</span>}
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
            <Settings size={24} className="text-blue-400" /> Global Settings
          </h1>
          <p className="text-sm text-white/40 mt-1">Platform configuration — all changes are saved to the database instantly.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Platform Stats */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h2 className="font-heading font-bold text-sm text-white">Live Platform Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Students', value: stats.students, color: '#8b5cf6' },
            { label: 'Total Verifications', value: stats.verifications, color: '#3b82f6' },
            { label: 'Approved', value: stats.approved, color: '#22c55e' },
            { label: 'Pending Review', value: stats.pending, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
              <p className="font-heading text-2xl font-bold stat-number" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Configuration — editable */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2">
          <Shield size={16} className="text-emerald-400" /> AI Verification Settings
        </h2>
        <div className="space-y-4">
          {settings.map((setting, i) => (
            <motion.div
              key={setting.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start justify-between gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-white/80">{setting.label}</p>
                <p className="text-xs text-white/30 mt-0.5">{setting.description}</p>
                {setting.updated_at && (
                  <p className="text-[10px] text-white/15 mt-1">
                    Last updated: {new Date(setting.updated_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                {renderInput(setting)}
              </div>
            </motion.div>
          ))}

          {settings.length === 0 && (
            <div className="text-center py-8 text-white/30 text-sm">
              <Settings size={32} className="mx-auto mb-3 opacity-20" />
              No settings found. The platform_settings table may need initialization.
            </div>
          )}
        </div>
      </div>

      {/* Infrastructure Info */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2">
          <TrendingUp size={16} className="text-teal-400" /> Infrastructure
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Database, label: 'Database', value: 'Supabase (PostgreSQL 17)', color: '#22c55e' },
            { icon: Globe, label: 'File Storage', value: 'Cloudflare R2', color: '#f59e0b' },
            { icon: Cpu, label: 'AI Provider', value: 'Groq (LLaMA 3.3 + LLaMA 4 Scout)', color: '#6366f1' },
            { icon: Shield, label: 'Hosting', value: 'Vercel (Edge Network)', color: '#3b82f6' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3">
              <item.icon size={18} style={{ color: item.color }} className="flex-shrink-0" />
              <div>
                <p className="text-[10px] text-white/25 uppercase tracking-wider">{item.label}</p>
                <p className="text-sm text-white/70 font-medium mt-0.5">{item.value}</p>
              </div>
              <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 realtime-dot" />
            </div>
          ))}
        </div>
      </div>

      {/* Save bar */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="flex items-center gap-4 pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all hover:translate-y-[-1px] active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 24px rgba(59,130,246,0.25)' }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm text-emerald-400"
          >
            <CheckCircle2 size={16} /> Settings saved to database!
          </motion.span>
        )}
      </div>
    </div>
  )
}

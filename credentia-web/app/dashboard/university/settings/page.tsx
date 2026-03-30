'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Settings, Building, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'

export default function UniversitySettings() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ university_name: '' })

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      setForm({ university_name: prof?.full_name || '' })
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Unauthenticated')
        
      const { error: err } = await supabase.from('profiles').update({
        full_name: form.university_name,
        updated_at: new Date().toISOString()
      }).eq('id', session.user.id)

      if (err) throw err
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><Settings size={24} className="text-indigo-400" /> University Settings</h1>
        <p className="text-sm text-white/40 mt-1">Configure your institution profile and basic information.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2"><Building size={16} className="text-indigo-400" /> Institution Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-1 block">Institution Name</label>
            <input 
              value={form.university_name} 
              onChange={e => setForm(f => ({ ...f, university_name: e.target.value }))} 
              placeholder="Enter your university name" 
              className="w-full h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/15 focus:outline-none focus:border-indigo-500/50 transition-colors" 
            />
          </div>
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-1 block">Account Contact (Read Only)</label>
            <input value={profile?.email || ''} readOnly className="w-full h-11 px-4 rounded-xl text-sm bg-black/20 border border-white/5 text-white/50 cursor-not-allowed" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-400 text-xs">
        <AlertCircle size={14} />
        <span>Saving will globally update your university identity.</span>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all hover:translate-y-[-1px]" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 24px rgba(99,102,241,0.25)' }}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && <span className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 size={16} /> Update successful!</span>}
      </div>
    </div>
  )
}

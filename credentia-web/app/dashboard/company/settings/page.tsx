'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Settings, AlertCircle, Briefcase, Loader2, CheckCircle2 } from 'lucide-react'
import { ProfileAvatar } from '@/components/ProfileAvatar'
import { useRouter } from 'next/navigation'

export default function CompanySettings() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ company_name: '', phone: '', description: '', industry: '', website: '' })

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      
      const [{ data: prof }, { data: comp }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('companies').select('*').eq('id', session.user.id).single(),
      ])
      setProfile(prof)
      setForm({ 
        company_name: comp?.company_name || prof?.full_name || '',
        phone: prof?.phone || '',
        description: comp?.description || '',
        industry: comp?.industry || '',
        website: comp?.website || ''
      })
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Unauthenticated')
        
      const res = await fetch('/api/company/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to save settings')

      // Update local profile state so sidebar reflects the new name immediately
      setProfile((prev: any) => prev ? { ...prev, full_name: form.company_name } : prev)
      
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><Settings size={24} className="text-emerald-400" /> Company Settings</h1>
        <p className="text-sm text-white/40 mt-1">Configure your company profile and basic information.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2"><Briefcase size={16} className="text-emerald-400" /> Company Profile</h2>
        
        <div className="flex items-center gap-4 py-2">
          <ProfileAvatar 
            profile={profile} 
            userId={profile?.id}
            onUploadSuccess={(url) => setProfile({ ...profile, avatar_url: url })}
            size="lg"
          />
          <div>
            <p className="font-heading font-bold text-white">{form.company_name || 'Company Name'}</p>
            <p className="text-xs text-white/40">{profile?.email}</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-1 block">Company Name</label>
            <input 
              value={form.company_name} 
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} 
              placeholder="Your company name" 
              className="w-full h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/15 focus:outline-none focus:border-emerald-500/50 transition-colors" 
            />
          </div>
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-1 block">Phone Number</label>
            <input 
              value={form.phone} 
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} 
              placeholder="e.g. 9876543210" 
              className="w-full h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/15 focus:outline-none focus:border-emerald-500/50 transition-colors" 
            />
          </div>
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-1 block">Industry</label>
            <input 
              value={form.industry} 
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} 
              placeholder="e.g. Technology, Healthcare" 
              className="w-full h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/15 focus:outline-none focus:border-emerald-500/50 transition-colors" 
            />
          </div>
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-1 block">Website</label>
            <input 
              value={form.website} 
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))} 
              placeholder="https://example.com" 
              className="w-full h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/15 focus:outline-none focus:border-emerald-500/50 transition-colors" 
            />
          </div>
          <div>
            <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-1 block">Company Description</label>
            <textarea 
              value={form.description} 
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
              placeholder="Brief description of your company..." 
              className="w-full h-32 p-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/15 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none" 
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
        <span>Saving will globally update your company profile name.</span>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all hover:translate-y-[-1px]" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 24px rgba(16,185,129,0.25)' }}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && <span className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 size={16} /> Update successful!</span>}
      </div>
    </div>
  )
}

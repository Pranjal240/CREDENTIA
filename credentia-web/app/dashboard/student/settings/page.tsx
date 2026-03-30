'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { User, Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, GraduationCap } from 'lucide-react'

export default function StudentSettingsPage() {
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', course: '', branch: '', graduation_year: '', cgpa: '', city: '', state: '', profile_is_public: true })

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      const { data: stu } = await supabase.from('students').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      setStudent(stu)
      setForm({
        name: stu?.name || prof?.full_name || '',
        course: stu?.course || '',
        branch: stu?.branch || '',
        graduation_year: stu?.graduation_year?.toString() || '',
        cgpa: stu?.cgpa?.toString() || '',
        city: stu?.city || '',
        state: stu?.state || '',
        profile_is_public: stu?.profile_is_public ?? true,
      })
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/student/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userId, ...form, graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null, cgpa: form.cgpa ? parseFloat(form.cgpa) : null })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-sm mt-1 text-white/40">Update your personal details and preferences.</p>
      </div>

      {/* Avatar */}
      <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center text-white font-heading font-bold text-xl">
            {(form.name || 'S')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-heading font-bold text-white">{form.name || 'Student'}</p>
            <p className="text-xs text-white/40">{profile?.email}</p>
            <p className="text-[10px] text-white/25 uppercase tracking-wider mt-1">Role: {profile?.role || 'student'}</p>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.02] space-y-5">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2"><User size={16} className="text-blue-400" /> Personal Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your full name' },
            { label: 'Course', key: 'course', type: 'text', placeholder: 'e.g. B.Tech' },
            { label: 'Branch / Specialization', key: 'branch', type: 'text', placeholder: 'e.g. Computer Science' },
            { label: 'Graduation Year', key: 'graduation_year', type: 'number', placeholder: 'e.g. 2025' },
            { label: 'CGPA', key: 'cgpa', type: 'number', placeholder: 'e.g. 8.5' },
            { label: 'City', key: 'city', type: 'text', placeholder: 'e.g. New Delhi' },
            { label: 'State', key: 'state', type: 'text', placeholder: 'e.g. Delhi' },
          ].map(field => (
            <div key={field.key}>
              <label className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-1.5 block">{field.label}</label>
              <input
                type={field.type}
                value={(form as any)[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/15 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.02] space-y-4">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2"><Eye size={16} className="text-violet-400" /> Profile Visibility</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Public Profile</p>
            <p className="text-xs text-white/30 mt-0.5">Allow companies to see your verified profile</p>
          </div>
          <button onClick={() => setForm(f => ({ ...f, profile_is_public: !f.profile_is_public }))} className={`w-12 h-7 rounded-full transition-all duration-300 relative ${form.profile_is_public ? 'bg-emerald-500' : 'bg-white/10'}`}>
            <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all duration-300 ${form.profile_is_public ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${form.profile_is_public ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'bg-amber-500/5 text-amber-400 border border-amber-500/10'}`}>
          {form.profile_is_public ? <Eye size={16} /> : <EyeOff size={16} />}
          {form.profile_is_public ? 'Your profile is visible to companies' : 'Your profile is private'}
        </div>
      </div>

      {/* Save */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all hover:translate-y-[-1px]" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 24px rgba(59,130,246,0.25)' }}>
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && <span className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 size={16} /> Changes saved!</span>}
      </div>
    </div>
  )
}

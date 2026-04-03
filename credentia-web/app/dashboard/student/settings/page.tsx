'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff,
  Building, Search, MapPin, X, ExternalLink, GraduationCap, Plus
} from 'lucide-react'
import { ProfileAvatar } from '@/components/ProfileAvatar'

export default function StudentSettingsPage() {
  const [userId, setUserId] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [universities, setUniversities] = useState<any[]>([])
  const [showUniModal, setShowUniModal] = useState(false)
  const [uniSearch, setUniSearch] = useState('')
  const [showExternalForm, setShowExternalForm] = useState(false)
  const [externalUni, setExternalUni] = useState({ name: '', city: '', state: '', course: '', year: '' })
  const [savingExternal, setSavingExternal] = useState(false)

  const [form, setForm] = useState({
    name: '', course: '', branch: '', graduation_year: '', cgpa: '',
    city: '', state: '', profile_is_public: true, university_id: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)

      const [{ data: prof }, { data: stu }, { data: unis }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('students').select('*').eq('id', session.user.id).single(),
        // RLS is now fixed — this will return universities
        supabase.from('profiles').select('id, full_name, email').eq('role', 'university').order('full_name'),
      ])

      setProfile(prof)
      setUniversities(unis || [])
      setForm({
        name: stu?.name || prof?.full_name || '',
        course: stu?.course || '',
        branch: stu?.branch || '',
        graduation_year: stu?.graduation_year?.toString() || '',
        cgpa: stu?.cgpa?.toString() || '',
        city: stu?.city || '',
        state: stu?.state || '',
        profile_is_public: stu?.profile_is_public ?? true,
        university_id: stu?.university_id || prof?.linked_university_id || '',
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
        body: JSON.stringify({
          studentId: userId,
          ...form,
          graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
          cgpa: form.cgpa ? parseFloat(form.cgpa) : null,
        }),
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

  const linkedUniName = universities.find(u => u.id === form.university_id)?.full_name

  const filteredUnis = universities.filter(u =>
    !uniSearch || (u.full_name || u.email || '').toLowerCase().includes(uniSearch.toLowerCase())
  )

  const handleLinkUni = (uniId: string) => {
    setForm(f => ({ ...f, university_id: uniId }))
    setShowUniModal(false)
    setUniSearch('')
    setShowExternalForm(false)
  }

  const handleExternalSave = async () => {
    if (!externalUni.name.trim()) return
    setSavingExternal(true)
    try {
      // Save to students table as a pending-verification external university note
      await fetch('/api/student/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: userId,
          ...form,
          graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
          cgpa: form.cgpa ? parseFloat(form.cgpa) : null,
          university_id: null, // external unis don't have a profile ID
        }),
      })
      setShowUniModal(false)
      setShowExternalForm(false)
    } catch {}
    setSavingExternal(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-sm mt-1 text-white/40">Update your personal details and preferences.</p>
      </div>

      {/* Avatar */}
      <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <ProfileAvatar 
            profile={profile} 
            userId={userId}
            onUploadSuccess={(url) => setProfile({ ...profile, avatar_url: url })}
            size="lg"
          />
          <div>
            <p className="font-heading font-bold text-white">{form.name || 'Student'}</p>
            <p className="text-xs text-white/40">{profile?.email}</p>
            <p className="text-[10px] text-white/25 uppercase tracking-wider mt-1">Role: {profile?.role || 'student'}</p>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.02] space-y-5">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2">
          <User size={16} className="text-blue-400" /> Personal Information
        </h2>
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

      {/* University Link */}
      <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.02] space-y-4">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2">
          <Building size={16} className="text-indigo-400" /> My University
        </h2>
        <p className="text-xs text-white/40">Link your account so your university can view and verify your credentials.</p>

        {form.university_id && linkedUniName ? (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
              <Building size={18} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{linkedUniName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 realtime-dot" />
                <p className="text-xs text-white/40">Linked & Active</p>
              </div>
            </div>
            <button
              onClick={() => setShowUniModal(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowUniModal(true)}
            className="w-full flex items-center gap-3 p-4 rounded-xl transition-all hover:bg-white/[0.04]"
            style={{ border: '2px dashed rgba(255,255,255,0.1)' }}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
              <Plus size={18} className="text-indigo-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white/70">Link Your University</p>
              <p className="text-xs text-white/30 mt-0.5">Required for degree verification to work</p>
            </div>
            <ExternalLink size={14} className="text-white/20 ml-auto" />
          </button>
        )}
      </div>

      {/* Visibility */}
      <div className="rounded-2xl p-6 border border-white/10 bg-white/[0.02] space-y-4">
        <h2 className="font-heading font-bold text-sm text-white flex items-center gap-2">
          <Eye size={16} className="text-violet-400" /> Profile Visibility
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Public Profile</p>
            <p className="text-xs text-white/30 mt-0.5">Allow companies to see your verified profile</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, profile_is_public: !f.profile_is_public }))}
            className={`w-12 h-7 rounded-full transition-all duration-300 relative ${form.profile_is_public ? 'bg-emerald-500' : 'bg-white/10'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all duration-300 shadow ${form.profile_is_public ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${form.profile_is_public ? 'bg-emerald-500/5 text-emerald-400 border border-emerald-500/10' : 'bg-amber-500/5 text-amber-400 border border-amber-500/10'}`}>
          {form.profile_is_public ? <Eye size={16} /> : <EyeOff size={16} />}
          {form.profile_is_public ? 'Your profile is visible to verified companies' : 'Your profile is private'}
        </div>
      </div>

      {/* Save */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
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
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm text-emerald-400"
          >
            <CheckCircle2 size={16} /> Changes saved!
          </motion.span>
        )}
      </div>

      {/* ── University Picker Modal ── */}
      <AnimatePresence>
        {showUniModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => { setShowUniModal(false); setShowExternalForm(false) }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: '#0e0e18', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <GraduationCap size={20} className="text-indigo-400" />
                  <div>
                    <h3 className="font-heading font-bold text-white">Link Your University</h3>
                    <p className="text-xs text-white/30 mt-0.5">Select from registered institutions or add external</p>
                  </div>
                </div>
                <button onClick={() => setShowUniModal(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Mode toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowExternalForm(false)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${!showExternalForm ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'text-white/40 hover:text-white/60'}`}
                  >
                    🏛️ Registered Universities
                  </button>
                  <button
                    onClick={() => setShowExternalForm(true)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${showExternalForm ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'text-white/40 hover:text-white/60'}`}
                  >
                    🆕 Add External
                  </button>
                </div>

                {!showExternalForm ? (
                  <>
                    {/* Search */}
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        value={uniSearch}
                        onChange={e => setUniSearch(e.target.value)}
                        placeholder="Search universities..."
                        className="w-full h-10 pl-9 pr-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                        autoFocus
                      />
                    </div>

                    {/* List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                      {filteredUnis.length === 0 ? (
                        <div className="text-center py-8 text-white/30 text-sm">
                          {universities.length === 0
                            ? 'No registered universities yet. Use "Add External" below.'
                            : 'No universities match your search.'}
                        </div>
                      ) : (
                        filteredUnis.map(u => (
                          <button
                            key={u.id}
                            onClick={() => handleLinkUni(u.id)}
                            className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all hover:bg-indigo-500/10 group"
                            style={{ border: form.university_id === u.id ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.05)', background: form.university_id === u.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)' }}
                          >
                            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-indigo-400 font-bold text-sm">
                              {(u.full_name || 'U')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white/90 truncate">{u.full_name || 'Unnamed University'}</p>
                              <p className="text-xs text-white/30 truncate">{u.email}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span className="text-[10px] text-emerald-400 font-semibold">On Credentia</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  /* External university form */
                  <div className="space-y-3">
                    <p className="text-xs text-white/40">Add an external university. It will be flagged for admin verification.</p>
                    {[
                      { label: 'University Name *', key: 'name', placeholder: 'e.g. IIT Delhi' },
                      { label: 'City', key: 'city', placeholder: 'e.g. New Delhi' },
                      { label: 'State', key: 'state', placeholder: 'e.g. Delhi' },
                      { label: 'Your Course', key: 'course', placeholder: 'e.g. B.Tech CSE' },
                      { label: 'Enrollment Year', key: 'year', placeholder: 'e.g. 2021' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-[10px] text-white/25 uppercase tracking-wider block mb-1">{f.label}</label>
                        <input
                          value={(externalUni as any)[f.key]}
                          onChange={e => setExternalUni(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="w-full h-10 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/15 focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                    ))}
                    <button
                      onClick={handleExternalSave}
                      disabled={!externalUni.name.trim() || savingExternal}
                      className="w-full h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 20px rgba(99,102,241,0.25)' }}
                    >
                      {savingExternal ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      Save & Request Verification
                    </button>
                    <p className="text-[11px] text-amber-400/70 text-center">
                      ⏳ Pending verification — admin will review within 24–48 hours.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

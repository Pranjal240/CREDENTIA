'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Link2, Copy, Check, QrCode, ExternalLink, Eye, Share2 } from 'lucide-react'

export default function MyLinkPage() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [views, setViews] = useState(0)
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase.from('students').select('share_token, profile_views, profile_is_public').eq('id', session.user.id).single()
      if (data?.share_token) { setToken(data.share_token); setViews(data.profile_views || 0); setIsPublic(data.profile_is_public) }
      setLoading(false)
    }
    load()
  }, [])

  const generateLink = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-link', { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setToken(data.token)
    } catch {}
    setGenerating(false)
  }

  const fullUrl = token ? `${window.location.origin}/verify/${token}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareLinks = [
    { label: 'WhatsApp', href: `https://wa.me/?text=Check%20my%20verified%20credentials%3A%20${encodeURIComponent(fullUrl)}`, color: '#25D366' },
    { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`, color: '#0077B5' },
    { label: 'Email', href: `mailto:?subject=My%20Verified%20Credentials&body=${encodeURIComponent(fullUrl)}`, color: 'rgb(var(--accent))' },
  ]

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>My Verified Link</h1>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>Share one link with every company you apply to</p>
      </div>

      {token ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* Link card */}
          <div className="rounded-2xl p-6 border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--teal)))' }}>
                <Link2 size={20} className="text-white" />
              </div>
              <div>
                <p className="font-heading font-bold text-sm" style={{ color: 'rgb(var(--text-primary))' }}>Your Verified Profile</p>
                <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>Anyone with this link can view your credentials</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 px-4 py-3 rounded-xl text-sm truncate" style={{ background: 'rgb(var(--bg-elevated))', color: 'rgb(var(--accent))' }}>
                {fullUrl}
              </div>
              <button onClick={copyLink} className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all" style={{ background: copied ? 'rgb(var(--success))' : 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-hover)))', color: 'white' }}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            {/* Company Access Status Indicator */}
            <div className={`mt-5 p-4 rounded-xl border flex items-center justify-between shadow-sm ${isPublic ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
               <div className="flex items-center gap-3">
                 {isPublic ? <Check size={20} className="text-emerald-500" /> : <Eye size={20} className="text-amber-500" />}
                 <div>
                   <p className="font-heading font-bold text-sm">Company Portal Status</p>
                   <p className="text-xs opacity-80">{isPublic ? 'Your profile has been approved by the Admin and is visible to partnered Companies.' : 'Your profile is currently under Admin review and is not yet visible to Companies.'}</p>
                 </div>
               </div>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-2xl p-5 border flex items-center gap-4" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
            <Eye size={20} style={{ color: 'rgb(var(--accent))' }} />
            <div>
              <p className="font-heading font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{views}</p>
              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>Profile views</p>
            </div>
          </div>

          {/* Share buttons */}
          <div className="rounded-2xl p-5 border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
            <p className="font-heading font-bold text-sm mb-3" style={{ color: 'rgb(var(--text-primary))' }}>Share via</p>
            <div className="flex gap-3">
              {shareLinks.map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noreferrer" className="flex-1 py-3 rounded-xl text-center text-sm font-medium text-white transition-all hover:opacity-90" style={{ background: s.color }}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Preview */}
          <a href={fullUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 py-3 text-sm font-medium" style={{ color: 'rgb(var(--accent))' }}>
            <ExternalLink size={16} /> Preview Your Public Profile
          </a>
        </motion.div>
      ) : (
        <div className="rounded-2xl p-10 border text-center" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
          <Link2 size={48} className="mx-auto mb-4" style={{ color: 'rgb(var(--text-muted))' }} />
          <h2 className="font-heading font-bold mb-2" style={{ color: 'rgb(var(--text-primary))' }}>No Link Generated Yet</h2>
          <p className="text-sm mb-6" style={{ color: 'rgb(var(--text-secondary))' }}>Generate a shareable link to showcase all your verified credentials in one place.</p>
          <button onClick={generateLink} disabled={generating} className="px-6 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 mx-auto disabled:opacity-50" style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-hover)))' }}>
            {generating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Link2 size={18} /> Generate My Link</>}
          </button>
        </div>
      )}
    </div>
  )
}

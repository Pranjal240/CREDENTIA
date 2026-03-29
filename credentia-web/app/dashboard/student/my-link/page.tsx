'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Link2, Copy, Check, ExternalLink, QrCode } from 'lucide-react'
import QRCode from 'react-qr-code'

export default function MyLinkPage() {
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('students').select('*').eq('id', user.id).single()
      setStudent(data)
      setLoading(false)
    }
    load()
  }, [])

  const shareUrl = student?.share_token ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://credentiaonline.in'}/verify/${student.share_token}` : null

  const generateLink = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const res = await fetch('/api/generate-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: user.id }) })
    const data = await res.json()
    if (data.success) setStudent({ ...student, share_token: data.token, profile_is_public: true })
  }

  const copyLink = () => {
    if (shareUrl) navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-2 border-[#F5C542] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link2 size={24} className="text-[#F5C542]" />
        <h1 className="font-syne text-2xl font-extrabold text-white">My Verified Link</h1>
      </div>

      {shareUrl ? (
        <div className="space-y-6">
          <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
            <h3 className="font-syne font-bold text-white mb-3">Your Verified Profile Link</h3>
            <div className="flex items-center gap-3 bg-[#1C1C26] rounded-xl px-4 py-3 border border-[#2A2A3A] mb-4">
              <span className="text-[#F5C542] text-sm flex-1 truncate">{shareUrl}</span>
              <button onClick={copyLink} className="text-[#F5C542] hover:text-white transition-colors">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <a href={shareUrl} target="_blank" rel="noreferrer" className="text-[#9999AA] hover:text-white transition-colors">
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
            <h3 className="font-syne font-bold text-white mb-3">Share Via</h3>
            <div className="flex flex-wrap gap-3">
              <a href={`https://wa.me/?text=Check my verified credentials: ${shareUrl}`} target="_blank" rel="noreferrer" className="bg-[#25D366]/10 text-[#25D366] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#25D366]/20 transition-all">WhatsApp</a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`} target="_blank" rel="noreferrer" className="bg-[#0A66C2]/10 text-[#0A66C2] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0A66C2]/20 transition-all">LinkedIn</a>
              <a href={`mailto:?subject=My Verified Profile&body=Check my verified credentials: ${shareUrl}`} className="bg-[#9999AA]/10 text-[#9999AA] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#9999AA]/20 transition-all">Email</a>
              <a href={`https://twitter.com/intent/tweet?text=My verified credentials: ${shareUrl}`} target="_blank" rel="noreferrer" className="bg-[#1DA1F2]/10 text-[#1DA1F2] px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#1DA1F2]/20 transition-all">Twitter</a>
            </div>
          </div>

          <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6 flex flex-col items-center">
            <h3 className="font-syne font-bold text-white mb-4">QR Code</h3>
            <div className="p-4 bg-white rounded-2xl">
              <QRCode value={shareUrl} size={180} bgColor="#FFFFFF" fgColor="#0A0A0F" />
            </div>
            <p className="text-[#9999AA] text-xs mt-3">Scan to view verified profile</p>
          </div>

          {student?.profile_views > 0 && (
            <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-4 text-center">
              <span className="text-[#9999AA] text-sm">Profile Views: </span>
              <span className="text-white font-bold">{student.profile_views}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-12 text-center">
          <QrCode size={48} className="text-[#9999AA] mx-auto mb-4" />
          <h3 className="font-syne font-bold text-white text-lg mb-2">Generate Your Verified Link</h3>
          <p className="text-[#9999AA] text-sm mb-6">Create a shareable link that shows your verification status to anyone.</p>
          <button onClick={generateLink} className="bg-[#F5C542] text-black font-bold px-8 py-3 rounded-xl hover:bg-[#D4A017] transition-all">
            Generate My Link
          </button>
        </div>
      )}
    </div>
  )
}

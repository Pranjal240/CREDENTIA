'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, QrCode, Copy, Share2, Check } from 'lucide-react'
import QRCode from 'react-qr-code'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

export default function MyLinkPage() {
  const [student, setStudent] = useState<{ share_token?: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://credentiaonline.in'

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('students').select('share_token').eq('id', user.id).single()
      setStudent(data)
    }
    load()
  }, [])

  const verifyUrl = student?.share_token ? `${appUrl}/verify/${student.share_token}` : ''

  const copyLink = async () => {
    let token = student?.share_token
    if (!token) {
      const res = await fetch('/api/generate-link', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        token = data.token
        setStudent({ ...student, share_token: token })
      } else {
        return
      }
    }
    
    navigator.clipboard.writeText(`${appUrl}/verify/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOptions = [
    {
      name: 'WhatsApp',
      color: 'bg-green-500',
      url: `https://wa.me/?text=Check my verified CREDENTIA profile: ${verifyUrl}`,
      icon: '💬',
    },
    {
      name: 'LinkedIn',
      color: 'bg-blue-600',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${verifyUrl}`,
      icon: '💼',
    },
    {
      name: 'Email',
      color: 'bg-purple-600',
      url: `mailto:?subject=My CREDENTIA Verified Profile&body=Hi! Check my credential-verified profile: ${verifyUrl}`,
      icon: '📧',
    },
    {
      name: 'Twitter',
      color: 'bg-sky-500',
      url: `https://twitter.com/intent/tweet?text=My credentials are AI-verified! Check it out: ${verifyUrl}`,
      icon: '🐦',
    },
  ]

  return (
    <div className="min-h-screen dark:bg-[#0A0A0F] bg-[#F4F4F8] pb-16">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/dashboard/student" className="inline-flex items-center gap-2 dark:text-[#9999AA] text-gray-500 hover:dark:text-white mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <h1 className="font-syne font-bold text-3xl dark:text-white text-gray-900 mb-2">My Verified Link</h1>
        <p className="dark:text-[#9999AA] text-gray-500 mb-8">Share this link with anyone to show your verified credentials</p>

        {/* Link Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-8 mb-6">
          <div className="flex items-center gap-3 dark:bg-[#0A0A0F] bg-gray-50 rounded-xl px-4 py-4 border dark:border-[#2A2A3A] border-gray-200 mb-6">
            <span className="text-sm dark:text-white text-gray-800 truncate flex-1">{verifyUrl || 'Complete a verification to get your link'}</span>
            <button
              onClick={copyLink}
              disabled={!verifyUrl}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                copied ? 'bg-green-500/20 text-green-400' : 'bg-[#F5C542]/20 text-[#F5C542] hover:bg-[#F5C542]/30'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* QR Code */}
          {verifyUrl && (
            <div className="flex flex-col items-center p-6 dark:bg-[#0A0A0F] bg-gray-50 rounded-2xl border dark:border-[#2A2A3A] border-gray-200 mb-6">
              <div className="bg-white p-4 rounded-xl mb-3">
                <QRCode value={verifyUrl} size={160} />
              </div>
              <p className="text-sm dark:text-[#9999AA] text-gray-500">Scan to view profile</p>
            </div>
          )}

          {/* Share buttons */}
          <h3 className="font-syne font-bold dark:text-white text-gray-900 mb-4 text-sm">Share Directly</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {shareOptions.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-2 ${s.color} rounded-xl p-4 text-white text-sm font-medium hover:opacity-90 transition-all`}
              >
                <span className="text-2xl">{s.icon}</span>
                {s.name}
              </a>
            ))}
          </div>
        </motion.div>

        {/* Preview */}
        {verifyUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Link
              href={verifyUrl.replace(appUrl, '')}
              className="inline-flex items-center gap-2 text-[#F5C542] hover:underline text-sm"
            >
              Preview your public profile →
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

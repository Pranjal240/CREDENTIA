'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { motion } from 'framer-motion'
import { Shield, CheckCircle, XCircle, FileText, Fingerprint, GraduationCap, Star } from 'lucide-react'

type Student = {
  id: string
  ats_score: number
  verification_score: number
  cgpa?: number
  course?: string
  branch?: string
  graduation_year?: number
  aadhaar_verified: boolean
  police_verified: boolean
  degree_verified: boolean
  police_share_with_companies: boolean
  profile_views: number
  share_token: string
  profiles: { full_name: string; avatar_url?: string }
  universities?: { university_name: string }
}

type Verification = { type: string; status: string; ai_confidence: number }

export default function VerifyClient({ token }: { token: string }) {
  const [student, setStudent] = useState<Student | null>(null)
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${token}`

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/public/profile/${token}`)
      if (!res.ok) { setNotFound(true); setLoading(false); return }
      const data = await res.json()
      setStudent(data.student)
      setVerifications(data.verifications || [])
      setLoading(false)
    }
    load()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-[#0A0A0F] bg-[#F4F4F8] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#F5C542] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !student) {
    return (
      <div className="min-h-screen dark:bg-[#0A0A0F] bg-[#F4F4F8] flex items-center justify-center text-center px-4">
        <div>
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="font-syne font-bold text-3xl dark:text-white text-gray-900 mb-2">Profile Not Found</h1>
          <p className="dark:text-[#9999AA] text-gray-500 mb-6">This profile may be private or the link is invalid.</p>
          <Link href="/" className="px-6 py-3 bg-[#F5C542] text-black rounded-xl font-semibold hover:bg-[#D4A017] transition-all">Go Home</Link>
        </div>
      </div>
    )
  }

  const name = student.profiles.full_name
  const initial = name?.[0] || 'S'

  const verifyBadges = [
    { key: 'resume', label: 'Resume ATS', icon: <FileText size={18} />, score: student.ats_score, verified: student.ats_score > 0 },
    { key: 'aadhaar', label: 'Aadhaar', icon: <Fingerprint size={18} />, verified: student.aadhaar_verified },
    { key: 'police', label: 'Police', icon: <Shield size={18} />, verified: student.police_verified && student.police_share_with_companies },
    { key: 'degree', label: 'Degree', icon: <GraduationCap size={18} />, verified: student.degree_verified },
  ]

  const verifiedCount = verifyBadges.filter((b) => b.verified).length

  return (
    <div className="min-h-screen dark:bg-[#0A0A0F] bg-[#F4F4F8]">
      {/* Header */}
      <div className="border-b dark:border-[#2A2A3A] border-gray-100 dark:bg-[#0A0A0F] bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-syne font-extrabold text-xl text-[#F5C542]">CREDENTIA</Link>
          <span className="text-xs dark:text-[#9999AA] text-gray-400">Verified Profile Page</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Profile Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="dark:bg-[#13131A] bg-white rounded-3xl border dark:border-[#2A2A3A] border-gray-100 p-8 mb-6 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#F5C542]/5 via-transparent to-purple-600/5" />
          <div className="relative z-10">
            <div className="w-24 h-24 rounded-full bg-[#F5C542] flex items-center justify-center text-4xl font-bold text-black mx-auto mb-4">
              {initial}
            </div>
            <h1 className="font-syne font-bold text-3xl dark:text-white text-gray-900 mb-1">{name}</h1>
            {student.universities?.university_name && (
              <p className="dark:text-[#9999AA] text-gray-500 text-sm mb-2">{student.universities.university_name}</p>
            )}
            {student.branch && <p className="dark:text-[#9999AA] text-gray-500 text-sm">{student.branch} {student.course}</p>}

            {/* Verification Seal */}
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-[#F5C542]/15 border border-[#F5C542]/30">
              <Star size={14} className="text-[#F5C542]" />
              <span className="text-sm font-semibold text-[#F5C542]">CREDENTIA VERIFIED — {student.verification_score}%</span>
            </div>
          </div>
        </motion.div>

        {/* Score + QR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Score */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6"
          >
            <h3 className="font-syne font-bold dark:text-white text-gray-900 mb-4">Verification Scores</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm dark:text-[#9999AA] text-gray-500">Overall Verification</span>
                  <span className="text-sm font-bold dark:text-white text-gray-900">{student.verification_score}%</span>
                </div>
                <div className="w-full h-2 dark:bg-[#2A2A3A] bg-gray-200 rounded-full">
                  <div className="h-full bg-[#F5C542] rounded-full" style={{ width: `${student.verification_score}%` }} />
                </div>
              </div>
              {student.ats_score > 0 && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm dark:text-[#9999AA] text-gray-500">ATS Resume Score</span>
                    <span className="text-sm font-bold dark:text-white text-gray-900">{student.ats_score}/100</span>
                  </div>
                  <div className="w-full h-2 dark:bg-[#2A2A3A] bg-gray-200 rounded-full">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${student.ats_score}%` }} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* QR Code */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6 flex flex-col items-center gap-3"
          >
            <h3 className="font-syne font-bold dark:text-white text-gray-900 self-start">Scan to Verify</h3>
            <div className="bg-white p-3 rounded-xl">
              <QRCode value={profileUrl} size={120} />
            </div>
            <p className="text-xs dark:text-[#9999AA] text-gray-400 text-center">Scan to access this profile</p>
          </motion.div>
        </div>

        {/* Verification Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6 mb-6"
        >
          <h3 className="font-syne font-bold dark:text-white text-gray-900 mb-4">
            Verified Credentials ({verifiedCount}/{verifyBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {verifyBadges.map((badge) => (
              <div
                key={badge.key}
                className={`p-4 rounded-xl border text-center transition-all ${
                  badge.verified
                    ? 'dark:bg-green-500/10 bg-green-50 border-green-500/30'
                    : 'dark:bg-[#2A2A3A] bg-gray-50 dark:border-[#2A2A3A] border-gray-100 opacity-50'
                }`}
              >
                <div className={`flex justify-center mb-2 ${badge.verified ? 'text-green-400' : 'dark:text-[#9999AA] text-gray-400'}`}>
                  {badge.icon}
                </div>
                <p className="text-xs font-medium dark:text-white text-gray-900 mb-1">{badge.label}</p>
                {badge.verified ? (
                  <span className="text-xs text-green-400 flex items-center justify-center gap-1">
                    <CheckCircle size={12} /> Verified
                  </span>
                ) : (
                  <span className="text-xs dark:text-[#9999AA] text-gray-400 flex items-center justify-center gap-1">
                    <XCircle size={12} /> Not yet
                  </span>
                )}
                {badge.score !== undefined && badge.verified && (
                  <p className="text-xs text-[#F5C542] mt-1">{badge.score}/100</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer note */}
        <div className="text-center">
          <p className="text-xs dark:text-[#9999AA] text-gray-400">
            This verification is powered by{' '}
            <span className="text-[#F5C542] font-medium">CREDENTIA</span> — India&apos;s AI credential platform.
            Viewed {student.profile_views} times.
          </p>
        </div>
      </div>
    </div>
  )
}

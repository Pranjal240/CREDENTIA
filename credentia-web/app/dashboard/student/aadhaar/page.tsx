'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function AadhaarPage() {
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!frontFile) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const fd = new FormData()
      fd.append('file', frontFile)
      fd.append('folder', 'aadhaar')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      const { url, success, error: uploadErr } = await uploadRes.json()
      if (!success) throw new Error(uploadErr)

      const res = await fetch('/api/verify-aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id, fileUrl: url }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setResult(data.analysis)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dark:bg-[#0A0A0F] bg-[#F4F4F8] pb-16">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link href="/dashboard/student" className="inline-flex items-center gap-2 dark:text-[#9999AA] text-gray-500 mb-6 hover:dark:text-white">
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="font-syne font-bold text-3xl dark:text-white text-gray-900 mb-2">Aadhaar Verification</h1>
        <p className="dark:text-[#9999AA] text-gray-500 mb-8">Privacy-first verification. Your full Aadhaar number is NEVER stored.</p>

        {/* Privacy notice */}
        <div className="dark:bg-green-500/10 bg-green-50 border dark:border-green-500/20 border-green-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <Shield className="text-green-400 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-medium dark:text-green-300 text-green-700">Your data is safe</p>
            <p className="text-xs dark:text-green-400/80 text-green-600 mt-1">Only last 4 digits, name, date of birth, and state are extracted. No biometric data is stored.</p>
          </div>
        </div>

        <div className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[
              { label: 'Aadhaar Front', set: setFrontFile, file: frontFile },
              { label: 'Aadhaar Back (optional)', set: setBackFile, file: backFile },
            ].map(({ label, set, file }) => (
              <label key={label} className="block rounded-2xl border-2 border-dashed dark:border-[#2A2A3A] border-gray-200 p-8 text-center cursor-pointer hover:dark:border-[#F5C542] hover:border-[#F5C542] transition-all">
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => set(e.target.files?.[0] || null)} />
                <span className="text-3xl block mb-2">🪪</span>
                <p className="text-sm dark:text-white text-gray-900 font-medium">{file ? file.name : label}</p>
                <p className="text-xs dark:text-[#9999AA] text-gray-400 mt-1">JPG, PNG, PDF</p>
              </label>
            ))}
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 dark:bg-[#0A0A0F] bg-gray-50 rounded-xl border dark:border-[#2A2A3A] border-gray-200">
              <p className="text-sm font-medium dark:text-white text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-green-400">✅</span> Verification Complete
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Name', result.name as string],
                  ['DOB', result.dob as string],
                  ['Gender', result.gender as string],
                  ['State', result.state as string],
                  ['Last 4 Digits', result.aadhaar_last4 ? `XXXX-XXXX-${result.aadhaar_last4}` : 'N/A'],
                  ['Confidence', `${result.confidence}%`],
                ].map(([key, val]) => (
                  <div key={key}>
                    <p className="text-xs dark:text-[#9999AA] text-gray-500">{key}</p>
                    <p className="text-sm dark:text-white text-gray-900 font-medium">{val || '—'}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {error && <p className="text-red-400 text-sm mb-4 bg-red-400/10 rounded-xl px-3 py-2">{error}</p>}

          <button
            onClick={submit}
            disabled={loading || !frontFile}
            className="w-full py-4 rounded-xl bg-[#F5C542] text-black font-semibold text-lg hover:bg-[#D4A017] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={20} className="animate-spin" /> Verifying...</> : 'Verify Aadhaar →'}
          </button>
        </div>
      </div>
    </div>
  )
}

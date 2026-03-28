'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

const steps = ['Upload Certificate', 'AI Analysis', 'Admin Review']

export default function PolicePage() {
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState<'upload' | 'manual'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [manualData, setManualData] = useState({
    certificateNumber: '',
    issueDate: '',
    issuingAuthority: '',
    district: '',
    state: '',
    policeStation: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')

  const supabase = createClient()

  const submit = async () => {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      let fileUrl = ''
      if (mode === 'upload' && file) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', 'police')
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const d = await res.json()
        if (!d.success) throw new Error(d.error)
        fileUrl = d.url
      }

      const res = await fetch('/api/verify-police', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          fileUrl,
          manualData: mode === 'manual' ? manualData : null,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setResult(data.analysis)
      setStep(1)
      setTimeout(() => setStep(2), 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dark:bg-[#0A0A0F] bg-[#F4F4F8] pb-16">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link href="/dashboard/student" className="inline-flex items-center gap-2 dark:text-[#9999AA] text-gray-500 mb-6 transition-colors hover:dark:text-white">
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="font-syne font-bold text-3xl dark:text-white text-gray-900 mb-2">Police Verification</h1>
        <p className="dark:text-[#9999AA] text-gray-500 mb-8">AI pre-screening + admin manual review</p>

        {/* Steps indicator */}
        <div className="flex items-center gap-4 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step > i ? 'bg-green-500 text-white' : step === i ? 'bg-[#F5C542] text-black' : 'dark:bg-[#2A2A3A] bg-gray-200 dark:text-[#9999AA] text-gray-400'
              }`}>{step > i ? '✓' : i + 1}</div>
              <span className="text-sm dark:text-[#9999AA] text-gray-500 hidden sm:inline">{s}</span>
              {i < steps.length - 1 && <div className={`hidden sm:block w-16 h-0.5 ${step > i ? 'bg-green-500' : 'dark:bg-[#2A2A3A] bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Notice */}
        <div className="dark:bg-orange-500/10 bg-orange-50 border dark:border-orange-500/20 border-orange-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
          <span className="text-orange-400 text-lg">⚠️</span>
          <div>
            <p className="text-sm font-medium dark:text-orange-300 text-orange-700">Manual Admin Review Required</p>
            <p className="text-xs dark:text-orange-400/80 text-orange-600 mt-1">
              Police certificates require human verification after AI pre-screening. Processing may take 24-48 hours.
            </p>
          </div>
        </div>

        <div className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-8">
          {/* Mode Switch */}
          <div className="flex gap-2 mb-6">
            {(['upload', 'manual'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-3 rounded-xl text-sm font-medium capitalize transition-all ${
                  mode === m ? 'bg-[#F5C542] text-black' : 'border dark:border-[#2A2A3A] border-gray-200 dark:text-[#9999AA] text-gray-500'
                }`}
              >
                {m === 'upload' ? '📄 Upload PDF/Image' : '✍️ Manual Entry'}
              </button>
            ))}
          </div>

          {mode === 'upload' ? (
            <label className="block w-full rounded-2xl border-2 border-dashed dark:border-[#2A2A3A] border-gray-200 p-10 cursor-pointer hover:dark:border-[#F5C542] hover:border-[#F5C542] transition-all text-center">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <span className="text-4xl block mb-3">🔏</span>
              <p className="dark:text-white text-gray-900 font-medium">{file ? file.name : 'Upload Police Certificate'}</p>
              <p className="text-sm dark:text-[#9999AA] text-gray-500 mt-1">PDF, JPG, PNG • Max 10MB</p>
            </label>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(manualData).map(([key, val]) => (
                <div key={key}>
                  <label className="block text-xs dark:text-[#9999AA] text-gray-500 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <input
                    value={val}
                    onChange={(e) => setManualData((d) => ({ ...d, [key]: e.target.value }))}
                    placeholder={key}
                    className="w-full px-4 py-3 rounded-xl dark:bg-[#0A0A0F] bg-gray-50 border dark:border-[#2A2A3A] border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-[#F5C542]"
                  />
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-red-400 text-sm mt-4 bg-red-400/10 rounded-xl px-3 py-2">{error}</p>}

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 dark:bg-[#0A0A0F] bg-gray-50 rounded-xl border dark:border-[#2A2A3A] border-gray-200">
              <p className="text-sm font-medium dark:text-white text-gray-900 mb-2">AI Pre-Screening Complete</p>
              <div className="flex flex-wrap gap-3">
                <span className="text-xs px-2 py-1 rounded-full bg-[#F5C542]/20 text-[#F5C542]">Confidence: {(result.confidence as number) || 0}%</span>
                <span className={`text-xs px-2 py-1 rounded-full ${(result.confidence as number) >= 85 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {(result.confidence as number) >= 85 ? 'High Confidence' : 'Needs Admin Review'}
                </span>
              </div>
              <p className="text-xs dark:text-[#9999AA] text-gray-500 mt-2">Admin will review within 24-48 hours. You will receive a notification.</p>
            </motion.div>
          )}

          <button
            onClick={submit}
            disabled={loading || (mode === 'upload' && !file)}
            className="w-full mt-6 py-4 rounded-xl bg-[#F5C542] text-black font-semibold text-lg hover:bg-[#D4A017] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={20} className="animate-spin" /> Processing...</> : 'Submit for Verification →'}
          </button>
        </div>
      </div>
    </div>
  )
}

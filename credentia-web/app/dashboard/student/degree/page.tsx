'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function DegreePage() {
  const [mode, setMode] = useState<'upload' | 'manual'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [manualData, setManualData] = useState({ university: '', degree: '', rollNumber: '', cgpa: '', year: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const submit = async () => {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const fd = new FormData()
      fd.append('folder', 'degrees')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
      const { url, success, error: uploadErr } = await uploadRes.json()
      if (!success) throw new Error(uploadErr)

      const res = await fetch('/api/verify-degree', {
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
        <h1 className="font-syne font-bold text-3xl dark:text-white text-gray-900 mb-2">Degree Verification</h1>
        <p className="dark:text-[#9999AA] text-gray-500 mb-8">Upload your degree certificate for AI verification</p>

        <div className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-8">
          <label className="block w-full rounded-2xl border-2 border-dashed dark:border-[#2A2A3A] border-gray-200 p-14 text-center cursor-pointer hover:dark:border-[#F5C542] hover:border-[#F5C542] transition-all mb-6">
            <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <span className="text-5xl block mb-4">🎓</span>
            <p className="dark:text-white text-gray-900 font-medium mb-1">{file ? file.name : 'Upload Degree Certificate'}</p>
            <p className="text-sm dark:text-[#9999AA] text-gray-500">PDF or image • Max 10MB</p>
          </label>

          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-5 dark:bg-[#0A0A0F] bg-gray-50 rounded-xl border dark:border-[#2A2A3A] border-gray-200">
              <p className="text-sm font-medium dark:text-white text-gray-900 mb-3 flex items-center gap-2">
                <span className={(result.verified as boolean) ? 'text-green-400' : 'text-yellow-400'}>
                  {(result.verified as boolean) ? '✅' : '⚠️'}
                </span>
                {(result.verified as boolean) ? 'Degree Verified!' : 'Needs Review'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['University', result.university_name as string],
                  ['Degree', result.degree as string],
                  ['Course', result.course as string],
                  ['Year', result.year_of_passing as string],
                  ['Grade/CGPA', result.grade_cgpa as string],
                  ['Roll No', result.roll_number as string],
                ].map(([key, val]) => (
                  <div key={key as string}>
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
            disabled={loading || !file}
            className="w-full py-4 rounded-xl bg-[#F5C542] text-black font-semibold text-lg hover:bg-[#D4A017] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={20} className="animate-spin" /> Verifying...</> : 'Verify Degree →'}
          </button>
        </div>
      </div>
    </div>
  )
}

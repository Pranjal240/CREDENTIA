'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Upload, Link2, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

type Mode = 'upload' | 'link' | 'paste'
type AnalysisResult = {
  ats_score: number
  authenticity_score: number
  found_keywords: string[]
  missing_keywords: string[]
  feedback: string
  verified: boolean
  issues: string[]
}

export default function ResumePage() {
  const [mode, setMode] = useState<Mode>('upload')
  const [link, setLink] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState('')

  const onDrop = useCallback((accepted: File[]) => {
    setFile(accepted[0])
    setResult(null)
    setError('')
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const analyze = async () => {
    setLoading(true)
    setError('')
    setProgress(0)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const interval = setInterval(() => setProgress((p) => Math.min(p + 12, 90)), 400)

    try {
      let fileUrl = ''

      if (mode === 'upload' && file) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', 'resumes')
        fd.append('studentId', user.id)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const uploadData = await uploadRes.json()
        if (!uploadData.success) throw new Error(uploadData.error)
        fileUrl = uploadData.url
      }

      const body: Record<string, string> = { studentId: user.id }
      if (mode === 'upload') body.fileUrl = fileUrl
      if (mode === 'link') body.linkUrl = link
      if (mode === 'paste') body.textContent = pasteText

      const res = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setResult(data.analysis)
    } catch (e: any) {
      setError(e.message)
    } finally {
      clearInterval(interval)
      setProgress(100)
      setLoading(false)
    }
  }

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="min-h-screen dark:bg-[#0A0A0F] bg-[#F4F4F8] pb-16">
      {/* Nav */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/dashboard/student" className="inline-flex items-center gap-2 dark:text-[#9999AA] text-gray-500 hover:dark:text-white hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <h1 className="font-syne font-bold text-3xl dark:text-white text-gray-900 mb-2">Resume Analysis</h1>
        <p className="dark:text-[#9999AA] text-gray-500 mb-8">AI-powered ATS scoring and authenticity check</p>

        {!result ? (
          <div className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-8">
            {/* Mode selector */}
            <div className="flex border dark:border-[#2A2A3A] border-gray-200 rounded-xl overflow-hidden mb-8">
              {(['upload', 'link', 'paste'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-3 text-sm font-medium capitalize transition-all ${
                    mode === m ? 'bg-[#F5C542] text-black' : 'dark:text-[#9999AA] text-gray-500 hover:dark:bg-[#1C1C26] hover:bg-gray-50'
                  }`}
                >
                  {m === 'upload' ? '📤 Upload File' : m === 'link' ? '🔗 Paste URL' : '📝 Paste Text'}
                </button>
              ))}
            </div>

            {/* Upload zone */}
            {mode === 'upload' && (
              <div
                {...getRootProps()}
                className={`rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
                  isDragActive ? 'border-[#F5C542] dark:bg-[#F5C542]/5 bg-yellow-50' : 'dark:border-[#2A2A3A] border-gray-200'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto mb-4 dark:text-[#9999AA] text-gray-400" size={40} />
                <p className="dark:text-white text-gray-900 font-medium mb-1">
                  {file ? file.name : isDragActive ? 'Drop it here!' : 'Drag & drop your resume'}
                </p>
                <p className="text-sm dark:text-[#9999AA] text-gray-500">PDF, DOC, DOCX • Max 10MB</p>
                {file && <p className="mt-2 text-sm text-green-400">✅ {file.name} ready</p>}
              </div>
            )}

            {/* Link mode */}
            {mode === 'link' && (
              <div className="space-y-4">
                <label className="block dark:text-white text-gray-900 text-sm font-medium">Resume URL (LinkedIn, Drive, Dropbox)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl dark:bg-[#0A0A0F] bg-gray-50 border dark:border-[#2A2A3A] border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-[#F5C542]"
                />
              </div>
            )}

            {/* Paste mode */}
            {mode === 'paste' && (
              <div>
                <label className="block dark:text-white text-gray-900 text-sm font-medium mb-2">Paste Resume Text</label>
                <textarea
                  placeholder="Paste your resume content here..."
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={14}
                  className="w-full px-4 py-3 rounded-xl dark:bg-[#0A0A0F] bg-gray-50 border dark:border-[#2A2A3A] border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-[#F5C542] resize-none"
                />
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                <XCircle size={16} /> {error}
              </div>
            )}

            {/* Progress */}
            {loading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm dark:text-[#9999AA] text-gray-500">Analyzing with Groq AI...</span>
                  <span className="text-sm text-[#F5C542]">{progress}%</span>
                </div>
                <div className="w-full h-2 dark:bg-[#2A2A3A] bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#F5C542] rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={analyze}
              disabled={loading || (mode === 'upload' && !file) || (mode === 'link' && !link) || (mode === 'paste' && !pasteText)}
              className="w-full mt-8 py-4 rounded-xl bg-[#F5C542] text-black font-semibold text-lg hover:bg-[#D4A017] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={20} className="animate-spin" /> Analyzing...</> : 'Analyze Resume with AI →'}
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Score cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6 text-center">
                <div className={`font-syne font-extrabold text-6xl mb-2 ${scoreColor(result.ats_score)}`}>
                  {result.ats_score}
                </div>
                <div className="dark:text-[#9999AA] text-gray-500 text-sm">ATS Score</div>
                <div className={`mt-2 text-xs px-2 py-1 rounded-full inline-block ${result.ats_score >= 80 ? 'bg-green-500/20 text-green-400' : result.ats_score >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                  {result.ats_score >= 80 ? 'Excellent' : result.ats_score >= 60 ? 'Good' : 'Needs Work'}
                </div>
              </div>
              <div className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6 text-center">
                <div className={`font-syne font-extrabold text-6xl mb-2 ${scoreColor(result.authenticity_score)}`}>
                  {result.authenticity_score}
                </div>
                <div className="dark:text-[#9999AA] text-gray-500 text-sm">Authenticity</div>
                <div className={`mt-2 text-xs px-2 py-1 rounded-full inline-block ${result.verified ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {result.verified ? '✅ Verified' : '⚠️ Review Needed'}
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6">
              <h3 className="font-syne font-bold dark:text-white text-gray-900 mb-3">AI Feedback</h3>
              <p className="text-sm dark:text-[#9999AA] text-gray-500 leading-relaxed">{result.feedback}</p>
            </div>

            {/* Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6">
                <h3 className="font-syne font-bold dark:text-white text-gray-900 mb-3 text-sm">✅ Found Keywords ({result.found_keywords.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {result.found_keywords.map((k) => (
                    <span key={k} className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">{k}</span>
                  ))}
                </div>
              </div>
              <div className="dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-6">
                <h3 className="font-syne font-bold dark:text-white text-gray-900 mb-3 text-sm">❌ Missing Keywords ({result.missing_keywords.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {result.missing_keywords.map((k) => (
                    <span key={k} className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">{k}</span>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={() => setResult(null)} className="w-full py-3 rounded-xl border dark:border-[#2A2A3A] border-gray-200 dark:text-white text-gray-900 text-sm hover:dark:bg-[#1C1C26] hover:bg-gray-50 transition-all">
              Analyze Another
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

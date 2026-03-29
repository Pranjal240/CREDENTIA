'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useDropzone } from 'react-dropzone'
import { FileText, Upload, Loader2, RefreshCw } from 'lucide-react'
import { getScoreColor } from '@/lib/utils'

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState('')

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
    onDrop: (files) => { setFile(files[0]); setError('') },
  })

  const analyze = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let fileUrl = linkUrl

      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'resumes')
        formData.append('studentId', user.id)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (!uploadData.success) throw new Error(uploadData.error)
        fileUrl = uploadData.url
      }

      const analyzeRes = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, studentId: user.id }),
      })
      const analyzeData = await analyzeRes.json()
      if (!analyzeData.success) throw new Error(analyzeData.error)
      setAnalysis(analyzeData.analysis)
    } catch (err: any) {
      setError(err.message || 'Analysis failed')
    }
    setLoading(false)
  }

  const reset = () => { setFile(null); setLinkUrl(''); setAnalysis(null); setError('') }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <FileText size={24} className="text-[#F5C542]" />
        <h1 className="font-syne text-2xl font-extrabold text-white">Resume Analysis</h1>
      </div>

      {!analysis ? (
        <div className="space-y-6">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`bg-[#13131A] border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-[#F5C542] bg-[#F5C542]/5' : 'border-[#2A2A3A] hover:border-[#F5C542]/50'}`}
          >
            <input {...getInputProps()} />
            <Upload size={40} className="text-[#9999AA] mx-auto mb-4" />
            {file ? (
              <p className="text-white font-medium">{file.name} <span className="text-[#9999AA]">({(file.size / 1024).toFixed(0)} KB)</span></p>
            ) : (
              <>
                <p className="text-white font-medium mb-1">Drop your resume here</p>
                <p className="text-[#9999AA] text-sm">PDF, DOC, or DOCX — max 10MB</p>
              </>
            )}
          </div>

          {/* Or paste link */}
          <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5">
            <p className="text-[#9999AA] text-sm mb-3">Or paste a link to your resume:</p>
            <input
              type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#1C1C26] border border-[#2A2A3A] text-white text-sm focus:border-[#F5C542] outline-none"
              placeholder="https://drive.google.com/..."
            />
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

          <button
            onClick={analyze}
            disabled={(!file && !linkUrl) || loading}
            className="bg-[#F5C542] text-black font-bold h-12 px-8 rounded-xl hover:bg-[#D4A017] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : 'Analyze Now →'}
          </button>

          {loading && (
            <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-8 text-center">
              <div className="w-12 h-12 border-2 border-[#F5C542] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">🤖 AI is analyzing your resume...</p>
              <p className="text-[#9999AA] text-sm mt-1">This takes 10-30 seconds</p>
            </div>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Score */}
          <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-syne font-bold text-white">ATS SCORE</h3>
              <span className="font-syne text-3xl font-extrabold" style={{ color: getScoreColor(analysis.ats_score) }}>{analysis.ats_score}/100</span>
            </div>
            <div className="bg-[#1C1C26] rounded-full h-3 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${analysis.ats_score}%`, background: getScoreColor(analysis.ats_score) }} />
            </div>
            <p className="text-[#9999AA] text-sm mt-2">{analysis.ats_score >= 75 ? '🎉 Excellent!' : analysis.ats_score >= 50 ? '👍 Good, room to improve' : '⚠️ Needs significant improvement'}</p>
          </div>

          {/* Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5">
              <h4 className="font-syne font-bold text-white text-sm mb-3">✅ Keywords Found</h4>
              <div className="flex flex-wrap gap-2">
                {(analysis.keywords_found || []).map((k: string, i: number) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{k}</span>
                ))}
              </div>
            </div>
            <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5">
              <h4 className="font-syne font-bold text-white text-sm mb-3">❌ Missing Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {(analysis.keywords_missing || []).map((k: string, i: number) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{k}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5">
              <h4 className="font-syne font-bold text-white text-sm mb-3">💪 Strengths</h4>
              <ul className="space-y-2">
                {(analysis.strengths || []).map((s: string, i: number) => (
                  <li key={i} className="text-[#CCCCDD] text-sm flex items-start gap-2"><span className="text-green-400">•</span> {s}</li>
                ))}
              </ul>
            </div>
            <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5">
              <h4 className="font-syne font-bold text-white text-sm mb-3">💡 Improvements</h4>
              <ul className="space-y-2">
                {(analysis.improvements || []).map((s: string, i: number) => (
                  <li key={i} className="text-[#CCCCDD] text-sm flex items-start gap-2"><span className="text-yellow-400">•</span> {s}</li>
                ))}
              </ul>
            </div>
          </div>

          <button onClick={reset} className="flex items-center gap-2 text-[#F5C542] text-sm hover:underline">
            <RefreshCw size={14} /> Re-analyze with another resume
          </button>
        </motion.div>
      )}
    </div>
  )
}

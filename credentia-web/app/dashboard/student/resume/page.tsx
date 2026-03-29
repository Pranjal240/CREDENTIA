'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Sparkles, RotateCcw } from 'lucide-react'

export default function ResumePage() {
  const [userId, setUserId] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id)
    })
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) { setFile(acceptedFiles[0]); setResult(null); setError('') }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  })

  const handleUploadAndAnalyze = async () => {
    if (!file || !userId) { setError('Please login first'); return }
    setUploading(true); setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'resumes')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const uploadData = await uploadRes.json()

      setUploading(false); setAnalyzing(true)

      const analyzeRes = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: uploadData.url, studentId: userId }),
      })
      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Analysis failed')
      }
      const analysisData = await analyzeRes.json()
      setResult(analysisData.analysis || analysisData)
      setAnalyzing(false)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setUploading(false); setAnalyzing(false)
    }
  }

  const reset = () => { setFile(null); setResult(null); setError('') }

  const scoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#eab308'
    return '#ef4444'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Resume Analysis</h1>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>Upload your resume for AI-powered ATS scoring</p>
      </div>

      {!result ? (
        <div className="rounded-2xl p-8 border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-500 bg-blue-500/5' : ''}`}
            style={{ borderColor: file ? '#22c55e' : isDragActive ? 'rgb(var(--accent))' : 'rgba(var(--border-default), 0.6)', background: file ? 'rgba(34,197,94,0.03)' : 'transparent' }}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <FileText size={40} color="#22c55e" />
                <p className="font-medium text-sm" style={{ color: 'rgb(var(--text-primary))' }}>{file.name}</p>
                <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload size={40} style={{ color: 'rgb(var(--text-muted))' }} />
                <p className="font-medium text-sm" style={{ color: 'rgb(var(--text-primary))' }}>
                  {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume, or click to browse'}
                </p>
                <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>PDF, DOC, DOCX — Max 10MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {file && (
            <button
              onClick={handleUploadAndAnalyze}
              disabled={uploading || analyzing}
              className="mt-6 w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-hover)))' }}
            >
              {uploading ? (<><Loader2 size={18} className="animate-spin" /> Uploading...</>) :
               analyzing ? (<><Sparkles size={18} className="animate-pulse" /> AI Analyzing...</>) :
               (<><Sparkles size={18} /> Analyze Resume</>)}
            </button>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          {/* ATS Score */}
          <div className="rounded-2xl p-6 border text-center" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg className="score-ring w-28 h-28">
                <circle cx="56" cy="56" r="48" stroke="rgba(var(--border-default),0.3)" strokeWidth="6" fill="none" />
                <circle cx="56" cy="56" r="48" stroke={scoreColor(result.ats_score || 0)} strokeWidth="6" fill="none" strokeDasharray={`${2 * Math.PI * 48}`} strokeDashoffset={`${2 * Math.PI * 48 * (1 - (result.ats_score || 0) / 100)}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-3xl font-extrabold" style={{ color: scoreColor(result.ats_score || 0) }}>{result.ats_score || 0}</span>
                <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>ATS Score</span>
              </div>
            </div>
            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>{result.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl p-5 border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
              <h3 className="font-heading font-bold text-sm mb-3" style={{ color: '#22c55e' }}>✅ Strengths</h3>
              <ul className="space-y-2">
                {(result.strengths || []).map((s: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                    <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" color="#22c55e" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5 border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
              <h3 className="font-heading font-bold text-sm mb-3" style={{ color: '#eab308' }}>💡 Improvements</h3>
              <ul className="space-y-2">
                {(result.improvements || []).map((s: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'rgb(var(--text-secondary))' }}>
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" color="#eab308" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5 border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
              <h3 className="font-heading font-bold text-sm mb-3" style={{ color: 'rgb(var(--accent))' }}>🔑 Keywords Found</h3>
              <div className="flex flex-wrap gap-2">
                {(result.keywords_found || []).map((k: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(var(--accent), 0.1)', color: 'rgb(var(--accent))' }}>{k}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-5 border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
              <h3 className="font-heading font-bold text-sm mb-3" style={{ color: '#14b8a6' }}>⚡ Top Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(result.top_skills || []).map((k: string, i: number) => (
                  <span key={i} className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(20,184,166,0.1)', color: '#14b8a6' }}>{k}</span>
                ))}
              </div>
            </div>
          </div>

          <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all" style={{ border: '1px solid rgba(var(--border-default), 0.8)', color: 'rgb(var(--text-secondary))' }}>
            <RotateCcw size={16} /> Upload Another Resume
          </button>
        </motion.div>
      )}
    </div>
  )
}

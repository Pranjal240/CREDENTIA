'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, Sparkles, RotateCcw } from 'lucide-react'

export default function ResumePage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [saveStatus, setSaveStatus] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
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
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  })

  const handleUploadAndAnalyze = async () => {
    if (!file || !userId) { setError('Please login first'); return }
    setUploading(true); setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'resumes')

      // --- Upload step (with retry) ---
      let uploadData: any = null
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
          uploadData = await uploadRes.json()
          if (!uploadRes.ok || !uploadData.success) throw new Error(uploadData.error || 'Upload failed')
          break // Success — exit retry loop
        } catch (uploadErr: any) {
          if (attempt < 2 && (uploadErr.message === 'Failed to fetch' || uploadErr.message === 'Load failed')) {
            console.warn(`[Resume] Upload attempt ${attempt} failed, retrying in 2s...`)
            await new Promise(r => setTimeout(r, 2000))
            continue
          }
          throw uploadErr
        }
      }
      if (!uploadData?.success) throw new Error('Upload failed after retries')

      setUploading(false); setAnalyzing(true)

      // --- Analyze step (with retry) ---
      const MAX_RETRIES = 2
      let analysisResult: any = null
      let finalFileUrl = ''
      let finalStatus = ''
      let lastError: any = null

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), 55000)

          const analyzeRes = await fetch('/api/analyze-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUrl: uploadData.url, studentId: userId }),
            signal: controller.signal,
          })
          clearTimeout(timeout)

          if (!analyzeRes.ok) {
            const errData = await analyzeRes.json().catch(() => ({}))
            throw new Error(errData.error || 'Analysis failed')
          }

          const analysisData = await analyzeRes.json()
          analysisResult = analysisData.analysis || analysisData
          finalFileUrl = analysisData.fileUrl || uploadData.url
          finalStatus = analysisData.status || (analysisResult?.ats_score ? 'ai_approved' : 'rejected')
          lastError = null
          break // Success
        } catch (err: any) {
          lastError = err
          if (err.name === 'AbortError') {
            throw new Error('Analysis is taking too long. Please try again with a smaller or clearer file.')
          }
          // Retry on network/crash errors
          if (attempt < MAX_RETRIES && (err.message === 'Failed to fetch' || err.message === 'Load failed')) {
            console.warn(`[Resume] Analyze attempt ${attempt} failed, retrying in 2s...`)
            await new Promise(r => setTimeout(r, 2000))
            continue
          }
        }
      }

      if (lastError) {
        throw lastError
      }

      setResult(analysisResult)
      setFileUrl(finalFileUrl)
      setSaveStatus(finalStatus)
      setAnalyzing(false)

      // NOTE: Data is intentionally NOT auto-saved here.
      // The user must review the AI-extracted info and click "SAVE TO PROFILE"
      // to persist changes (name, CGPA, skills, etc.) to the database.
    } catch (err: any) {
      const msg = err.message || 'Something went wrong'
      setError(
        msg === 'Failed to fetch' || msg === 'Load failed'
          ? 'Server is temporarily unavailable — please try again in a few seconds.'
          : msg
      )
      setUploading(false); setAnalyzing(false)
    }
  }

  const reset = () => { setFile(null); setResult(null); setError(''); setSaved(false); setFileUrl(''); setSaveStatus('') }

  const handleSave = async () => {
    if (!result || !fileUrl || !userId) return
    setSaving(true)
    setError('')
    try {
      const saveRes = await fetch('/api/save-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: userId,
          type: 'resume',
          analysis: result,
          fileUrl: fileUrl,
          status: saveStatus || 'ai_approved'
        })
      })
      const saveData = await saveRes.json()
      if (!saveRes.ok || !saveData.success) throw new Error(saveData.error || 'Failed to save record')
      setSaved(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Something went wrong saving')
    } finally {
      setSaving(false)
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Resume Analysis</h1>
        <p className="text-sm mt-1 text-white/40">Upload your resume for AI-powered ATS scoring</p>
      </div>

      {!result ? (
        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className="relative rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group"
            style={{
              border: `2px dashed ${file ? 'rgba(34,197,94,0.4)' : isDragActive ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
              background: file ? 'rgba(34,197,94,0.03)' : isDragActive ? 'rgba(59,130,246,0.03)' : 'transparent',
            }}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
                  <FileText size={28} className="text-green-400" />
                </div>
                <p className="font-semibold text-sm text-white">{file.name}</p>
                <p className="text-xs text-white/30">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
                  <Upload size={28} className="text-white/20 group-hover:text-blue-400 transition-colors" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-white/80">
                    {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume, or click to browse'}
                  </p>
                  <p className="text-xs text-white/25 mt-1">PDF, DOC, DOCX, PNG, JPG — Max 10MB</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {file && (
            <button
              onClick={handleUploadAndAnalyze}
              disabled={uploading || analyzing}
              className="mt-6 w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-300 hover:translate-y-[-1px]"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                boxShadow: '0 4px 24px rgba(59,130,246,0.25)',
              }}
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
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg className="score-ring w-28 h-28">
                <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
                <circle cx="56" cy="56" r="48" stroke={scoreColor(result.ats_score || 0)} strokeWidth="6" fill="none" strokeDasharray={`${2 * Math.PI * 48}`} strokeDashoffset={`${2 * Math.PI * 48 * (1 - (result.ats_score || 0) / 100)}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-3xl font-extrabold" style={{ color: scoreColor(result.ats_score || 0) }}>{result.ats_score || 0}</span>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">ATS Score</span>
              </div>
            </div>
            <p className="text-sm text-white/50">{result.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
              <h3 className="font-heading font-bold text-sm mb-3 text-green-400">✅ Strengths</h3>
              <ul className="space-y-2">
                {(result.strengths || []).map((s: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2 text-white/50">
                    <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-green-400" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
              <h3 className="font-heading font-bold text-sm mb-3 text-amber-400">💡 Improvements</h3>
              <ul className="space-y-2">
                {(result.improvements || []).map((s: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2 text-white/50">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0 text-amber-400" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <h3 className="font-heading font-bold text-sm mb-3 text-blue-400">🔑 Keywords Found</h3>
              <div className="flex flex-wrap gap-2">
                {(result.keywords_found || []).map((k: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-300">{k}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'rgba(20,184,166,0.04)', border: '1px solid rgba(20,184,166,0.1)' }}>
              <h3 className="font-heading font-bold text-sm mb-3 text-teal-400">⚡ Top Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(result.top_skills || []).map((k: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-500/10 text-teal-300">{k}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 pt-6 border-t border-white/5">
            {!saved ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20"
                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: 'white' }}
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {saving ? 'Saving...' : 'SAVE TO PROFILE'}
              </button>
            ) : (
              <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                <CheckCircle2 size={18} />
                Saved to Profile!
              </div>
            )}
            
            <button onClick={reset} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
              <RotateCcw size={16} /> Upload Another
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

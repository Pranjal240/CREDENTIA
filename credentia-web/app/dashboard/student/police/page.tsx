'use client'

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, Shield, Loader2, CheckCircle2, AlertCircle, Sparkles, RotateCcw, Link2, FileText } from 'lucide-react'

export default function PolicePage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [tab, setTab] = useState<'upload' | 'link'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [link, setLink] = useState('')
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
    onDrop, accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] }, maxFiles: 1, maxSize: 10 * 1024 * 1024,
  })

  const handleUpload = async () => {
    if (!file || !userId) { setError('Please login first'); return }
    setUploading(true); setError('')
    try {
      const formData = new FormData(); formData.append('file', file); formData.append('folder', 'police')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await uploadRes.json()
      if (!uploadRes.ok || !data.success) throw new Error(data.error || 'Upload failed')
      setUploading(false); setAnalyzing(true)
      const analyzeRes = await fetch('/api/verify-police', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: data.url, studentId: userId }),
      })
      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Verification failed')
      }
      const resData = await analyzeRes.json()
      setResult(resData.analysis || resData); setAnalyzing(false)
      router.refresh()
    } catch (err: any) { setError(err.message); setUploading(false); setAnalyzing(false) }
  }

  const handleLink = async () => {
    if (!link.trim() || !userId) { setError('Please login first'); return }
    setAnalyzing(true); setError('')
    try {
      const res = await fetch('/api/verify-police', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl: link, studentId: userId }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Verification failed')
      }
      const resData = await res.json()
      setResult(resData.analysis || resData); setAnalyzing(false)
      router.refresh()
    } catch (err: any) { setError(err.message); setAnalyzing(false) }
  }

  const reset = () => { setFile(null); setLink(''); setResult(null); setError('') }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Police Verification</h1>
        <p className="text-sm mt-1 text-white/40">Upload your police verification certificate for AI analysis</p>
      </div>

      {!result ? (
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Tab switcher */}
          <div className="flex gap-2 mb-6">
            {[{ id: 'upload' as const, label: 'Upload File', icon: Upload }, { id: 'link' as const, label: 'Paste Link', icon: Link2 }].map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setError('') }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: tab === t.id ? 'rgba(139,92,246,0.12)' : 'transparent',
                  color: tab === t.id ? '#a78bfa' : 'rgba(255,255,255,0.3)',
                  border: tab === t.id ? '1px solid rgba(139,92,246,0.25)' : '1px solid transparent',
                }}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>

          {tab === 'upload' && (
            <>
              <div
                {...getRootProps()}
                className="rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group"
                style={{
                  border: `2px dashed ${file ? 'rgba(34,197,94,0.4)' : isDragActive ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  background: file ? 'rgba(34,197,94,0.03)' : isDragActive ? 'rgba(139,92,246,0.03)' : 'transparent',
                }}
              >
                <input {...getInputProps()} />
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
                      <FileText size={28} className="text-green-400" />
                    </div>
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-white/30">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-violet-500/10 transition-colors">
                      <Shield size={28} className="text-white/20 group-hover:text-violet-400 transition-colors" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white/80">Drop police certificate here</p>
                      <p className="text-xs text-white/25 mt-1">PDF, JPG, PNG — Max 10MB</p>
                    </div>
                  </div>
                )}
              </div>
              {file && (
                <button
                  onClick={handleUpload}
                  disabled={uploading || analyzing}
                  className="mt-5 w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:translate-y-[-1px]"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 24px rgba(139,92,246,0.25)' }}
                >
                  {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : analyzing ? <><Sparkles size={18} className="animate-pulse" /> Verifying...</> : <><Shield size={18} /> Verify Certificate</>}
                </button>
              )}
            </>
          )}

          {tab === 'link' && (
            <>
              <input
                value={link}
                onChange={e => setLink(e.target.value)}
                placeholder="Paste police certificate URL..."
                className="w-full h-12 px-4 rounded-xl text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white' }}
              />
              <button
                onClick={handleLink}
                disabled={!link.trim() || analyzing}
                className="mt-4 w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:translate-y-[-1px]"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', boxShadow: '0 4px 24px rgba(139,92,246,0.25)' }}
              >
                {analyzing ? <><Sparkles size={18} className="animate-pulse" /> Verifying...</> : <><Shield size={18} /> Verify Link</>}
              </button>
            </>
          )}

          {error && (
            <div className="mt-4 rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.15)' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 mb-5">
              {result.is_police_certificate ? <CheckCircle2 size={24} className="text-green-400" /> : <AlertCircle size={24} className="text-red-400" />}
              <div>
                <p className="font-heading font-bold text-white">{result.is_police_certificate ? 'Valid Police Certificate' : 'Document Not Recognized'}</p>
                <p className="text-sm text-white/30">AI Confidence: {result.confidence}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Certificate #', value: result.certificate_number },
                { label: 'Authority', value: result.issuing_authority },
                { label: 'District', value: result.district },
                { label: 'State', value: result.state },
                { label: 'Issue Date', value: result.issue_date },
                { label: 'Name', value: result.applicant_name },
              ].filter(x => x.value).map((item, i) => (
                <div key={i}>
                  <p className="text-[10px] text-white/25 uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className="font-medium text-white/80">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
          <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/5" style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
            <RotateCcw size={16} /> Upload Another
          </button>
        </motion.div>
      )}
    </div>
  )
}

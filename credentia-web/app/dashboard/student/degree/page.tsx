'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, GraduationCap, Loader2, CheckCircle2, AlertCircle, Sparkles, RotateCcw, FileText } from 'lucide-react'

export default function DegreePage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) { setFile(acceptedFiles[0]); setResult(null); setError('') }
  }, [])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] }, maxFiles: 1, maxSize: 10 * 1024 * 1024,
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true); setError('')
    try {
      const formData = new FormData(); formData.append('file', file); formData.append('folder', 'degrees')
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const data = await uploadRes.json()
      setUploading(false); setAnalyzing(true)
      const res = await fetch('/api/verify-degree', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: data.url, filename: data.filename }) })
      if (!res.ok) throw new Error('Verification failed')
      setResult(await res.json()); setAnalyzing(false)
    } catch (err: any) { setError(err.message); setUploading(false); setAnalyzing(false) }
  }

  const reset = () => { setFile(null); setResult(null); setError('') }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-syne text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Degree Verification</h1>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>Upload your degree certificate for AI-powered verification</p>
      </div>

      {!result ? (
        <div className="rounded-2xl p-6 border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
          <div {...getRootProps()} className="border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all" style={{ borderColor: file ? 'rgb(var(--success))' : 'rgba(var(--border-default), 0.6)' }}>
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center gap-2"><FileText size={36} style={{ color: 'rgb(var(--success))' }} /><p className="text-sm font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{file.name}</p></div>
            ) : (
              <div className="flex flex-col items-center gap-2"><Upload size={36} style={{ color: 'rgb(var(--text-muted))' }} /><p className="text-sm" style={{ color: 'rgb(var(--text-primary))' }}>Drop degree certificate here</p><p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>PDF, JPG, PNG — Max 10MB</p></div>
            )}
          </div>
          {error && <div className="mt-4 rounded-xl px-4 py-3 text-sm flex items-center gap-2" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}><AlertCircle size={16} /> {error}</div>}
          {file && (
            <button onClick={handleUpload} disabled={uploading || analyzing} className="mt-4 w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, rgb(var(--accent)), rgb(var(--accent-hover)))' }}>
              {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : analyzing ? <><Sparkles size={18} className="animate-pulse" /> Verifying...</> : <><GraduationCap size={18} /> Verify Degree</>}
            </button>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-2xl p-6 border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
            <div className="flex items-center gap-3 mb-5">
              {result.verified ? <CheckCircle2 size={24} style={{ color: 'rgb(var(--success))' }} /> : <AlertCircle size={24} style={{ color: 'rgb(var(--danger))' }} />}
              <div><p className="font-syne font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{result.verified ? 'Degree Verified' : 'Verification Inconclusive'}</p><p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>Confidence: {result.confidence}%</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[{ label: 'University', value: result.university_name }, { label: 'Degree', value: result.degree }, { label: 'Course', value: result.course }, { label: 'Year', value: result.year_of_passing }, { label: 'CGPA/Grade', value: result.grade_cgpa }, { label: 'Roll No.', value: result.roll_number }].filter(x => x.value).map((item, i) => (
                <div key={i}><p style={{ color: 'rgb(var(--text-muted))' }} className="text-xs mb-0.5">{item.label}</p><p className="font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{item.value}</p></div>
              ))}
            </div>
          </div>
          <button onClick={reset} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium" style={{ border: '1px solid rgba(var(--border-default), 0.8)', color: 'rgb(var(--text-secondary))' }}><RotateCcw size={16} /> Upload Another</button>
        </motion.div>
      )}
    </div>
  )
}

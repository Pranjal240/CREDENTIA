'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { GraduationCap, Upload, Loader2 } from 'lucide-react'

export default function DegreePage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
    onDrop: (files) => { setFile(files[0]); setError('') },
  })

  const verify = async () => {
    setLoading(true); setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let fileUrl = ''
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'degree')
        formData.append('studentId', user.id)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (!uploadData.success) throw new Error(uploadData.error)
        fileUrl = uploadData.url
      }

      const res = await fetch('/api/verify-degree', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, studentId: user.id }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setResult(data.analysis)
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <GraduationCap size={24} className="text-[#F5C542]" />
        <h1 className="font-syne text-2xl font-extrabold text-white">Degree Verification</h1>
      </div>

      {!result ? (
        <div className="space-y-6">
          <div {...getRootProps()} className={`bg-[#13131A] border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-[#F5C542] bg-[#F5C542]/5' : 'border-[#2A2A3A] hover:border-[#F5C542]/50'}`}>
            <input {...getInputProps()} />
            <Upload size={40} className="text-[#9999AA] mx-auto mb-4" />
            {file ? <p className="text-white font-medium">{file.name}</p> : <><p className="text-white font-medium mb-1">Upload Degree Certificate</p><p className="text-[#9999AA] text-sm">PDF, JPG, or PNG</p></>}
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
          <button onClick={verify} disabled={!file || loading} className="bg-[#F5C542] text-black font-bold h-12 px-8 rounded-xl hover:bg-[#D4A017] transition-all disabled:opacity-50 flex items-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : 'Verify Degree →'}
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
            <p className={`font-syne font-bold text-lg mb-4 ${result.verified ? 'text-green-400' : 'text-red-400'}`}>{result.verified ? '✅ Degree Verified' : '❌ Verification Failed'}</p>
            <div className="space-y-3">
              {[
                { label: 'University', value: result.university_name },
                { label: 'Degree', value: result.degree },
                { label: 'Course', value: result.course },
                { label: 'Year', value: result.year_of_passing },
                { label: 'CGPA/Grade', value: result.grade_cgpa },
                { label: 'Confidence', value: result.confidence ? `${result.confidence}%` : null },
              ].filter(f => f.value).map((f, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-[#2A2A3A] last:border-0">
                  <span className="text-[#9999AA] text-sm">{f.label}</span>
                  <span className="text-white text-sm font-medium">{f.value}</span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => { setResult(null); setFile(null) }} className="mt-4 text-[#F5C542] text-sm hover:underline">← Upload another</button>
        </motion.div>
      )}
    </div>
  )
}

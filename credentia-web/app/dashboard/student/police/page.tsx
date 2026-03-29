'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Shield, Upload, Loader2 } from 'lucide-react'

export default function PolicePage() {
  const [file, setFile] = useState<File | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [manual, setManual] = useState({ certificateNumber: '', issuingAuthority: '', dateOfIssue: '', district: '', state: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [status, setStatus] = useState('')
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

      let fileUrl = linkUrl
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'police')
        formData.append('studentId', user.id)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (!uploadData.success) throw new Error(uploadData.error)
        fileUrl = uploadData.url
      }

      const hasManual = Object.values(manual).some(v => v.trim())
      const res = await fetch('/api/verify-police', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUrl, manualData: hasManual ? manual : null, studentId: user.id }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setResult(data.analysis)
      setStatus(data.status)
    } catch (err: any) { setError(err.message) }
    setLoading(false)
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    ai_approved: { label: '⏳ Pending Admin Review', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    needs_review: { label: '⚠️ Manual Review Required', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
    rejected: { label: '❌ Invalid Document', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
    admin_verified: { label: '✅ Police Verified', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={24} className="text-[#F5C542]" />
        <h1 className="font-syne text-2xl font-extrabold text-white">Police Verification</h1>
      </div>

      {!result ? (
        <div className="space-y-6">
          <div {...getRootProps()} className={`bg-[#13131A] border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragActive ? 'border-[#F5C542] bg-[#F5C542]/5' : 'border-[#2A2A3A] hover:border-[#F5C542]/50'}`}>
            <input {...getInputProps()} />
            <Upload size={40} className="text-[#9999AA] mx-auto mb-4" />
            {file ? <p className="text-white font-medium">{file.name}</p> : <><p className="text-white font-medium mb-1">Upload Police Certificate</p><p className="text-[#9999AA] text-sm">PDF, JPG, or PNG</p></>}
          </div>

          <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5">
            <p className="text-[#9999AA] text-sm mb-3">Or paste certificate link:</p>
            <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className="w-full h-11 px-4 rounded-xl bg-[#1C1C26] border border-[#2A2A3A] text-white text-sm focus:border-[#F5C542] outline-none" placeholder="https://..." />
          </div>

          <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5">
            <p className="text-white font-medium text-sm mb-3">Or enter details manually:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'certificateNumber', label: 'Certificate Number' },
                { key: 'issuingAuthority', label: 'Issuing Authority' },
                { key: 'dateOfIssue', label: 'Date of Issue' },
                { key: 'district', label: 'District' },
                { key: 'state', label: 'State' },
              ].map(f => (
                <input key={f.key} placeholder={f.label} value={manual[f.key as keyof typeof manual]} onChange={e => setManual({ ...manual, [f.key]: e.target.value })}
                  className="h-11 px-4 rounded-xl bg-[#1C1C26] border border-[#2A2A3A] text-white text-sm focus:border-[#F5C542] outline-none" />
              ))}
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

          <button onClick={verify} disabled={loading} className="bg-[#F5C542] text-black font-bold h-12 px-8 rounded-xl hover:bg-[#D4A017] transition-all disabled:opacity-50 flex items-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : 'Verify Certificate →'}
          </button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className={`border rounded-2xl p-6 ${statusConfig[status]?.bg || 'bg-[#13131A] border-[#2A2A3A]'}`}>
            <p className={`font-syne font-bold text-lg ${statusConfig[status]?.color || 'text-white'}`}>{statusConfig[status]?.label || status}</p>
            <p className="text-[#9999AA] text-sm mt-1">Confidence: {result.confidence}%</p>
          </div>

          <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6 space-y-3">
            {[
              { label: 'Certificate No', value: result.certificate_number },
              { label: 'Authority', value: result.issuing_authority },
              { label: 'Date', value: result.issue_date },
              { label: 'District', value: `${result.district || ''}${result.state ? ', ' + result.state : ''}` },
              { label: 'Applicant', value: result.applicant_name },
            ].filter(f => f.value).map((f, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-[#2A2A3A] last:border-0">
                <span className="text-[#9999AA] text-sm">{f.label}</span>
                <span className="text-white text-sm font-medium">{f.value}</span>
              </div>
            ))}
          </div>

          {status !== 'admin_verified' && (
            <p className="text-[#9999AA] text-sm bg-[#13131A] border border-[#2A2A3A] rounded-xl px-4 py-3">
              ⏳ AI has pre-screened your certificate. Final verification by our admin team within 24-48 hours.
            </p>
          )}

          <button onClick={() => { setResult(null); setFile(null); setLinkUrl(''); setManual({ certificateNumber: '', issuingAuthority: '', dateOfIssue: '', district: '', state: '' }) }} className="text-[#F5C542] text-sm hover:underline">
            ← Submit another certificate
          </button>
        </motion.div>
      )}
    </div>
  )
}

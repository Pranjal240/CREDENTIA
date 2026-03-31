'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, FileText, BookOpen, Paperclip, Upload,
  Check, X, Loader2, RotateCcw, AlertCircle, Sparkles, Eye
} from 'lucide-react'

const SLOTS = [
  {
    id: 'degree',
    label: 'Degree / University Marksheet',
    icon: GraduationCap,
    color: '#f59e0b',
    colorBg: 'rgba(245,158,11,0.08)',
    colorBorder: 'rgba(245,158,11,0.25)',
    desc: 'Final degree certificate or consolidated marksheet',
  },
  {
    id: '10th',
    label: '10th Class Marksheet',
    icon: BookOpen,
    color: '#3b82f6',
    colorBg: 'rgba(59,130,246,0.08)',
    colorBorder: 'rgba(59,130,246,0.25)',
    desc: 'Secondary school (Class X) board marksheet',
  },
  {
    id: '12th',
    label: '12th Class Marksheet',
    icon: FileText,
    color: '#8b5cf6',
    colorBg: 'rgba(139,92,246,0.08)',
    colorBorder: 'rgba(139,92,246,0.25)',
    desc: 'Senior secondary (Class XII) board marksheet',
  },
  {
    id: 'other',
    label: 'Any Other Degree or Credential',
    icon: Paperclip,
    color: '#14b8a6',
    colorBg: 'rgba(20,184,166,0.08)',
    colorBorder: 'rgba(20,184,166,0.25)',
    desc: 'Diploma, certificate, or any other academic credential',
  },
]

type SlotStatus = 'empty' | 'selected' | 'uploading' | 'verifying' | 'success' | 'error'

type SlotState = {
  status: SlotStatus
  file: File | null
  fileName: string | null
  fileSize: number | null
  progress: number
  result: any
  fileUrl: string
  error: string
  saved: boolean
}

const initSlot = (): SlotState => ({
  status: 'empty', file: null, fileName: null, fileSize: null,
  progress: 0, result: null, fileUrl: '', error: '', saved: false,
})

// Animated SVG tick
function SuccessTick() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle className="tick-circle" cx="20" cy="20" r="18" stroke="#10B981" strokeWidth="2" fill="rgba(16,185,129,0.08)" strokeLinecap="round" />
      <path className="tick-path" d="M12 20.5L17.5 26L28 14" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function DegreePage() {
  const [userId, setUserId] = useState('')
  const [slots, setSlots] = useState<Record<string, SlotState>>(
    Object.fromEntries(SLOTS.map(s => [s.id, initSlot()]))
  )
  const [dragOver, setDragOver] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id)
    })
  }, [])

  const updateSlot = (id: string, patch: Partial<SlotState>) => {
    setSlots(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const validateFile = (file: File): string | null => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowed.includes(file.type)) return 'Invalid type. Only PDF, JPG, PNG allowed.'
    if (file.size > 10 * 1024 * 1024) return 'File is too large. Maximum size is 10MB.'
    return null
  }

  const handleFileSelect = (slotId: string, file: File) => {
    const err = validateFile(file)
    if (err) {
      updateSlot(slotId, { status: 'error', error: err })
      setTimeout(() => updateSlot(slotId, { status: 'empty', error: '' }), 2000)
      return
    }
    updateSlot(slotId, { status: 'selected', file, fileName: file.name, fileSize: file.size, error: '' })
  }

  const handleDrop = (slotId: string, e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(slotId, file)
  }

  const handleUploadAndVerify = async (slotId: string) => {
    const slot = slots[slotId]
    if (!slot.file || !userId) return

    // Upload phase
    updateSlot(slotId, { status: 'uploading', progress: 0 })

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setSlots(prev => {
        const current = prev[slotId].progress
        if (current >= 85) { clearInterval(progressInterval); return prev }
        return { ...prev, [slotId]: { ...prev[slotId], progress: current + Math.random() * 15 } }
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append('file', slot.file)
      formData.append('folder', `degrees/${slotId}`)

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()

      clearInterval(progressInterval)
      if (!uploadRes.ok || !uploadData.success) throw new Error(uploadData.error || 'Upload failed')

      updateSlot(slotId, { progress: 100 })
      await new Promise(r => setTimeout(r, 400))

      // Verify phase (only for 'degree' type — others just saved as uploaded)
      updateSlot(slotId, { status: 'verifying' })

      if (slotId === 'degree') {
        const verifyRes = await fetch('/api/verify-degree', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileUrl: uploadData.url, studentId: userId }),
        })
        const verifyData = await verifyRes.json()
        if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed')

        const analysis = verifyData.analysis || verifyData
        const saveStatus = analysis.verified ? 'ai_approved' : 'needs_review'

        // Auto-save
        await fetch('/api/save-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: userId, type: 'degree', analysis, fileUrl: uploadData.url, status: saveStatus }),
        })

        updateSlot(slotId, { status: 'success', result: analysis, fileUrl: uploadData.url, saved: true, progress: 100 })
      } else {
        // For 10th, 12th, other — save to documents table as pending
        await fetch('/api/save-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            documentType: slotId,
            fileUrl: uploadData.url,
            fileName: slot.file.name,
            fileSize: slot.file.size,
          }),
        })
        updateSlot(slotId, { status: 'success', fileUrl: uploadData.url, saved: true, progress: 100 })
      }
    } catch (err: any) {
      clearInterval(progressInterval)
      updateSlot(slotId, { status: 'error', error: err.message, progress: 0 })
    }
  }

  const resetSlot = (slotId: string) => {
    updateSlot(slotId, initSlot())
    if (fileInputRefs.current[slotId]) {
      fileInputRefs.current[slotId]!.value = ''
    }
  }

  const getZoneClass = (slotId: string) => {
    const s = slots[slotId]
    if (dragOver === slotId) return 'upload-zone-active'
    if (s.status === 'success') return 'upload-zone-success'
    if (s.status === 'error') return 'upload-zone-error'
    if (s.status === 'empty') return 'upload-zone-empty'
    return ''
  }

  const getStatusBadge = (status: SlotStatus, saved: boolean) => {
    if (status === 'success') return { label: saved ? 'Uploaded ✓' : 'Saved', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' }
    if (status === 'uploading' || status === 'verifying') return { label: 'Processing...', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' }
    if (status === 'error') return { label: 'Error', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' }
    if (status === 'selected') return { label: 'Ready', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' }
    return { label: 'Not Uploaded', color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.15)' }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Degree Verification</h1>
        <p className="text-sm mt-1 text-white/40">
          Upload your academic credentials for AI-powered verification. All 4 slots are independent.
        </p>
      </div>

      {/* Upload slots grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SLOTS.map((slot, idx) => {
          const s = slots[slot.id]
          const Icon = slot.icon
          const badge = getStatusBadge(s.status, s.saved)
          const isProcessing = s.status === 'uploading' || s.status === 'verifying'

          return (
            <motion.div
              key={slot.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="rounded-2xl border bg-white/[0.02] overflow-hidden"
              style={{ borderColor: s.status === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)' }}
            >
              {/* Slot header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: slot.colorBg, border: `1px solid ${slot.colorBorder}` }}
                  >
                    <Icon size={20} style={{ color: slot.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90 leading-tight">{slot.label}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">{slot.desc}</p>
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg flex-shrink-0 ml-2"
                  style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                >
                  {badge.label}
                </span>
              </div>

              {/* Drop zone */}
              <div className="p-4">
                {s.status === 'success' ? (
                  /* Success state */
                  <div className="rounded-xl p-4 flex flex-col items-center gap-3 text-center" style={{ background: 'rgba(16,185,129,0.04)' }}>
                    <SuccessTick />
                    <div>
                      <p className="text-sm font-medium text-emerald-400">Document Uploaded</p>
                      <p className="text-xs text-white/30 mt-0.5 break-all">{s.fileName}</p>
                      {s.fileSize && (
                        <p className="text-[11px] text-white/20 mt-0.5">{(s.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                      )}
                    </div>
                    {/* Degree-specific result */}
                    {slot.id === 'degree' && s.result && (
                      <div className="w-full rounded-lg p-3 text-left space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {[
                          { l: 'University', v: s.result.university_name },
                          { l: 'Degree', v: s.result.degree },
                          { l: 'CGPA / Grade', v: s.result.grade_cgpa },
                          { l: 'Year', v: s.result.year_of_passing },
                        ].filter(x => x.v).map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[10px] text-white/25 uppercase tracking-wider">{item.l}</span>
                            <span className="text-xs text-white/70 font-medium">{item.v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 w-full">
                      {s.fileUrl && (
                        <a
                          href={s.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors"
                          style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)' }}
                        >
                          <Eye size={13} /> View
                        </a>
                      )}
                      <button
                        onClick={() => resetSlot(slot.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
                        style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <RotateCcw size={13} /> Replace
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Drop zone */
                  <div>
                    <div
                      className={`rounded-xl p-6 text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${getZoneClass(slot.id)}`}
                      style={{
                        borderColor: dragOver === slot.id ? slot.color : 'rgba(255,255,255,0.10)',
                        background: dragOver === slot.id ? `${slot.color}08` : 'transparent',
                      }}
                      onDragOver={e => { e.preventDefault(); setDragOver(slot.id) }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={e => handleDrop(slot.id, e)}
                      onClick={() => !isProcessing && fileInputRefs.current[slot.id]?.click()}
                    >
                      <input
                        ref={el => { fileInputRefs.current[slot.id] = el }}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleFileSelect(slot.id, e.target.files[0])}
                      />

                      {s.status === 'empty' && (
                        <div className="flex flex-col items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ background: slot.colorBg }}
                          >
                            <Upload size={22} style={{ color: slot.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white/70">Drop file here or <span style={{ color: slot.color }}>browse</span></p>
                            <p className="text-xs text-white/25 mt-1">PDF, JPG, PNG — Max 10MB</p>
                          </div>
                        </div>
                      )}

                      {s.status === 'selected' && (
                        <div className="flex flex-col items-center gap-2">
                          <FileText size={28} className="text-blue-400" />
                          <p className="text-sm font-medium text-white/80 break-all">{s.fileName}</p>
                          <p className="text-xs text-white/30">{s.fileSize ? `${(s.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}</p>
                        </div>
                      )}

                      {isProcessing && (
                        <div className="flex flex-col items-center gap-3">
                          {s.status === 'uploading' ? (
                            <>
                              <Loader2 size={28} className="animate-spin text-blue-400" />
                              <p className="text-sm font-medium text-white/60">Uploading...</p>
                              {/* Progress bar */}
                              <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{
                                    width: `${s.progress}%`,
                                    background: `linear-gradient(90deg, ${slot.color}, ${slot.color}99)`,
                                  }}
                                />
                              </div>
                              <p className="text-xs text-white/30">{Math.round(s.progress)}%</p>
                            </>
                          ) : (
                            <>
                              <Sparkles size={28} className="text-violet-400 animate-pulse" />
                              <p className="text-sm font-medium text-white/60">AI Verifying...</p>
                              <p className="text-xs text-white/25">Extracting document data</p>
                            </>
                          )}
                        </div>
                      )}

                      {s.status === 'error' && (
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle size={28} className="text-red-400" />
                          <p className="text-sm font-medium text-red-400">{s.error || 'Upload failed'}</p>
                          <p className="text-xs text-white/30">Click to try again</p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons below drop zone */}
                    {s.status === 'selected' && !isProcessing && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleUploadAndVerify(slot.id)}
                          className="flex-1 h-11 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:translate-y-[-1px]"
                          style={{
                            background: `linear-gradient(135deg, ${slot.color}, ${slot.color}aa)`,
                            boxShadow: `0 4px 20px ${slot.color}30`,
                          }}
                        >
                          <Upload size={16} />
                          {slot.id === 'degree' ? 'Upload & Verify' : 'Upload Document'}
                        </button>
                        <button
                          onClick={() => resetSlot(slot.id)}
                          className="h-11 px-4 rounded-xl text-sm transition-colors hover:bg-white/5"
                          style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Info card */}
      <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}>
        <Sparkles size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-300 mb-1">AI-Powered Degree Verification</p>
          <p className="text-xs text-white/40 leading-relaxed">
            The Degree Marksheet slot uses Groq AI to extract and verify your credentials automatically.
            Other documents (10th, 12th, Other) are securely stored and sent for manual university verification.
            All documents are encrypted and accessible only to you, your linked university, and verified companies.
          </p>
        </div>
      </div>
    </div>
  )
}

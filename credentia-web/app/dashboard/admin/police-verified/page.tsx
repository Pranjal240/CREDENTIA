'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, X, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
import { motion } from 'framer-motion'

type Verification = {
  id: string
  status: string
  ai_confidence: number
  ai_result: Record<string, unknown>
  updated_at: string
  students: {
    id: string
    police_share_with_companies: boolean
    profiles: { full_name: string; email: string }
  }
}

export default function PoliceVerifiedAdmin() {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<Verification | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/police-verified')
    const data = await res.json()
    setVerifications(data.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const doAction = async (verificationId: string, studentId: string, action: string, reason = '') => {
    setActionLoading(verificationId + action)
    await fetch('/api/admin/approve-police', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId, studentId, action, reason }),
    })
    await load()
    setActionLoading(null)
    setSelectedDoc(null)
    setRejectReason('')
  }

  const statusColor: Record<string, string> = {
    ai_approved: 'bg-green-500/20 text-green-400',
    needs_review: 'bg-yellow-500/20 text-yellow-400',
  }

  return (
    <div className="min-h-screen dark:bg-[#0A0A0F] bg-[#F4F4F8]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link href="/dashboard/admin" className="inline-flex items-center gap-2 dark:text-[#9999AA] text-gray-500 mb-6 hover:dark:text-white">
          <ArrowLeft size={16} /> Admin Dashboard
        </Link>
        <h1 className="font-syne font-bold text-3xl dark:text-white text-gray-900 mb-2">Police Verified Documents</h1>
        <p className="dark:text-[#9999AA] text-gray-500 mb-8">Review and approve police certificates submitted by students</p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#F5C542] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto dark:bg-[#13131A] bg-white rounded-2xl border dark:border-[#2A2A3A] border-gray-100">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-[#2A2A3A] border-gray-100">
                  {['Student', 'Email', 'AI Confidence', 'Status', 'Share w/ Companies', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-4 text-xs font-semibold dark:text-[#9999AA] text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {verifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 dark:text-[#9999AA] text-gray-400">
                      No pending police verifications
                    </td>
                  </tr>
                ) : (
                  verifications.map((v) => (
                    <tr key={v.id} className="border-b dark:border-[#2A2A3A] border-gray-50 last:border-0">
                      <td className="px-4 py-4 dark:text-white text-gray-900 font-medium text-sm">
                        {v.students.profiles.full_name}
                      </td>
                      <td className="px-4 py-4 text-sm dark:text-[#9999AA] text-gray-500">
                        {v.students.profiles.email}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-sm font-bold ${v.ai_confidence >= 85 ? 'text-green-400' : 'text-yellow-400'}`}>
                          {v.ai_confidence}%
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColor[v.status] || 'bg-gray-500/20 text-gray-400'}`}>
                          {v.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => doAction(v.id, v.students.id, 'toggle_share')} className="dark:text-[#9999AA] text-gray-500 hover:text-[#F5C542] transition-colors">
                          {v.students.police_share_with_companies ? <ToggleRight size={20} className="text-[#F5C542]" /> : <ToggleLeft size={20} />}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedDoc(v)}
                            className="p-1.5 rounded-lg dark:text-[#9999AA] text-gray-500 hover:dark:bg-[#2A2A3A] hover:bg-gray-100"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => doAction(v.id, v.students.id, 'approve')}
                            disabled={actionLoading === v.id + 'approve'}
                            className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => { setSelectedDoc(v); setRejectReason('') }}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDoc(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="dark:bg-[#1C1C26] bg-white rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-syne font-bold text-xl dark:text-white text-gray-900 mb-4">
              {selectedDoc.students.profiles.full_name}
            </h3>
            <p className="text-sm dark:text-[#9999AA] text-gray-500 mb-4">{selectedDoc.students.profiles.email}</p>
            <pre className="text-xs dark:bg-[#0A0A0F] bg-gray-50 p-4 rounded-xl overflow-auto dark:text-[#9999AA] text-gray-500 mb-6 max-h-48">
              {JSON.stringify(selectedDoc.ai_result, null, 2)}
            </pre>
            <textarea
              placeholder="Rejection reason (required for reject)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl dark:bg-[#0A0A0F] bg-gray-50 border dark:border-[#2A2A3A] border-gray-200 dark:text-white text-gray-900 text-sm focus:outline-none focus:border-[#F5C542] mb-4 resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={() => doAction(selectedDoc.id, selectedDoc.students.id, 'approve')}
                className="flex-1 py-3 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 font-medium transition-colors"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => doAction(selectedDoc.id, selectedDoc.students.id, 'reject', rejectReason)}
                disabled={!rejectReason.trim()}
                className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium transition-colors disabled:opacity-40"
              >
                ❌ Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

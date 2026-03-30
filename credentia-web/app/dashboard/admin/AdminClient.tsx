'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Shield, Eye, FileText, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminClient({ students }: { students: any[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const toggleApproval = async (studentId: string, currentState: boolean) => {
    setLoadingId(studentId)
    try {
      const res = await fetch('/api/admin/toggle-company-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, isPublic: !currentState })
      })
      if (res.ok) router.refresh()
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="bg-white/5 text-xs uppercase text-white/50 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-medium font-heading">Student</th>
              <th className="px-6 py-4 font-medium font-heading">Course / Stats</th>
              <th className="px-6 py-4 font-medium font-heading">Verification Status</th>
              <th className="px-6 py-4 font-medium font-heading text-right">Company Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center font-bold text-indigo-300">
                      {student.name?.substring(0,2).toUpperCase() || 'ST'}
                    </div>
                    <div>
                      <p className="font-bold text-white text-base">{student.name || 'Unnamed'}</p>
                      <p className="text-xs text-white/40">{student.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-white/80">{student.course || 'N/A'}</p>
                  <p className="text-xs text-white/40">CGPA: {student.cgpa || '--'} | Year: {student.graduation_year || '--'}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {student.ats_score ? <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md border border-blue-400/20" title="Resume Analysed"><FileText size={12}/> ATS: {student.ats_score}</span> : null}
                    {student.police_verified ? <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20" title="Police Clear"><Shield size={12}/> Police</span> : null}
                    {student.aadhaar_verified ? <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-md border border-amber-400/20" title="Aadhaar Verified"><CheckCircle2 size={12}/> KYC</span> : null}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => toggleApproval(student.id, student.profile_is_public)}
                    disabled={loadingId === student.id}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                      student.profile_is_public 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20' 
                        : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {loadingId === student.id ? <Loader2 size={14} className="animate-spin" /> : (student.profile_is_public ? <ToggleRight size={16} /> : <ToggleLeft size={16} />)}
                    {student.profile_is_public ? 'APPROVED FOR COMPANIES' : 'APPROVE'}
                  </button>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-white/40">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

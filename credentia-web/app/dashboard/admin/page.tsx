'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Users, Shield, BarChart3, Building2, GraduationCap, CheckCircle2, XCircle, Eye, Loader2 } from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ students: 0, policeVerified: 0, policePending: 0, aadhaar: 0, companies: 0, universities: 0 })
  const [pendingPolice, setPendingPolice] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== 'pranjalmishra2409@gmail.com') { router.push('/login'); return }

      const [stu, pol, pend, aad, comp, uni] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('verifications').select('*', { count: 'exact', head: true }).eq('type', 'police').eq('status', 'admin_verified'),
        supabase.from('verifications').select('*, students!inner(profiles!inner(full_name, email))').eq('type', 'police').in('status', ['ai_approved', 'needs_review']),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('aadhaar_verified', true),
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'university'),
      ])

      setStats({
        students: stu.count || 0,
        policeVerified: pol.count || 0,
        policePending: pend.data?.length || 0,
        aadhaar: aad.count || 0,
        companies: comp.count || 0,
        universities: uni.count || 0,
      })
      setPendingPolice(pend.data || [])
      setLoading(false)
    }
    load()
  }, [router])

  const handlePoliceAction = async (verificationId: string, action: 'approve' | 'reject') => {
    setActionLoading(verificationId)
    const res = await fetch('/api/admin/police-action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId, action }),
    })
    const data = await res.json()
    if (data.success) {
      setPendingPolice(prev => prev.filter(p => p.id !== verificationId))
      setStats(prev => ({
        ...prev,
        policePending: prev.policePending - 1,
        policeVerified: action === 'approve' ? prev.policeVerified + 1 : prev.policeVerified,
      }))
    }
    setActionLoading(null)
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-2 border-[#F5C542] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-syne text-2xl font-extrabold text-white mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Students', value: stats.students, icon: Users, color: '#3B82F6' },
          { label: 'Police Verified', value: stats.policeVerified, icon: Shield, color: '#22C55E' },
          { label: 'Police Pending', value: stats.policePending, icon: Shield, color: '#F59E0B' },
          { label: 'Aadhaar Verified', value: stats.aadhaar, icon: Shield, color: '#8B5CF6' },
          { label: 'Companies', value: stats.companies, icon: Building2, color: '#EF4444' },
          { label: 'Universities', value: stats.universities, icon: GraduationCap, color: '#F5C542' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5">
            <s.icon size={18} className="mb-2" style={{ color: s.color }} />
            <p className="font-syne text-2xl font-extrabold text-white">{s.value}</p>
            <p className="text-[#9999AA] text-xs">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Pending Police Verifications */}
      <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
        <h3 className="font-syne font-bold text-white mb-4">🚨 Pending Police Reviews ({pendingPolice.length})</h3>
        {pendingPolice.length > 0 ? (
          <div className="space-y-4">
            {pendingPolice.map((v: any) => (
              <div key={v.id} className="bg-[#1C1C26] border border-[#2A2A3A] rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold text-sm">{v.students?.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-[#9999AA] text-xs">{v.students?.profiles?.email}</p>
                    <span className={`text-xs font-medium mt-1 inline-block px-2 py-0.5 rounded-full ${v.status === 'ai_approved' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                      {v.status === 'ai_approved' ? '✅ AI Approved' : '⚠️ Needs Review'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePoliceAction(v.id, 'approve')}
                      disabled={actionLoading === v.id}
                      className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-all disabled:opacity-50"
                    >
                      {actionLoading === v.id ? <Loader2 size={12} className="animate-spin" /> : '✅ Approve'}
                    </button>
                    <button
                      onClick={() => handlePoliceAction(v.id, 'reject')}
                      disabled={actionLoading === v.id}
                      className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
                {v.ai_analysis && (
                  <div className="text-xs text-[#9999AA] space-y-1">
                    <p>Certificate: {v.ai_analysis.certificate_number || 'N/A'}</p>
                    <p>Authority: {v.ai_analysis.issuing_authority || 'N/A'}</p>
                    <p>AI Confidence: {v.ai_analysis.confidence || 0}%</p>
                  </div>
                )}
                {v.file_url && <a href={v.file_url} target="_blank" rel="noreferrer" className="text-[#F5C542] text-xs hover:underline mt-2 inline-flex items-center gap-1"><Eye size={12} /> View Document</a>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#9999AA] text-sm">No pending reviews. All caught up! 🎉</p>
        )}
      </div>
    </div>
  )
}

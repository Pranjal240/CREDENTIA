'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Users, Shield, Building2, GraduationCap, Clock, CheckCircle2, XCircle, ExternalLink, AlertCircle } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, companies: 0, universities: 0, policeVerified: 0, pendingPolice: 0, aadhaarVerified: 0 })
  const [pendingQueue, setPendingQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || session.user.email !== 'pranjalmishra2409@gmail.com') return

      const [students, companies, universities, verifications] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'company'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'university'),
        supabase.from('verifications').select('*'),
      ])

      const v = verifications.data || []
      setStats({
        students: students.count || 0,
        companies: companies.count || 0,
        universities: universities.count || 0,
        policeVerified: v.filter(x => x.type === 'police' && (x.status === 'ai_approved' || x.status === 'admin_verified')).length,
        pendingPolice: v.filter(x => x.type === 'police' && (x.status === 'pending' || x.status === 'needs_review')).length,
        aadhaarVerified: v.filter(x => x.type === 'aadhaar' && x.status === 'ai_approved').length,
      })

      // Pending police queue
      const { data: pending } = await supabase
        .from('verifications')
        .select('*, students!inner(profiles!inner(full_name, email))')
        .eq('type', 'police')
        .in('status', ['pending', 'needs_review'])
        .order('created_at', { ascending: false })
      setPendingQueue(pending || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleAction = async (verificationId: string, action: 'approve' | 'reject') => {
    setActionLoading(verificationId)
    try {
      const res = await fetch('/api/admin/police-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, action }),
      })
      if (res.ok) {
        setPendingQueue(prev => prev.filter(p => p.id !== verificationId))
      }
    } catch {}
    setActionLoading(null)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-syne text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Admin Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>Platform overview and management</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Students', value: stats.students, icon: Users, color: 'from-blue-500 to-blue-600' },
          { label: 'Companies', value: stats.companies, icon: Building2, color: 'from-teal-500 to-teal-600' },
          { label: 'Universities', value: stats.universities, icon: GraduationCap, color: 'from-indigo-500 to-indigo-600' },
          { label: 'Police Verified', value: stats.policeVerified, icon: Shield, color: 'from-emerald-500 to-emerald-600' },
          { label: 'Pending Review', value: stats.pendingPolice, icon: Clock, color: 'from-amber-500 to-amber-600' },
          { label: 'Aadhaar Verified', value: stats.aadhaarVerified, icon: CheckCircle2, color: 'from-cyan-500 to-cyan-600' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl p-5 border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon size={18} className="text-white" />
            </div>
            <p className="font-syne text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{stat.value}</p>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Police review queue */}
      <div className="rounded-2xl border" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(var(--border-default), 0.3)' }}>
          <h2 className="font-syne font-bold" style={{ color: 'rgb(var(--text-primary))' }}>Police Review Queue</h2>
          <span className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(var(--warning), 0.1)', color: 'rgb(var(--warning))' }}>{pendingQueue.length} pending</span>
        </div>

        {pendingQueue.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color: 'rgb(var(--success))' }} />
            <p className="font-syne font-bold" style={{ color: 'rgb(var(--text-primary))' }}>All Clear!</p>
            <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>No pending police reviews</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'rgba(var(--border-default), 0.3)' }}>
            {pendingQueue.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Shield size={18} style={{ color: 'rgb(var(--warning))' }} />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: 'rgb(var(--text-primary))' }}>{item.students?.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-xs truncate" style={{ color: 'rgb(var(--text-muted))' }}>Confidence: {item.ai_confidence}% • {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.document_url && (
                    <a href={item.document_url} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ color: 'rgb(var(--accent))' }}>
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button onClick={() => handleAction(item.id, 'approve')} disabled={actionLoading === item.id} className="px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50" style={{ background: 'rgb(var(--success))' }}>
                    {actionLoading === item.id ? '...' : 'Approve'}
                  </button>
                  <button onClick={() => handleAction(item.id, 'reject')} disabled={actionLoading === item.id} className="px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50" style={{ background: 'rgb(var(--danger))' }}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

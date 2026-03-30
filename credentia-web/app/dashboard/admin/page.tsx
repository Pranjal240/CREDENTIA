import { supabaseAdmin } from '@/lib/supabase'
import { CheckCircle2, Shield, Users, Building2, ExternalLink } from 'lucide-react'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  // Fetch all students
  const { data: students } = await supabaseAdmin
    .from('students')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch verifications (Pending Police)
  const { data: pendingQueue } = await supabaseAdmin
    .from('verifications')
    .select('*, students!inner(name, email)')
    .eq('type', 'police')
    .in('status', ['pending', 'needs_review'])
    .order('created_at', { ascending: false })

  const sList = students || []
  const qList = pendingQueue || []
  
  const verifiedCount = sList.filter(s => s.police_verified || s.aadhaar_verified).length

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white mb-1">Central Verification Authority</h1>
        <p className="text-sm text-white/40">Review AI-verified student documents and approve them for global company visibility.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <Users size={24} className="text-blue-500 mb-3" />
          <h3 className="font-bold text-white text-2xl">{sList.length}</h3>
          <p className="text-xs text-white/40 uppercase tracking-wider">Total Students</p>
        </div>
        <div className="rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <CheckCircle2 size={24} className="text-emerald-500 mb-3" />
          <h3 className="font-bold text-white text-2xl">{verifiedCount}</h3>
          <p className="text-xs text-white/40 uppercase tracking-wider">Partially/Fully Verified</p>
        </div>
        <div className="rounded-2xl p-6 border border-white/5 bg-white/[0.02]">
          <Building2 size={24} className="text-purple-500 mb-3" />
          <h3 className="font-bold text-white text-2xl">{sList.filter(s => s.profile_is_public).length}</h3>
          <p className="text-xs text-white/40 uppercase tracking-wider">Approved For Companies</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-heading text-xl font-bold text-white">Student Roster</h2>
        <AdminClient students={sList} />
      </div>

      {qList.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="font-heading text-xl font-bold text-amber-500 flex items-center gap-2"><Shield size={20}/> Manual Verification Queue ({qList.length})</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden divide-y divide-white/5">
            {qList.map(item => (
              <div key={item.id} className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-white/[0.02]">
                <div className="flex-1">
                  <p className="font-bold text-white">{(item.students as any)?.name || 'Unknown Student'}</p>
                  <p className="text-sm text-white/40">{(item.students as any)?.email}</p>
                  <p className="text-xs text-amber-500/70 mt-1">AI Confidence: {item.ai_confidence}% • Document marked for review</p>
                </div>
                <div className="flex items-center gap-3">
                  <a href={item.document_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 border border-blue-500/30 text-blue-400 text-sm font-bold rounded-xl hover:bg-blue-500/10">
                    <ExternalLink size={16}/> View Doc
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Building, Users, Globe, CheckCircle2, AlertCircle } from 'lucide-react'

export default function AdminCompanies() {
  const [companies, setCompanies] = useState<any[]>([])
  const [universities, setUniversities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'companies' | 'universities'>('companies')

  useEffect(() => {
    const load = async () => {
      const [{ data: profiles }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, role, created_at').in('role', ['company', 'university']).order('created_at', { ascending: false })
      ])
      const all = profiles || []
      setCompanies(all.filter(p => p.role === 'company'))
      setUniversities(all.filter(p => p.role === 'university'))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /></div>

  const list = activeTab === 'companies' ? companies : universities

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2"><Building size={24} className="text-red-400" /> Institutions & Companies</h1>
        <p className="text-sm text-white/40 mt-1">Manage university and company registrations on the platform.</p>
      </div>

      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 border border-white/5">
        <button onClick={() => setActiveTab('companies')} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'companies' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}><Globe size={14} /> Companies ({companies.length})</button>
        <button onClick={() => setActiveTab('universities')} className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${activeTab === 'universities' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}><Building size={14} /> Universities ({universities.length})</button>
      </div>

      {list.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/5 bg-white/[0.01]">
          {activeTab === 'companies' ? <Globe size={40} className="mx-auto mb-4 text-white/10" /> : <Building size={40} className="mx-auto mb-4 text-white/10" />}
          <p className="text-white/50 font-medium">No {activeTab} registered yet</p>
          <p className="text-sm text-white/30 mt-1">{activeTab === 'companies' ? 'Companies' : 'Universities'} that sign up will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors"
            >
              <div className={`w-12 h-12 rounded-xl ${activeTab === 'companies' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'} border flex items-center justify-center flex-shrink-0`}>
                {activeTab === 'companies' ? <Globe size={22} /> : <Building size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-bold text-white text-sm">{item.full_name || item.email?.split('@')[0] || 'Unnamed'}</p>
                <p className="text-xs text-white/30 mt-0.5">{item.email || 'No email'}</p>
                <p className="text-[9px] text-white/20 mt-1">Joined: {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Registered
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

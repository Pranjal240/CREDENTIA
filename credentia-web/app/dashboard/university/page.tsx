'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { GraduationCap, Users, CheckCircle2, Shield, Info, Home, Building, Download } from 'lucide-react'
import Link from 'next/link'

export default function UniversityDashboard() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('students')
        .select('*')
        .eq('university_id', session.user.id)
        .order('created_at', { ascending: false })
      setStudents(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-xs text-white/30 tracking-wider font-semibold">LOADING REGISTRY...</span>
      </div>
    </div>
  )

  const handleExportCSV = () => {
    if (students.length === 0) return
    const headers = ['Name', 'Email', 'Program', 'Branch', 'Graduation Year', 'CGPA', 'Degree Confirmed', 'Joined Date']
    const rows = students.map(s => [
      `"${s.name || ''}"`,
      `"${s.email || ''}"`,
      `"${s.course || ''}"`,
      `"${s.branch || ''}"`,
      s.graduation_year || '',
      s.cgpa || '',
      s.degree_verified ? 'Yes' : 'No',
      new Date(s.created_at).toLocaleDateString()
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `university_registry_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/5 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Building size={28} />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-white mb-1">University Registry</h1>
            <p className="text-sm text-white/40">Manage your institution&apos;s alumni and verify academic credentials.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-semibold rounded-lg hover:bg-indigo-500/20 transition-colors">
            <Download size={16} /> Export CSV
          </button>
          <Link href="/" className="hidden sm:flex items-center gap-2 btn-secondary px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
            <Home size={16} /> Landing
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Total Enrolled Alumni', value: students.length, icon: Users, accent: '#8b5cf6', gradient: 'from-purple-500/20 to-purple-400/5' },
          { label: 'Degree Verified Output', value: students.filter(s => s.degree_verified).length, icon: GraduationCap, accent: '#10b981', gradient: 'from-emerald-500/20 to-emerald-400/5' },
          { label: 'Academic Integrity Score', value: `${students.length ? Math.round((students.filter(s => s.academic_verified).length / students.length) * 100) : 0}%`, icon: CheckCircle2, accent: '#3b82f6', gradient: 'from-blue-500/20 to-blue-400/5' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`rounded-2xl p-6 border border-white/5 bg-gradient-to-br ${stat.gradient} relative overflow-hidden`}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                <stat.icon size={22} style={{ color: stat.accent }} />
              </div>
              <Shield size={32} className="absolute -right-2 -bottom-2 opacity-5 text-white transform rotate-12" />
            </div>
            <p className="font-heading text-4xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-xs font-semibold tracking-wide uppercase text-white/50">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Student Registry Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <h2 className="font-heading font-medium text-lg text-white">Student Directory</h2>
          <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-white/50 flex items-center gap-2">
            <Info size={14} className="text-indigo-400" /> Auto-syncing with blockchain verification
          </span>
        </div>

        {students.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
               <Users size={32} />
            </div>
            <p className="font-heading font-bold text-xl text-white mb-1">No Students Yet</p>
            <p className="text-sm text-white/40">Alumni who link their profiles to your institution ID will appear here for verification review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0e0e14]">
                <tr>
                  {['Name & Email', 'Program', 'Performance', 'Degree Status', 'Institution Link'].map((h, idx) => (
                    <th key={h} className={`text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5 ${idx === 0 ? 'pl-8' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((s, i) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs shadow-inner">
                          {(s.name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white/90 group-hover:text-indigo-300 transition-colors">{s.name}</p>
                          <p className="text-[11px] text-white/30">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60">
                      <span className="font-medium text-white/80">{s.course}</span><br/>
                      <span className="text-[11px]">{s.branch} • Class of {s.graduation_year || '2025'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/80 text-xs font-bold font-mono">
                        {s.cgpa || 'N/A'} CGPA
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {s.degree_verified ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider">
                          <CheckCircle2 size={12} /> Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg font-semibold uppercase tracking-wider">
                          <Info size={12} /> Pending Data
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 pr-8">
                      {s.academic_verified ? (
                         <span className="text-emerald-400 font-bold text-xs flex items-center gap-2">Linked <CheckCircle2 size={14}/></span>
                      ) : (
                        <button className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                          Review Request
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

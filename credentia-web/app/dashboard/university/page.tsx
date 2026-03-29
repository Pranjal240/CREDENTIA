'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { GraduationCap, Users, CheckCircle2 } from 'lucide-react'

export default function UniversityDashboard() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data } = await supabase
        .from('students')
        .select('*, profiles!inner(full_name, email)')
        .eq('university_id', session.user.id)
        .order('created_at', { ascending: false })
      setStudents(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>University Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-secondary))' }}>Manage your institution&apos;s students</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: students.length, icon: Users },
          { label: 'Degree Verified', value: students.filter(s => s.degree_verified).length, icon: GraduationCap },
          { label: 'Academic Verified', value: students.filter(s => s.academic_verified).length, icon: CheckCircle2 },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl p-5 border text-center" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
            <stat.icon size={20} className="mx-auto mb-2" style={{ color: 'rgb(var(--accent))' }} />
            <p className="font-heading text-2xl font-bold" style={{ color: 'rgb(var(--text-primary))' }}>{stat.value}</p>
            <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Student table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-default), 0.5)' }}>
        {students.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="mx-auto mb-3" style={{ color: 'rgb(var(--text-muted))' }} />
            <p className="font-heading font-bold" style={{ color: 'rgb(var(--text-primary))' }}>No Students Yet</p>
            <p className="text-sm mt-1" style={{ color: 'rgb(var(--text-muted))' }}>Students linked to your university will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(var(--border-default), 0.5)' }}>
                  {['Name', 'Course', 'CGPA', 'Degree', 'Academic'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(var(--border-default), 0.3)' }}>
                    <td className="px-5 py-4 font-medium" style={{ color: 'rgb(var(--text-primary))' }}>{s.profiles?.full_name}</td>
                    <td className="px-5 py-4" style={{ color: 'rgb(var(--text-secondary))' }}>{s.course} {s.branch}</td>
                    <td className="px-5 py-4" style={{ color: 'rgb(var(--text-primary))' }}>{s.cgpa || '—'}</td>
                    <td className="px-5 py-4">{s.degree_verified ? <CheckCircle2 size={16} style={{ color: 'rgb(var(--success))' }} /> : <span style={{ color: 'rgb(var(--text-muted))' }}>—</span>}</td>
                    <td className="px-5 py-4">{s.academic_verified ? <CheckCircle2 size={16} style={{ color: 'rgb(var(--success))' }} /> : <span style={{ color: 'rgb(var(--text-muted))' }}>—</span>}</td>
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

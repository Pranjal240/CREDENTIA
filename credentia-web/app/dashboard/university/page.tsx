'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { GraduationCap, Users, Search } from 'lucide-react'

export default function UniversityDashboard() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('students').select('*, profiles!inner(full_name, email)').limit(100)
      setStudents(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-2 border-[#F5C542] border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-syne text-2xl font-extrabold text-white mb-6">University Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5">
          <Users size={18} className="text-[#9999AA] mb-2" />
          <p className="font-syne text-2xl font-extrabold text-white">{students.length}</p>
          <p className="text-[#9999AA] text-xs">Total Students</p>
        </div>
        <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-5">
          <GraduationCap size={18} className="text-[#9999AA] mb-2" />
          <p className="font-syne text-2xl font-extrabold text-white">{students.filter((s: any) => s.degree_verified).length}</p>
          <p className="text-[#9999AA] text-xs">Degree Verified</p>
        </div>
      </div>
      <div className="bg-[#13131A] border border-[#2A2A3A] rounded-2xl p-6">
        <h3 className="font-syne font-bold text-white mb-4">Student Records</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#2A2A3A]"><th className="text-left py-3 text-[#9999AA] font-medium">Name</th><th className="text-left py-3 text-[#9999AA] font-medium">Email</th><th className="text-center py-3 text-[#9999AA] font-medium">Degree</th><th className="text-center py-3 text-[#9999AA] font-medium">CGPA</th></tr></thead>
            <tbody>
              {students.map((s: any) => (
                <tr key={s.id} className="border-b border-[#2A2A3A] hover:bg-[#1C1C26]">
                  <td className="py-3 text-white">{s.profiles?.full_name || '—'}</td>
                  <td className="py-3 text-[#9999AA]">{s.profiles?.email || '—'}</td>
                  <td className="py-3 text-center">{s.degree_verified ? '✅' : '⬜'}</td>
                  <td className="py-3 text-center text-white">{s.cgpa || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

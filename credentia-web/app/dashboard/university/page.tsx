'use client'

import Link from 'next/link'
import { GraduationCap, Users, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function UniversityDashboard() {
  const router = useRouter()
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen dark:bg-[#0A0A0F] bg-[#F4F4F8]">
      <nav className="sticky top-0 z-40 dark:bg-[#0A0A0F]/90 bg-white/90 backdrop-blur-xl border-b dark:border-[#2A2A3A] border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-syne font-extrabold text-xl text-[#F5C542]">CREDENTIA</span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/university/students" className="text-sm dark:text-[#9999AA] text-gray-500">My Students</Link>
            <button onClick={handleLogout} className="text-sm text-red-400"><LogOut size={16} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-syne font-bold text-4xl dark:text-white text-gray-900 mb-2">University Dashboard</h1>
          <p className="dark:text-[#9999AA] text-gray-500">Manage your students and verify academic credentials</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: <Users size={28} className="text-[#F5C542]" />, title: 'My Students', desc: 'View and verify registered students from your university', href: '/dashboard/university/students', color: 'from-[#F5C542]/20 to-orange-400/10' },
            { icon: <GraduationCap size={28} className="text-purple-400" />, title: 'Verify Academic Records', desc: 'Approve or flag degree verifications for your students', href: '/dashboard/university/students', color: 'from-purple-600/20 to-indigo-600/10' },
          ].map((c, i) => (
            <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
              <Link href={c.href} className={`block bg-gradient-to-br ${c.color} rounded-2xl border dark:border-[#2A2A3A] border-gray-100 p-8 hover:scale-[1.02] transition-all`}>
                <div className="mb-4">{c.icon}</div>
                <h3 className="font-syne font-bold text-xl dark:text-white text-gray-900 mb-2">{c.title}</h3>
                <p className="text-sm dark:text-[#9999AA] text-gray-500">{c.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Building2, GraduationCap, Shield, BarChart3, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const cards = [
  {
    icon: <GraduationCap size={28} className="text-[#F5C542]" />,
    title: 'Police Verified',
    desc: 'Review police certificates pending admin approval',
    href: '/dashboard/admin/police-verified',
    count: 'Pending',
    gradient: 'from-[#F5C542]/20 to-orange-500/10',
    border: 'border-[#F5C542]/30',
  },
  {
    icon: <Building2 size={28} className="text-blue-400" />,
    title: 'Companies',
    desc: 'Manage company accounts and approvals',
    href: '/dashboard/admin/companies',
    count: 'Manage',
    gradient: 'from-blue-600/20 to-indigo-600/10',
    border: 'border-blue-500/30',
  },
  {
    icon: <Shield size={28} className="text-green-400" />,
    title: 'Universities',
    desc: 'Manage university accounts and ERP keys',
    href: '/dashboard/admin/universities',
    count: 'Manage',
    gradient: 'from-green-600/20 to-teal-600/10',
    border: 'border-green-500/30',
  },
  {
    icon: <BarChart3 size={28} className="text-purple-400" />,
    title: 'Analytics',
    desc: 'Platform-wide verification analytics',
    href: '/dashboard/admin/analytics',
    count: 'View',
    gradient: 'from-purple-600/20 to-pink-600/10',
    border: 'border-purple-500/30',
  },
]

export default function AdminDashboard() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen dark:bg-[#0A0A0F] bg-[#F4F4F8]">
      <div className="border-b dark:border-[#2A2A3A] border-gray-100 dark:bg-[#0A0A0F]/90 bg-white/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-syne font-extrabold text-xl text-[#F5C542]">CREDENTIA Admin</span>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm dark:text-[#9999AA] text-gray-500 hover:text-red-400 transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[#F5C542] flex items-center justify-center text-black font-bold text-3xl mx-auto mb-4">A</div>
          <h1 className="font-syne font-bold text-4xl dark:text-white text-gray-900 mb-2">Admin Panel</h1>
          <p className="dark:text-[#9999AA] text-gray-500">CREDENTIA Platform Administration</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Link
                href={card.href}
                className={`block bg-gradient-to-br ${card.gradient} rounded-2xl border ${card.border} p-8 hover:scale-[1.02] transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-6">
                  {card.icon}
                  <span className="text-xs px-3 py-1 rounded-full dark:bg-[#2A2A3A] bg-white/80 dark:text-[#9999AA] text-gray-600">
                    {card.count}
                  </span>
                </div>
                <h3 className="font-syne font-bold text-xl dark:text-white text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm dark:text-[#9999AA] text-gray-500">{card.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setUsers(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="text-white/50 animate-pulse p-4">Loading users...</div>

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-3xl font-bold font-heading text-white">User Directory</h1>
        <p className="text-white/50 text-sm mt-1">Manage all registered accounts on the platform.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden glass">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-[#0f1117] text-white/50 text-xs uppercase border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">User</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Role</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-transparent">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-heading font-medium text-white truncate max-w-[250px]">{user.full_name || 'Anonymous'}</div>
                    <div className="text-xs text-white/40 truncate max-w-[250px] mt-0.5">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border text-blue-400 border-blue-500/20 bg-blue-500/10">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-white/50">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-white/40">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

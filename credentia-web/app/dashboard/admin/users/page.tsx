'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Users, Search, Shield, ChevronDown, UserCog, Mail, Calendar, ToggleLeft, ToggleRight, X, Loader2} from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [changingRole, setChangingRole] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setUsers(data || [])
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!(u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))) return false
      }
      if (filterRole !== 'all' && u.role !== filterRole) return false
      return true
    })
  }, [users, searchQuery, filterRole])

  const changeRole = async (userId: string, newRole: string) => {
    setChangingRole(userId)
    try {
      const res = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newRole })
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
        if (selectedUser?.id === userId) setSelectedUser((prev: any) => ({ ...prev, role: newRole }))
      }
    } catch {}
    setChangingRole(null)
  }

  const toggleActive = async (userId: string, currentActive: boolean) => {
    setChangingRole(userId)
    try {
      await supabase.from('profiles').update({ is_active: !currentActive }).eq('id', userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentActive } : u))
    } catch {}
    setChangingRole(null)
  }

  const saveEdit = async () => {
    if (!selectedUser) return
    setSavingEdit(true)
    try {
      const res = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, updates: editForm })
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...editForm } : u))
        setSelectedUser({ ...selectedUser, ...editForm })
        setIsEditing(false)
      }
    } catch {}
    setSavingEdit(false)
  }

  const roleColors: Record<string, { color: string; bg: string }> = {
    student: { color: '#60a5fa', bg: 'rgba(59,130,246,0.08)' },
    company: { color: '#34d399', bg: 'rgba(16,185,129,0.08)' },
    university: { color: '#a78bfa', bg: 'rgba(139,92,246,0.08)' },
    admin: { color: '#f87171', bg: 'rgba(239,68,68,0.08)' },
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">User Directory</h1>
        <p className="text-sm text-white/40 mt-1">Manage all registered accounts. Total: {users.length}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search by name or email..." 
            autoComplete="off" 
            data-lpignore="true" 
            data-1p-ignore="true" 
            spellCheck="false"
            className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50" 
          />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/10 text-white/70 focus:outline-none">
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="company">Companies</option>
          <option value="university">Universities</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-4 gap-3">
        {['student', 'company', 'university', 'admin'].map(role => {
          const count = users.filter(u => u.role === role).length
          const rc = roleColors[role]
          return (
            <button key={role} onClick={() => setFilterRole(filterRole === role ? 'all' : role)} className={`p-3 rounded-xl text-center border transition-all ${filterRole === role ? 'ring-1 ring-blue-500/30' : ''}`} style={{ background: rc.bg, borderColor: 'rgba(255,255,255,0.05)' }}>
              <p className="font-heading text-lg font-bold" style={{ color: rc.color }}>{count}</p>
              <p className="text-[9px] uppercase tracking-wider font-semibold text-white/30 capitalize">{role}s</p>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0e0e14]">
              <tr>
                {['User', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(u => {
                const rc = roleColors[u.role] || roleColors.student
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center font-bold text-xs" style={{ background: rc.bg, color: rc.color }}>{(u.full_name || u.email || 'U')[0].toUpperCase()}</div>
                        <div>
                          <p className="font-medium text-white/80">{u.full_name || 'Anonymous'}</p>
                          <p className="text-[10px] text-white/30">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} disabled={changingRole === u.id} className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer bg-transparent" style={{ borderColor: `${rc.color}30`, color: rc.color }}>
                        <option value="student">Student</option>
                        <option value="company">Company</option>
                        <option value="university">University</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleActive(u.id, u.is_active !== false)} className="flex items-center gap-1.5 text-xs" style={{ color: u.is_active !== false ? '#34d399' : '#f87171' }}>
                        {u.is_active !== false ? <><ToggleRight size={16} /> Active</> : <><ToggleLeft size={16} /> Disabled</>}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-xs text-white/40">{new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => {
                        setSelectedUser(u)
                        setEditForm({ full_name: u.full_name || '', phone: u.phone || '' })
                        setIsEditing(false)
                      }} className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors">View</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-12 text-center text-white/30 text-sm">No users found.</div>}
      </div>

      {/* Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} onClick={() => setSelectedUser(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e0e14] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <p className="font-heading font-bold text-white">{isEditing ? 'Edit Profile' : (selectedUser.full_name || 'User Details')}</p>
              <button onClick={() => setSelectedUser(null)} className="p-2 rounded-lg hover:bg-white/5 text-white/30"><X size={18} /></button>
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">Full Name</label>
                  <input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500/50 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5 block">Phone Number</label>
                  <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-blue-500/50 outline-none" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setIsEditing(false)} className="flex-1 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 text-sm font-medium transition-colors">Cancel</button>
                  <button onClick={saveEdit} disabled={savingEdit} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center justify-center">
                    {savingEdit ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {[
                    { l: 'Email', v: selectedUser.email },
                    { l: 'Role', v: selectedUser.role },
                    { l: 'Phone', v: selectedUser.phone },
                    { l: 'Status', v: selectedUser.is_active !== false ? 'Active' : 'Disabled' },
                    { l: 'User ID', v: selectedUser.id },
                    { l: 'Joined', v: new Date(selectedUser.created_at).toLocaleString('en-IN') },
                  ].map((d, i) => (
                    <div key={i} className="flex justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <p className="text-xs text-white/40">{d.l}</p>
                      <p className="text-sm text-white/80 font-medium text-right break-all max-w-[200px]">{d.v || '—'}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-white/10 flex justify-end">
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors flex items-center gap-2">
                    <UserCog size={16} /> Edit Profile
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

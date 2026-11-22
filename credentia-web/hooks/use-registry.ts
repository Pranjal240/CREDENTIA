'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDash } from '@/components/dash/dashboard-context'
import { cacheGet, cacheSet } from '@/lib/swr-cache'
import type { Talent } from '@/lib/company-talent'

export interface UniversityInfo {
  name: string
  city: string | null
  state: string | null
  ugc_id: string | null
  naac_grade: string | null
}

/**
 * The university's registry of linked students. It reloads when a student's
 * record changes and when an admin approves the institution, so the pending
 * screen turns into the registry without a refresh.
 */
export function useRegistry() {
  const { userId } = useDash()
  const cached = cacheGet<{ approved: boolean; university: UniversityInfo | null; students: Talent[] }>('registry')
  const [approved, setApproved] = useState<boolean | null>(cached ? cached.approved : null)
  const [university, setUniversity] = useState<UniversityInfo | null>(cached?.university ?? null)
  const [students, setStudents] = useState<Talent[]>(cached?.students ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/university/students', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'The registry could not be loaded.')
      cacheSet('registry', { approved: data.approved === true, university: data.university ?? null, students: data.students ?? [] })
      setApproved(data.approved === true)
      setUniversity(data.university ?? null)
      setStudents(data.students ?? [])
      setError('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    void refresh()
    let timer: number | undefined
    const later = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void refresh(), 1200)
    }
    const channel = supabase
      .channel(`registry_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students', filter: `university_id=eq.${userId}` }, later)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'universities', filter: `id=eq.${userId}` }, later)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, later)
      .subscribe()
    return () => {
      window.clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [userId, refresh])

  const updateCgpa = useCallback(async (studentId: string, cgpa: number) => {
    const res = await fetch('/api/university/update-student-cgpa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, cgpa }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'The CGPA could not be saved.')
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, cgpa } : s)))
  }, [])

  return { userId, approved, university, students, loading, error, refresh, updateCgpa }
}

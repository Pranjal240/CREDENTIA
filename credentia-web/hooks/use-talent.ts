'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDash } from '@/components/dash/dashboard-context'
import { cacheGet, cacheSet } from '@/lib/swr-cache'
import type { Talent } from '@/lib/company-talent'

export interface SavedCandidate {
  student_id: string
  notes: string | null
  created_at: string
}

/**
 * The company's view of the talent pool and its shortlist. It reloads when a
 * student's record changes, so a score updated by an admin shows up without a
 * refresh. Saving is applied at once and rolled back if the server says no.
 */
export function useTalent() {
  const { userId } = useDash()
  const cached = cacheGet<{ talent: Talent[]; saved: SavedCandidate[] }>('talent')
  const [talent, setTalent] = useState<Talent[]>(cached?.talent ?? [])
  const [saved, setSaved] = useState<SavedCandidate[]>(cached?.saved ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/company/students', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'The talent pool could not be loaded.')
      cacheSet('talent', { talent: data.talent ?? [], saved: data.saved ?? [] })
      setTalent(data.talent ?? [])
      setSaved(data.saved ?? [])
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
      .channel(`talent_${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students' }, later)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, later)
      .subscribe()
    return () => {
      window.clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [userId, refresh])

  const savedIds = useMemo(() => new Set(saved.map((s) => s.student_id)), [saved])
  const byId = useMemo(() => new Map(talent.map((t) => [t.id, t])), [talent])

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/company/save-candidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'That could not be saved.')
  }

  const toggleSave = useCallback(
    async (studentId: string) => {
      const before = saved
      const wasSaved = savedIds.has(studentId)
      setSaved(wasSaved ? before.filter((s) => s.student_id !== studentId) : [{ student_id: studentId, notes: null, created_at: new Date().toISOString() }, ...before])
      try {
        await post({ studentId, action: wasSaved ? 'unsave' : 'save' })
      } catch (err) {
        setSaved(before)
        throw err
      }
    },
    [saved, savedIds],
  )

  const saveNote = useCallback(async (studentId: string, notes: string) => {
    await post({ studentId, action: 'note', notes })
    setSaved((prev) => prev.map((s) => (s.student_id === studentId ? { ...s, notes: notes.trim() || null } : s)))
  }, [])

  return { userId, talent, saved, savedIds, byId, loading, error, refresh, toggleSave, saveNote }
}

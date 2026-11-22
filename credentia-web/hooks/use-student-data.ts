'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { cacheGet, cacheSet } from '@/lib/swr-cache'
import { useDash } from '@/components/dash/dashboard-context'
import { isVerifiedStatus, isPendingStatus } from '@/lib/status'
import type { DocType } from '@/lib/documents'

export interface StudentRow {
  id: string
  name?: string | null
  email?: string | null
  course?: string | null
  branch?: string | null
  graduation_year?: number | null
  cgpa?: number | null
  ats_score?: number | null
  trust_score?: number | null
  verified_docs_count?: number | null
  profile_complete_pct?: number | null
  profile_is_public?: boolean | null
  profile_views?: number | null
  share_token?: string | null
  university_id?: string | null
  city?: string | null
  state?: string | null
  percentage_10th?: number | null
  percentage_12th?: number | null
  skills?: string[] | null
  [key: string]: unknown
}

export interface VerificationRow {
  id: string
  student_id: string
  type: DocType | string
  status: string
  document_url?: string | null
  document_filename?: string | null
  ai_confidence?: number | null
  ai_result?: Record<string, any> | null
  rejection_reason?: string | null
  admin_reviewed_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

/**
 * The signed in student's own record and documents, with a live subscription so
 * a status change made by an admin shows up without a reload. Reads go through
 * the browser client, so the database rules decide what is visible.
 */
export function useStudentData() {
  const { userId } = useDash()
  const cached = cacheGet<{ student: StudentRow | null; verifications: VerificationRow[] }>('student-data')
  const [student, setStudent] = useState<StudentRow | null>(cached?.student ?? null)
  const [verifications, setVerifications] = useState<VerificationRow[]>(cached?.verifications ?? [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!userId) return
    const [studentResult, verificationResult] = await Promise.all([
      supabase.from('students').select('*').eq('id', userId).maybeSingle(),
      supabase.from('verifications').select('*').eq('student_id', userId).order('updated_at', { ascending: false }),
    ])
    if (studentResult.error || verificationResult.error) {
      setError(studentResult.error?.message || verificationResult.error?.message || 'Could not load your records.')
    } else {
      setError('')
      cacheSet('student-data', { student: (studentResult.data as StudentRow | null) ?? null, verifications: (verificationResult.data as VerificationRow[]) ?? [] })
      setStudent((studentResult.data as StudentRow | null) ?? null)
      setVerifications((verificationResult.data as VerificationRow[]) ?? [])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    void refresh()
    const channel = supabase
      .channel(`student_data_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications', filter: `student_id=eq.${userId}` }, () => void refresh())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students', filter: `id=eq.${userId}` }, () => void refresh())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, refresh])

  const byType = useMemo(() => {
    const map: Partial<Record<string, VerificationRow>> = {}
    for (const row of verifications) if (!map[row.type]) map[row.type] = row
    return map
  }, [verifications])

  const counts = useMemo(() => {
    const submitted = verifications.filter((v) => v.status !== 'not_submitted')
    return {
      verified: verifications.filter((v) => isVerifiedStatus(v.status)).length,
      pending: verifications.filter((v) => isPendingStatus(v.status)).length,
      rejected: verifications.filter((v) => v.status === 'rejected').length,
      notSubmitted: verifications.filter((v) => v.status === 'not_submitted').length,
      submitted: submitted.length,
      total: verifications.length,
    }
  }, [verifications])

  return { userId, student, verifications, byType, counts, loading, error, refresh }
}

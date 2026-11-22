'use client'

import { useEffect, useState } from 'react'
import type { PublicStats } from '@/lib/public-stats'

/**
 * The live counts for the public site. Returns undefined while they load and null if they
 * cannot be read, so a page can reserve its space first and hide the section only on failure.
 * The answer is cached at the edge for a minute by /api/public-stats.
 */
export function usePublicStats(): PublicStats | null | undefined {
  const [stats, setStats] = useState<PublicStats | null | undefined>(undefined)

  useEffect(() => {
    let alive = true
    fetch('/api/public-stats')
      .then((res) => (res.ok ? (res.json() as Promise<PublicStats>) : null))
      .then((data) => alive && setStats(data))
      .catch(() => alive && setStats(null))
    return () => {
      alive = false
    }
  }, [])

  return stats
}

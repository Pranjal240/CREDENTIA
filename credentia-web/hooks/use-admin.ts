'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useDash } from '@/components/dash/dashboard-context'
import { cacheGet, cacheSet } from '@/lib/swr-cache'

interface Options {
  /** Tables whose changes should reload the page's data. */
  tables?: string[]
  /** Reload on a timer as well, in milliseconds. 0 turns it off. */
  pollMs?: number
  /** Set false to hold off loading, for example until something is selected. */
  enabled?: boolean
}

/**
 * Loads one admin resource and keeps it fresh. It reloads when a watched table
 * changes, when the tab comes back into view, and on a slow timer, so a page left
 * open never goes stale. Changing the url loads the new data and keeps the old
 * on screen until it arrives.
 */
export function useAdminResource<T>(url: string, { tables = [], pollMs = 60_000, enabled = true }: Options = {}) {
  const { userId } = useDash()
  const channelName = useId().replace(/:/g, '')
  const [data, setData] = useState<T | null>(() => cacheGet<T>(url) ?? null)
  const [loading, setLoading] = useState(() => cacheGet<T>(url) === undefined)
  const [error, setError] = useState('')
  const urlRef = useRef(url)
  urlRef.current = url
  const watched = tables.join(',')

  const load = useCallback(async () => {
    try {
      const res = await fetch(urlRef.current, { cache: 'no-store' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'This could not be loaded.')
      cacheSet(urlRef.current, body)
      setData(body as T)
      setError('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!userId || !enabled) return
    void load()

    let timer: number | undefined
    const later = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => void load(), 1200)
    }

    let channel: ReturnType<typeof supabase.channel> | null = null
    if (watched) {
      channel = supabase.channel(`admin_${channelName}`)
      for (const table of watched.split(',')) channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, later)
      channel.subscribe()
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisible)
    const interval = pollMs > 0 ? window.setInterval(onVisible, pollMs) : undefined

    return () => {
      window.clearTimeout(timer)
      if (interval) window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      if (channel) supabase.removeChannel(channel)
    }
  }, [userId, enabled, url, watched, pollMs, load, channelName])

  return { data, setData, loading: enabled ? loading : false, error, refresh: load }
}

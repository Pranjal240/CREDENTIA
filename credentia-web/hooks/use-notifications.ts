'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: string | null
  action_url: string | null
  is_read: boolean
  created_at: string
}

/**
 * Notifications for the signed in user, read through an authenticated API route.
 * A live subscription brings new ones in at once, and a slow poll plus a refresh
 * when the tab regains focus cover the case where realtime is not delivered.
 */
export function useNotifications(userId: string | null) {
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.notifications ?? [])
    } catch {
      // A failed refresh keeps what is on screen.
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    refresh().finally(() => setLoading(false))

    const channel = supabase
      .channel(`notifications_${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => refresh())
      .subscribe()

    const poll = window.setInterval(refresh, 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      supabase.removeChannel(channel)
      window.clearInterval(poll)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, refresh])

  const markRead = useCallback(
    async (ids?: string[]) => {
      setItems((prev) => prev.map((n) => (!ids || ids.includes(n.id) ? { ...n, is_read: true } : n)))
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        })
      } catch {
        refresh()
      }
    },
    [refresh],
  )

  const unread = items.filter((n) => !n.is_read).length
  return { items, unread, loading, refresh, markRead }
}

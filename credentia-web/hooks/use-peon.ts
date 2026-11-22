'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatTurn, PeonEvent, PeonSource } from '@/lib/peon/events'

export interface ToolRun {
  id: string
  name: string
  args?: unknown
  status: 'running' | 'success' | 'error'
  summary?: string
  result?: string
}

export interface PeonHandoff {
  subject: string
  summary: string
  state: 'ready' | 'sending' | 'sent' | 'error'
  message?: string
}

export interface PeonMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  reasoning: string
  tools: ToolRun[]
  citations: PeonSource[]
  status: 'streaming' | 'done' | 'error'
  error?: string
  handoff?: PeonHandoff
}

const uid = () => Math.random().toString(36).slice(2, 10)

const blank = (role: PeonMessage['role'], text: string, status: PeonMessage['status']): PeonMessage => ({
  id: uid(),
  role,
  text,
  reasoning: '',
  tools: [],
  citations: [],
  status,
})

/**
 * The conversation with Peon. Words are collected for a few milliseconds before
 * they reach React, so a long answer does not re-render the thread for every
 * token. Nothing is stored on the server: each request carries the thread.
 */
export function usePeonChat(page: string) {
  const [messages, setMessages] = useState<PeonMessage[]>([])
  const [busy, setBusy] = useState(false)
  const messagesRef = useRef<PeonMessage[]>([])
  const controller = useRef<AbortController | null>(null)
  const pending = useRef({ id: '', text: '', reasoning: '' })
  const timer = useRef<number | null>(null)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const patch = useCallback((id: string, change: (message: PeonMessage) => PeonMessage) => {
    setMessages((previous) => previous.map((message) => (message.id === id ? change(message) : message)))
  }, [])

  const flush = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    const { id, text, reasoning } = pending.current
    if (!id || (!text && !reasoning)) return
    pending.current = { id, text: '', reasoning: '' }
    patch(id, (message) => ({ ...message, text: message.text + text, reasoning: message.reasoning + reasoning }))
  }, [patch])

  const queue = useCallback(
    (id: string, kind: 'text' | 'reasoning', value: string) => {
      pending.current.id = id
      pending.current[kind] += value
      if (timer.current === null) timer.current = window.setTimeout(flush, 45)
    },
    [flush],
  )

  const apply = useCallback(
    (id: string, event: PeonEvent) => {
      switch (event.type) {
        case 'reasoning':
          queue(id, 'reasoning', event.text)
          break
        case 'token':
          queue(id, 'text', event.text)
          break
        case 'tool_call':
          flush()
          patch(id, (m) => ({ ...m, tools: [...m.tools, { id: event.id, name: event.name, args: event.args, status: 'running' }] }))
          break
        case 'tool_result':
          flush()
          patch(id, (m) => ({ ...m, tools: m.tools.map((t) => (t.id === event.id ? { ...t, status: event.status, summary: event.summary, result: event.result } : t)) }))
          break
        case 'citations':
          flush()
          patch(id, (m) => ({ ...m, citations: event.items }))
          break
        case 'handoff':
          flush()
          patch(id, (m) => ({ ...m, handoff: { subject: event.subject, summary: event.summary, state: 'ready' } }))
          break
        case 'done':
          flush()
          patch(id, (m) => ({ ...m, status: 'done' }))
          break
        case 'error':
          flush()
          patch(id, (m) => ({ ...m, status: 'error', error: event.message }))
          break
      }
    },
    [flush, patch, queue],
  )

  const run = useCallback(
    async (history: ChatTurn[], id: string) => {
      const ctrl = new AbortController()
      controller.current = ctrl
      setBusy(true)
      try {
        const res = await fetch('/api/peon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history, page }),
          signal: ctrl.signal,
        })
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || 'Peon is unavailable right now.')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { value, done } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let newline: number
          while ((newline = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, newline).trim()
            buffer = buffer.slice(newline + 1)
            if (!line) continue
            try {
              apply(id, JSON.parse(line) as PeonEvent)
            } catch {
              // A broken line is skipped.
            }
          }
        }
        flush()
        patch(id, (m) => (m.status === 'streaming' ? { ...m, status: 'done' } : m))
      } catch (error) {
        flush()
        if ((error as Error).name === 'AbortError') {
          patch(id, (m) => (m.text || m.tools.length ? { ...m, status: 'done' } : { ...m, status: 'error', error: 'Stopped.' }))
        } else {
          patch(id, (m) => ({ ...m, status: 'error', error: (error as Error).message || 'Peon is unavailable right now.' }))
        }
      } finally {
        if (controller.current === ctrl) {
          controller.current = null
          setBusy(false)
        }
      }
    },
    [apply, flush, page, patch],
  )

  const historyUpTo = (list: PeonMessage[]): ChatTurn[] =>
    list.filter((m) => m.text.trim()).map((m) => ({ role: m.role, content: m.text }))

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || controller.current) return
      const user = blank('user', trimmed, 'done')
      const assistant = blank('assistant', '', 'streaming')
      const history = [...historyUpTo(messagesRef.current), { role: 'user' as const, content: trimmed }]
      setMessages((previous) => [...previous, user, assistant])
      void run(history, assistant.id)
    },
    [run],
  )

  /** Asks the same question again after a failed answer. */
  const retry = useCallback(
    (assistantId: string) => {
      if (controller.current) return
      const list = messagesRef.current
      const index = list.findIndex((m) => m.id === assistantId)
      if (index < 1 || list[index - 1].role !== 'user') return
      const fresh = blank('assistant', '', 'streaming')
      const kept = list.slice(0, index)
      setMessages([...kept, fresh])
      void run(historyUpTo(kept), fresh.id)
    },
    [run],
  )

  const stop = useCallback(() => controller.current?.abort(), [])

  const reset = useCallback(() => {
    controller.current?.abort()
    controller.current = null
    pending.current = { id: '', text: '', reasoning: '' }
    setBusy(false)
    setMessages([])
  }, [])

  const confirmHandoff = useCallback(
    async (id: string) => {
      const target = messagesRef.current.find((m) => m.id === id)?.handoff
      if (!target || target.state === 'sending' || target.state === 'sent') return
      patch(id, (m) => (m.handoff ? { ...m, handoff: { ...m.handoff, state: 'sending', message: undefined } } : m))
      try {
        const res = await fetch('/api/peon/handoff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: target.subject, summary: target.summary }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'The message could not be sent.')
        patch(id, (m) => (m.handoff ? { ...m, handoff: { ...m.handoff, state: 'sent' } } : m))
      } catch (error) {
        patch(id, (m) => (m.handoff ? { ...m, handoff: { ...m.handoff, state: 'error', message: (error as Error).message } } : m))
      }
    },
    [patch],
  )

  const dismissHandoff = useCallback((id: string) => patch(id, (m) => ({ ...m, handoff: undefined })), [patch])

  useEffect(
    () => () => {
      controller.current?.abort()
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  return { messages, busy, send, retry, stop, reset, confirmHandoff, dismissHandoff }
}

/* -------------------------------------------------------------------------- */
/* Human support thread                                                       */
/* -------------------------------------------------------------------------- */

export interface SupportMessage {
  id: string
  sender_role: string
  content: string
  file_url?: string | null
  file_name?: string | null
  is_read: boolean
  created_at: string
}

interface SupportState {
  conversation: { id: string; status: string; subject: string | null } | null
  messages: SupportMessage[]
  unread: number
  loaded: boolean
}

/**
 * The person's own conversation with the support team. It refreshes every few
 * seconds while its tab is open and once a minute otherwise, which also drives
 * the unread badge on the launcher.
 */
export function useSupportThread({ enabled, active }: { enabled: boolean; active: boolean }) {
  const [state, setState] = useState<SupportState>({ conversation: null, messages: [], unread: 0, loaded: false })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (markRead: boolean) => {
    try {
      const res = await fetch(`/api/support/mine${markRead ? '?markRead=1' : ''}`, { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setState({ conversation: data.conversation ?? null, messages: data.messages ?? [], unread: data.unread ?? 0, loaded: true })
    } catch {
      // The last known thread stays on screen.
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void load(active)
    const timer = window.setInterval(() => void load(active), active ? 8_000 : 60_000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load(active)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [enabled, active, load])

  const send = useCallback(
    async (content: string) => {
      const text = content.trim()
      if (!text || sending) return false
      setSending(true)
      setError('')
      try {
        const res = await fetch('/api/support/mine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: text }) })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'The message could not be sent.')
        await load(true)
        return true
      } catch (err) {
        setError((err as Error).message)
        return false
      } finally {
        setSending(false)
      }
    },
    [load, sending],
  )

  return { ...state, sending, error, send, reload: () => load(active) }
}

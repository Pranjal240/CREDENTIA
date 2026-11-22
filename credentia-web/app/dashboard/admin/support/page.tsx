'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCheck, Headphones, Inbox, MailOpen, MessageSquare, Paperclip, Reply, Send, Trash2 } from 'lucide-react'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { CopyButton } from '@/components/ui/copy-button'
import { SearchBar } from '@/components/ui/search-bar'
import { useAdminResource } from '@/hooks/use-admin'
import { ConfirmDialog } from '@/components/dash/confirm-dialog'
import { useSearch } from '@/components/search/search-context'
import { TextArea } from '@/components/dash/form'
import { Badge, EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Segmented, StatusBadge } from '@/components/dash/kit'
import { ProfileAvatar } from '@/components/dash/profile-avatar'
import { RoleBadge } from '@/components/dash/role-badge'
import { adminPost } from '@/lib/admin-client'
import { formatDateTime, formatNumber, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SupportConversation, SupportMessage } from '@/lib/admin-types'

const VIEWS = ['Open', 'Unread', 'Resolved', 'All'] as const
type View = (typeof VIEWS)[number]

type ThreadData = { conversation: Omit<SupportConversation, 'unread_count' | 'preview' | 'preview_role'>; messages: SupportMessage[] }

/** One conversation: the messages, the reply box and the actions. It is remounted for each conversation. */
function ThreadView({ id, onBack, onChanged, onDeleted }: { id: string; onBack: () => void; onChanged: () => void; onDeleted: () => void }) {
  const { data, setData, loading, error, refresh } = useAdminResource<ThreadData>(`/api/admin/support?conversation=${encodeURIComponent(id)}`, { tables: ['support_messages'], pollMs: 20_000 })
  const [text, setText] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [actionError, setActionError] = React.useState('')
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [busy, setBusy] = React.useState<'status' | 'delete' | null>(null)
  const box = React.useRef<HTMLDivElement>(null)

  const conversation = data?.conversation
  const messages = React.useMemo(() => data?.messages ?? [], [data])
  const unreadFromPerson = messages.filter((m) => m.sender_role !== 'admin' && !m.is_read).length

  // Opening a thread means the admin has read it.
  React.useEffect(() => {
    if (unreadFromPerson === 0) return
    adminPost('/api/admin/support', { action: 'read', conversationId: id })
      .then(() => {
        setData((prev) => (prev ? { ...prev, messages: prev.messages.map((m) => (m.sender_role !== 'admin' ? { ...m, is_read: true } : m)) } : prev))
        onChanged()
      })
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadFromPerson, id])

  React.useEffect(() => {
    const el = box.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, loading])

  const send = async () => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setActionError('')
    try {
      const { message } = await adminPost<{ message: SupportMessage }>('/api/admin/support', { action: 'reply', conversationId: id, content })
      setData((prev) => (prev ? { ...prev, messages: [...prev.messages, message] } : prev))
      setText('')
      onChanged()
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  const toggleStatus = async () => {
    if (!conversation) return
    const next = conversation.status === 'resolved' ? 'open' : 'resolved'
    setBusy('status')
    setActionError('')
    try {
      await adminPost('/api/admin/support', { action: 'status', conversationId: id, status: next })
      setData((prev) => (prev ? { ...prev, conversation: { ...prev.conversation, status: next } } : prev))
      onChanged()
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const remove = async () => {
    setBusy('delete')
    setActionError('')
    try {
      await adminPost('/api/admin/support', { action: 'delete', conversationId: id })
      setConfirmDelete(false)
      onDeleted()
    } catch (err) {
      setActionError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  if (loading && !data) return <div className="grid flex-1 place-items-center"><div className="skeleton h-24 w-3/4" /></div>
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />
  if (!conversation) return null

  return (
    <>
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3">
        <SmoothButton size="icon-sm" variant="ghost" shape="pill" className="lg:hidden" aria-label="Back to the conversations" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
        </SmoothButton>
        <ProfileAvatar name={conversation.user_name} email={conversation.user_email} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-extrabold">{conversation.user_name || conversation.user_email || 'Someone'}</h2>
            <RoleBadge role={conversation.user_role} />
            <StatusBadge status={conversation.status} />
          </div>
          <p className="truncate text-xs text-muted-foreground">{conversation.subject || 'No subject'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {conversation.user_email ? <CopyButton value={conversation.user_email} /> : null}
          <Link href={`/dashboard/admin/users?q=${encodeURIComponent(conversation.user_email || conversation.user_name || '')}`} className="text-xs font-bold text-brand-ink hover:underline">
            Open the account
          </Link>
          <SmoothButton size="xs" variant="outline" shape="pill" loading={busy === 'status'} onClick={toggleStatus}>
            <CheckCheck aria-hidden="true" />
            {conversation.status === 'resolved' ? 'Reopen' : 'Mark resolved'}
          </SmoothButton>
          <SmoothButton size="icon-sm" variant="ghost" color="destructive" shape="pill" aria-label="Delete this conversation" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden="true" />
          </SmoothButton>
        </div>
      </header>

      <div ref={box} data-lenis-prevent className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 scrollbar-thin" role="log" aria-label="Messages">
        {messages.length === 0 ? (
          <EmptyState icon={<MessageSquare />} title="No messages in this conversation" />
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === 'admin'
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[min(34rem,88%)] rounded-2xl px-3.5 py-2.5', mine ? 'border border-brand/40 bg-brand/20' : 'glass-flat')}>
                  <p className="mb-1 text-[11px] font-bold text-muted-foreground">{mine ? 'You' : conversation.user_name || 'Them'}</p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.content}</p>
                  {m.file_url ? (
                    <a href={m.file_url} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] px-3 text-xs font-bold hover:border-brand/50">
                      <Paperclip className="size-3.5" aria-hidden="true" />
                      {m.file_name || 'Attachment'}
                    </a>
                  ) : null}
                  <time dateTime={m.created_at} className="mt-1.5 block text-[11px] text-muted-foreground">
                    {formatDateTime(m.created_at)}
                  </time>
                </div>
              </div>
            )
          })
        )}
      </div>

      <footer className="border-t border-white/10 p-3">
        {actionError ? (
          <p role="alert" className="mb-2 text-sm font-semibold text-destructive">
            {actionError}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <TextArea
            aria-label="Your reply"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                void send()
              }
            }}
            maxLength={2000}
            placeholder="Write a reply. Press Ctrl and Enter to send."
            className="max-h-40 min-h-[48px] flex-1"
            rows={2}
          />
          <SmoothButton variant="solid" color="accent" shape="pill" loading={sending} disabled={!text.trim()} onClick={() => void send()}>
            <Send aria-hidden="true" />
            Send
          </SmoothButton>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">They are notified when you reply.</p>
      </footer>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this conversation?" description={conversation.user_name || conversation.user_email || undefined} confirmLabel="Delete" destructive busy={busy === 'delete'} error={actionError} onConfirm={() => void remove()}>
        <p>The conversation and every message in it are removed for good. This is written to the audit log and cannot be undone.</p>
      </ConfirmDialog>
    </>
  )
}

export default function AdminSupportPage() {
  const params = useSearchParams()
  const search = useSearch()
  const { data, loading, error, refresh } = useAdminResource<{ conversations: SupportConversation[]; unread: number }>('/api/admin/support', { tables: ['support_conversations', 'support_messages'], pollMs: 30_000 })
  const [view, setView] = React.useState<View>('Open')
  const [query, setQuery] = React.useState('')
  const [active, setActive] = React.useState<string | null>(null)

  const wanted = params?.get('conversation')
  React.useEffect(() => {
    if (wanted) setActive(wanted)
  }, [wanted])

  const conversations = React.useMemo(() => data?.conversations ?? [], [data])
  const stats = React.useMemo(
    () => ({
      open: conversations.filter((c) => c.status === 'open').length,
      unread: data?.unread ?? 0,
      needsReply: conversations.filter((c) => c.status === 'open' && c.preview_role !== 'admin').length,
      resolved: conversations.filter((c) => c.status === 'resolved').length,
    }),
    [conversations, data],
  )

  const shown = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations.filter((c) => {
      if (view === 'Open' && c.status !== 'open') return false
      if (view === 'Unread' && c.unread_count === 0) return false
      if (view === 'Resolved' && c.status !== 'resolved') return false
      return !q || `${c.user_name ?? ''} ${c.user_email ?? ''} ${c.subject ?? ''} ${c.preview}`.toLowerCase().includes(q)
    })
  }, [conversations, view, query])

  if (loading) return <PageSkeleton metrics={4} panels={1} />
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />

  return (
    <>
      <PageHeader title="Support inbox" description="Conversations from students, companies and universities. Peon hands people to you here when it cannot help." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Open" icon={<Inbox />} value={stats.open} detail="Conversations in progress" />
        <Metric index={1} title="Unread messages" icon={<MailOpen />} value={stats.unread} detail="Not opened by an admin" />
        <Metric index={2} title="Waiting for your reply" icon={<Reply />} value={stats.needsReply} detail="They wrote last" />
        <Metric index={3} title="Resolved" icon={<CheckCheck />} value={stats.resolved} detail="Closed conversations" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[23rem_minmax(0,1fr)]">
        <section className={cn('glass-flat rise flex h-[min(40rem,calc(100dvh-13rem))] min-h-[26rem] min-w-0 flex-col rounded-[20px]', active ? 'hidden lg:flex' : 'flex')} style={{ '--i': 4 } as React.CSSProperties} aria-label="Conversations">
          <div className="space-y-2.5 border-b border-white/10 p-3">
            <SearchBar value={query} onChange={setQuery} placeholder="Search conversations" onAskAI={(q) => search.open({ query: q })} />
            <Segmented<View> options={VIEWS} value={view} onChange={setView} label="Show conversations" />
          </div>
          <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 scrollbar-thin">
            {conversations.length === 0 ? (
              <EmptyState icon={<Headphones />} title="No conversations yet" hint="When someone asks Peon for a person, or writes to support, the conversation appears here." />
            ) : shown.length === 0 ? (
              <EmptyState icon={<Inbox />} title="Nothing in this view" hint="Try another view or clear the search." />
            ) : (
              <ul className="space-y-1">
                {shown.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setActive(c.id)}
                      aria-current={active === c.id ? 'true' : undefined}
                      className={cn('flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors', active === c.id ? 'border-brand/50 bg-brand/10' : 'border-transparent hover:bg-white/[0.04]')}
                    >
                      <ProfileAvatar name={c.user_name} email={c.user_email} size={38} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn('truncate text-sm', c.unread_count > 0 ? 'font-extrabold' : 'font-bold')}>{c.user_name || c.user_email || 'Someone'}</span>
                          <time dateTime={c.last_message_at ?? undefined} className="shrink-0 text-[11px] text-muted-foreground">
                            {timeAgo(c.last_message_at)}
                          </time>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <RoleBadge role={c.user_role} className="shrink-0 !px-1.5 !py-0.5 !text-[10px]" />
                          <span className="truncate text-xs text-muted-foreground">{c.preview_role === 'admin' ? `You: ${c.preview}` : c.preview}</span>
                        </span>
                        {c.status === 'resolved' ? <Badge className="mt-1.5" tone="success">Resolved</Badge> : null}
                      </span>
                      {c.unread_count > 0 ? <span className="tabular mt-0.5 grid min-w-5 shrink-0 place-items-center rounded-md bg-brand px-1.5 py-0.5 text-[11px] font-extrabold text-on-brand">{formatNumber(c.unread_count)}</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className={cn('glass-flat rise h-[min(40rem,calc(100dvh-13rem))] min-h-[26rem] min-w-0 flex-col rounded-[20px] lg:flex', active ? 'flex' : 'hidden')} style={{ '--i': 5 } as React.CSSProperties} aria-label="Conversation">
          {active ? (
            <ThreadView
              key={active}
              id={active}
              onBack={() => setActive(null)}
              onChanged={() => void refresh()}
              onDeleted={() => {
                setActive(null)
                void refresh()
              }}
            />
          ) : (
            <div className="grid flex-1 place-items-center">
              <EmptyState icon={<MessageSquare />} title="Choose a conversation" hint="Pick one on the left to read it and reply." />
            </div>
          )}
        </section>
      </div>
    </>
  )
}

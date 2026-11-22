'use client'

import * as React from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Headphones, RotateCcw, Sparkles, Square, X } from 'lucide-react'
import SiriOrb from '@/components/smoothui/components/siri-orb'
import AIConversation from '@/components/smoothui/components/ai-conversation'
import AIMessage from '@/components/smoothui/components/ai-message'
import AIResponse from '@/components/smoothui/components/ai-response'
import AIReasoning from '@/components/smoothui/components/ai-reasoning'
import AIToolCall from '@/components/smoothui/components/ai-tool-call'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import type { AIState } from '@/components/smoothui/components/ai-core'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/format'
import type { DashRole } from '@/lib/dashboard-nav'
import type { PeonMessage, SupportMessage, usePeonChat, useSupportThread } from '@/hooks/use-peon'

export type PeonTab = 'ask' | 'support'

/**
 * Peon is told never to use dashes in its writing, and the interface keeps the
 * same rule even when a model slips. Markdown markers are removed too, because
 * the response component shows plain text.
 */
export const tidy = (text: string) =>
  text
    .replace(/\s*[\u2013\u2014]\s*/g, ', ')
    .replace(/--+/g, ', ')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/^\s*[-*]\s+/gm, '• ')

const SUGGESTIONS: Record<string, string[]> = {
  guest: ['How does Credentia work?', 'Which documents can I verify?', 'Is it free?', 'Where is my data stored?'],
  student: ['Which of my documents are verified?', 'How can I raise my trust score?', 'Why was a document flagged?', 'How do I share my profile?'],
  company: ['How do I find verified candidates?', 'Who applied to us?', 'What can I filter by?', 'How does AI ranking work?'],
  university: ['How do approvals work?', 'How many students are linked to us?', 'What do students need to verify?'],
  admin: ['What needs review today?', 'How many approvals are waiting?', 'How many support conversations are open?'],
}

interface PeonPanelProps {
  open: boolean
  onClose: () => void
  tab: PeonTab
  onTabChange: (tab: PeonTab) => void
  chat: ReturnType<typeof usePeonChat>
  support: ReturnType<typeof useSupportThread>
  signedIn: boolean
  role: DashRole | null
  name?: string
  /** A question to send as soon as the panel is open, for example handed over from search. */
  seed: string
  onSeedUsed: () => void
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

function Mark() {
  return (
    <span className="grid size-[26px] place-items-center rounded-full border border-brand/30 bg-brand/15 text-brand-ink" aria-hidden="true">
      <Sparkles className="size-3.5" />
    </span>
  )
}

function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  placeholder,
  disabled,
  autoFocus,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onStop?: () => void
  busy?: boolean
  placeholder: string
  disabled?: boolean
  autoFocus?: boolean
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [value])

  React.useEffect(() => {
    if (!autoFocus) return
    const timer = window.setTimeout(() => ref.current?.focus({ preventScroll: true }), 260)
    return () => window.clearTimeout(timer)
  }, [autoFocus])

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!busy) onSubmit()
      }}
      className="border-t border-white/10 p-3"
    >
      <div className="flex items-end gap-2 rounded-[22px] border border-white/10 bg-white/[0.05] p-1.5 focus-within:border-white/25">
        <textarea
          ref={ref}
          value={value}
          rows={1}
          disabled={disabled}
          maxLength={2000}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault()
              if (!busy) onSubmit()
            }
          }}
          className="max-h-[120px] min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        {busy ? (
          <SmoothButton type="button" size="icon" variant="solid" shape="pill" aria-label="Stop answering" onClick={onStop} className="shrink-0">
            <Square aria-hidden="true" className="fill-current" />
          </SmoothButton>
        ) : (
          <SmoothButton type="submit" size="icon" variant="solid" shape="pill" aria-label="Send" disabled={!value.trim() || disabled} className="shrink-0">
            <ArrowUp aria-hidden="true" />
          </SmoothButton>
        )}
      </div>
    </form>
  )
}

function Handoff({ message, chat }: { message: PeonMessage; chat: ReturnType<typeof usePeonChat> }) {
  const handoff = message.handoff
  if (!handoff) return null
  return (
    <div className="glass-flat w-full rounded-2xl p-3.5">
      {handoff.state === 'sent' ? (
        <p role="status" className="text-sm text-foreground/90">
          Sent to the support team. Their reply will show up in the Support tab.
        </p>
      ) : (
        <>
          <p className="eyebrow">Send to the support team?</p>
          <p className="mt-1.5 text-sm font-bold">{tidy(handoff.subject)}</p>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{tidy(handoff.summary)}</p>
          {handoff.state === 'error' ? (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {handoff.message}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="primary" disabled={handoff.state === 'sending'} onClick={() => void chat.confirmHandoff(message.id)}>
              {handoff.state === 'sending' ? 'Sending' : 'Send to support'}
            </Button>
            <SmoothButton size="sm" variant="ghost" shape="pill" onClick={() => chat.dismissHandoff(message.id)}>
              Not now
            </SmoothButton>
          </div>
        </>
      )}
    </div>
  )
}

function AssistantMessage({ message, live, orbState, chat }: { message: PeonMessage; live: boolean; orbState: AIState; chat: ReturnType<typeof usePeonChat> }) {
  const text = tidy(message.text)
  const cited = message.citations.filter((citation) => text.includes(`[${citation.index}]`))
  const toolRunning = message.tools.some((tool) => tool.status === 'running')
  const reasoningLive = message.status === 'streaming' && !message.text && !toolRunning
  const empty = !message.text && !message.reasoning && message.tools.length === 0

  return (
    <AIMessage
      bubble={false}
      avatar={live ? <SiriOrb size="26px" state={orbState} /> : <Mark />}
      copyText={text || undefined}
    >
      <div className="flex w-full min-w-0 flex-col gap-2.5">
        {message.reasoning ? (
          <AIReasoning isStreaming={reasoningLive}>
            <p className="whitespace-pre-wrap break-words text-xs">{tidy(message.reasoning)}</p>
          </AIReasoning>
        ) : null}

        {message.tools.map((tool) => (
          <AIToolCall
            key={tool.id}
            name={tool.name}
            status={tool.status}
            summary={tool.summary}
            args={tool.args && Object.keys(tool.args as object).length ? <pre className="whitespace-pre-wrap break-words">{JSON.stringify(tool.args, null, 1)}</pre> : undefined}
            result={tool.result ? <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words scrollbar-thin" data-lenis-prevent>{tool.result}</pre> : undefined}
          />
        ))}

        {text ? <AIResponse text={text} citations={message.citations} isStreaming={message.status === 'streaming'} className="whitespace-pre-wrap" /> : null}

        {empty && message.status === 'streaming' ? <span className="animate-pulse-soft text-sm text-muted-foreground">Thinking</span> : null}

        {cited.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Sources">
            {cited.map((citation) => {
              const body = (
                <>
                  <span className="grid size-4 place-items-center rounded-full bg-white/10 text-[9px] font-bold">{citation.index}</span>
                  {citation.title}
                </>
              )
              const cls = 'inline-flex min-h-7 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-[11px] font-semibold text-foreground/80'
              return (
                <li key={citation.id}>
                  {citation.url ? (
                    <Link href={citation.url} className={cn(cls, 'transition-colors hover:bg-white/10')}>
                      {body}
                    </Link>
                  ) : (
                    <span className={cls}>{body}</span>
                  )}
                </li>
              )
            })}
          </ul>
        ) : null}

        <Handoff message={message} chat={chat} />

        {message.status === 'error' ? (
          <div role="alert" className="flex flex-wrap items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <span className="min-w-0 flex-1">{message.error}</span>
            <SmoothButton size="xs" variant="outline" shape="pill" onClick={() => chat.retry(message.id)}>
              <RotateCcw aria-hidden="true" />
              Try again
            </SmoothButton>
          </div>
        ) : null}
      </div>
    </AIMessage>
  )
}

/* -------------------------------------------------------------------------- */
/* Ask view                                                                   */
/* -------------------------------------------------------------------------- */

function AskView({ chat, signedIn, role, name, orbState, active }: { chat: ReturnType<typeof usePeonChat>; signedIn: boolean; role: DashRole | null; name?: string; orbState: AIState; active: boolean }) {
  const [draft, setDraft] = React.useState('')
  const { messages, busy } = chat
  const last = messages[messages.length - 1]
  const firstName = name?.trim().split(/\s+/)[0]
  const suggestions = SUGGESTIONS[role ?? 'guest'] ?? SUGGESTIONS.guest

  const submit = () => {
    const value = draft
    setDraft('')
    chat.send(value)
  }

  return (
    <>
      <AIConversation className="flex-1" contentKey={`${messages.length}:${last?.text.length ?? 0}:${last?.tools.length ?? 0}:${last?.reasoning.length ?? 0}`}>
        <div className="flex flex-col gap-5 px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-1 py-2 text-center">
              <SiriOrb size="72px" state="idle" />
              <div>
                <h3 className="text-lg font-extrabold">{firstName ? `Hi ${firstName}.` : 'Hello.'}</h3>
                <p className="mx-auto mt-1 max-w-[270px] text-sm leading-relaxed text-muted-foreground">
                  {signedIn ? 'Ask me about Credentia or about your own documents and results.' : 'Ask me how Credentia works. Sign in to ask about your own documents.'}
                </p>
              </div>
              <ul className="flex w-full flex-col gap-2">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => chat.send(suggestion)}
                      className="min-h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-left text-[13px] font-semibold text-foreground/90 transition-colors hover:bg-white/[0.09]"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
              {!signedIn ? (
                <Link href="/login" className="text-sm font-semibold text-brand-ink hover:underline">
                  Sign in
                </Link>
              ) : null}
            </div>
          ) : (
            messages.map((message) =>
              message.role === 'user' ? (
                <AIMessage key={message.id} from="user" copyText={message.text}>
                  {message.text}
                </AIMessage>
              ) : (
                <AssistantMessage key={message.id} message={message} live={busy && message === last} orbState={orbState} chat={chat} />
              ),
            )
          )}
        </div>
      </AIConversation>

      <Composer
        value={draft}
        onChange={setDraft}
        onSubmit={submit}
        onStop={chat.stop}
        busy={busy}
        placeholder="Ask Peon"
        autoFocus={active}
      />
      <p className="px-4 pb-3 text-center text-[11px] leading-snug text-muted-foreground">Peon explains Credentia and your own data. AI can make mistakes.</p>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Support view                                                               */
/* -------------------------------------------------------------------------- */

function SupportView({ support, role, active }: { support: ReturnType<typeof useSupportThread>; role: DashRole | null; active: boolean }) {
  const [draft, setDraft] = React.useState('')
  const { messages, loaded, conversation } = support

  const submit = async () => {
    const value = draft
    setDraft('')
    const ok = await support.send(value)
    if (!ok) setDraft(value)
  }

  return (
    <>
      <AIConversation className="flex-1" contentKey={messages.length}>
        <div className="flex flex-col gap-3 px-4 py-4">
          {!loaded ? (
            <div className="space-y-3" aria-hidden="true">
              <div className="skeleton h-12 w-3/4" />
              <div className="skeleton ml-auto h-12 w-2/3" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-3 py-10 text-center">
              <span className="grid size-14 place-items-center rounded-full border border-brand/30 bg-brand/10 text-brand-ink">
                <Headphones className="size-6" aria-hidden="true" />
              </span>
              <h3 className="text-base font-extrabold">Talk to the support team</h3>
              <p className="max-w-[270px] text-sm leading-relaxed text-muted-foreground">Write your question below. Replies from the team appear here, and you will see a badge on the Peon button when one arrives.</p>
            </div>
          ) : (
            messages.map((message: SupportMessage) => {
              const mine = message.sender_role === role
              return (
                <div key={message.id} className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
                  <div className={cn('max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed', mine ? 'rounded-br-md bg-brand text-on-brand' : 'rounded-bl-md border border-white/10 bg-white/[0.06] text-foreground')}>
                    {!mine ? <span className="mb-0.5 block text-[10px] font-extrabold text-brand-ink">Support team</span> : null}
                    {tidy(message.content)}
                  </div>
                  <span className="px-1 text-[10px] tabular-nums text-muted-foreground">{formatDateTime(message.created_at)}</span>
                </div>
              )
            })
          )}
          {conversation?.status === 'resolved' ? <p className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs text-muted-foreground">The team marked this conversation resolved. Writing again starts a new one.</p> : null}
        </div>
      </AIConversation>

      {support.error ? (
        <p role="alert" className="px-4 pb-1 text-xs text-destructive">
          {support.error}
        </p>
      ) : null}
      <Composer value={draft} onChange={setDraft} onSubmit={submit} busy={false} disabled={support.sending} placeholder="Write to the support team" autoFocus={active} />
      <p className="px-4 pb-3 text-center text-[11px] leading-snug text-muted-foreground">This goes to real people. Do not share passwords or full Aadhaar numbers.</p>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/* Panel                                                                      */
/* -------------------------------------------------------------------------- */

export function PeonPanel({ open, onClose, tab, onTabChange, chat, support, signedIn, role, name, seed, onSeedUsed }: PeonPanelProps) {
  const canSupport = signedIn && role !== 'admin'
  const last = chat.messages[chat.messages.length - 1]
  const orbState: AIState = chat.busy ? (last?.text ? 'streaming' : 'thinking') : last?.status === 'error' ? 'error' : 'idle'

  // Send a question handed over from somewhere else, once the panel is open on the Ask tab.
  React.useEffect(() => {
    if (open && seed && tab === 'ask' && !chat.busy) {
      chat.send(seed)
      onSeedUsed()
    }
    // chat.send is stable per page and busy is read once, when the seed arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, seed, tab])

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div key="peon-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[64] bg-black/60 sm:hidden" onClick={onClose} />
          <motion.section
            key="peon-panel"
            role="dialog"
            aria-label="Peon, the Credentia assistant"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            // A denser fill than other glass, so the page text behind the panel never competes with the conversation.
            style={{ background: 'rgba(14,14,15,0.92)' }}
            className="glass-strong fixed inset-x-2 bottom-2 top-14 z-[65] flex flex-col overflow-hidden rounded-[28px] sm:inset-x-auto sm:bottom-[88px] sm:right-6 sm:top-auto sm:h-[min(660px,calc(100dvh-7rem))] sm:w-[420px]"
          >
            <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <SiriOrb size="38px" state={orbState} />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-extrabold leading-tight">Peon</h2>
                <p className="text-xs text-muted-foreground">Credentia assistant</p>
              </div>
              <SmoothButton size="icon-sm" variant="ghost" shape="pill" aria-label="Start a new chat" disabled={chat.messages.length === 0} onClick={chat.reset}>
                <RotateCcw aria-hidden="true" />
              </SmoothButton>
              <SmoothButton size="icon-sm" variant="ghost" shape="pill" aria-label="Close Peon" onClick={onClose}>
                <X aria-hidden="true" />
              </SmoothButton>
            </header>

            {canSupport ? (
              <div role="tablist" aria-label="Peon sections" className="mx-4 mt-3 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                {(['ask', 'support'] as const).map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => onTabChange(id)}
                    className={cn('relative min-h-9 rounded-lg text-xs font-bold transition-colors', tab === id ? 'bg-white/[0.12] text-foreground' : 'text-muted-foreground hover:text-foreground')}
                  >
                    {id === 'ask' ? 'Ask Peon' : 'Support'}
                    {id === 'support' && support.unread > 0 ? <span className="ml-1.5 inline-grid min-w-[18px] place-items-center rounded-md bg-brand px-1 text-[10px] font-extrabold leading-[18px] text-on-brand">{support.unread}</span> : null}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex min-h-0 flex-1 flex-col pt-1">
              {tab === 'support' && canSupport ? (
                <SupportView support={support} role={role} active={open} />
              ) : (
                <AskView chat={chat} signedIn={signedIn} role={role} name={name} orbState={orbState} active={open} />
              )}
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  )
}

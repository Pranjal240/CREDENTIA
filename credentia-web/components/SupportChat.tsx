'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, X, Send, Paperclip, Loader2,
  Headphones, ChevronDown, FileText, Image as ImageIcon, CheckCheck, Clock
} from 'lucide-react'

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: string
  content: string
  file_url?: string
  file_name?: string
  file_type?: string
  is_read: boolean
  created_at: string
}

type SupportChatProps = {
  userId: string
  userRole: string
  userName: string
  userEmail: string
  externalOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SupportChat({ userId, userRole, userName, userEmail, externalOpen, onOpenChange }: SupportChatProps) {
  const [open, setOpenInternal] = useState(false)

  // Sync with external open state from parent (sidebar toggle)
  useEffect(() => {
    if (externalOpen !== undefined) {
      setOpenInternal(externalOpen)
    }
  }, [externalOpen])

  const setOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const newVal = typeof val === 'function' ? val(open) : val
    setOpenInternal(newVal)
    onOpenChange?.(newVal)
  }

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load existing conversation
  useEffect(() => {
    if (!userId) return
    const loadConversation = async () => {
      try {
        const res = await fetch(`/api/chat/conversations?userId=${userId}&role=${userRole}`)
        const data = await res.json()
        if (data.conversations?.length > 0) {
          const conv = data.conversations[0]
          setConversationId(conv.id)
          setUnreadCount(conv.unread_count || 0)
        }
      } catch (err) {
        console.error('Load conversation error:', err)
      }
    }
    loadConversation()
  }, [userId, userRole])

  // Load messages when chat opens
  useEffect(() => {
    if (!open || !conversationId) return
    const loadMessages = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
        const data = await res.json()
        if (data.messages) setMessages(data.messages)

        // Mark as read
        await fetch('/api/chat/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, readerRole: userRole }),
        })
        setUnreadCount(0)
      } catch (err) {
        console.error('Load messages error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadMessages()
  }, [open, conversationId, userRole])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId) return
    const channel = supabase
      .channel(`support-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload: any) => {
        const newMsg = payload.new as Message
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
        if (!open && newMsg.sender_role !== userRole) {
          setUnreadCount(prev => prev + 1)
        }
        if (open && newMsg.sender_role !== userRole) {
          fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId, readerRole: userRole }),
          })
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload: any) => {
        // Update read status in real-time
        const updated = payload.new as Message
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, is_read: updated.is_read } : m))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, open, userRole])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350)
  }, [open])

  const sendMessage = async (content: string, fileUrl?: string, fileName?: string, fileType?: string) => {
    if (!content.trim() && !fileUrl) return
    setSending(true)
    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, userRole, userName, userEmail,
          content: content.trim() || `📎 ${fileName || 'File attachment'}`,
          conversationId,
          fileUrl, fileName, fileType,
        }),
      })
      const data = await res.json()
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId)
      }
      setInput('')
    } catch (err) {
      console.error('Send error:', err)
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum 10MB.')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'chat-attachments')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success && data.url) {
        await sendMessage(`📎 ${file.name}`, data.url, file.name, file.type)
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = []
  messages.forEach(msg => {
    const d = formatDate(msg.created_at)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.date === d) last.msgs.push(msg)
    else groupedMessages.push({ date: d, msgs: [msg] })
  })

  const roleColor: Record<string, string> = {
    admin: '#10b981',
    student: '#3b82f6',
    company: '#f59e0b',
    university: '#8b5cf6',
  }

  const roleName: Record<string, string> = {
    admin: 'Support Agent',
    student: 'You',
    company: 'You',
    university: 'You',
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setOpen(prev => !prev)}
        className="fixed z-[60] w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full flex items-center justify-center shadow-2xl"
        style={{
          bottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          right: 'max(20px, env(safe-area-inset-right, 20px))',
          background: open
            ? 'rgba(255,255,255,0.08)'
            : 'linear-gradient(135deg, #3b82f6, #6366f1)',
          backdropFilter: open ? 'blur(20px)' : 'none',
          border: open ? '1px solid rgba(255,255,255,0.12)' : 'none',
          boxShadow: open ? 'none' : '0 8px 40px rgba(59,130,246,0.45), 0 2px 8px rgba(0,0,0,0.2)',
        }}
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={24} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle size={24} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && !open && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1"
              style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.5)' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring when unread */}
        {unreadCount > 0 && !open && (
          <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }} />
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[55] sm:hidden"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              className="fixed z-[58] flex flex-col overflow-hidden
                inset-0 sm:inset-auto
                sm:bottom-24 sm:right-6
                sm:w-[420px] sm:max-w-[calc(100vw-32px)]
                sm:h-[580px] sm:max-h-[calc(100vh-120px)]
                sm:rounded-2xl"
              style={{
                background: 'rgba(10, 10, 20, 0.98)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* ── Header ── */}
              <div
                className="px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent)', paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}
              >
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
                >
                  <Headphones size={18} className="text-white sm:hidden" />
                  <Headphones size={20} className="text-white hidden sm:block" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-[15px] font-bold text-white tracking-tight">Credentia Support</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] sm:text-[11px] text-white/40">Online — Usually replies instantly</span>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white/60 transition-all"
                >
                  <X size={18} className="sm:hidden" />
                  <ChevronDown size={20} className="hidden sm:block" />
                </button>
              </div>

              {/* ── Messages Area ── */}
              <div
                className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-1"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent', WebkitOverflowScrolling: 'touch' } as any}
              >
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 size={28} className="animate-spin text-blue-400" />
                      <span className="text-xs text-white/25">Loading messages...</span>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12))', border: '1px solid rgba(59,130,246,0.1)' }}
                    >
                      <MessageCircle size={32} className="text-blue-400/70" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/70 mb-1">Start a conversation</p>
                      <p className="text-xs text-white/25 leading-relaxed max-w-[260px]">
                        Send us a message and our support team will respond as soon as possible.
                        You can also share documents and files.
                      </p>
                    </div>
                  </div>
                ) : (
                  groupedMessages.map((group, gi) => (
                    <div key={gi}>
                      {/* Date separator */}
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-white/5" />
                        <span
                          className="text-[10px] text-white/20 font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                        >
                          {group.date}
                        </span>
                        <div className="flex-1 h-px bg-white/5" />
                      </div>
                      {group.msgs.map((msg, mi) => {
                        const isMe = msg.sender_role === userRole
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: mi * 0.025, duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
                            className={`flex mb-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className="max-w-[85%] sm:max-w-[82%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 relative group"
                              style={{
                                background: isMe
                                  ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.15))'
                                  : 'rgba(255,255,255,0.04)',
                                border: isMe
                                  ? '1px solid rgba(59,130,246,0.18)'
                                  : '1px solid rgba(255,255,255,0.06)',
                                borderBottomRightRadius: isMe ? '6px' : '18px',
                                borderBottomLeftRadius: isMe ? '18px' : '6px',
                              }}
                            >
                              {/* Sender badge */}
                              {!isMe && (
                                <p
                                  className="text-[9px] font-bold uppercase tracking-wider mb-1.5"
                                  style={{ color: roleColor[msg.sender_role] || '#64748b' }}
                                >
                                  {msg.sender_role === 'admin' ? '🛡️ Support Agent' : msg.sender_role}
                                </p>
                              )}

                              {/* File attachment */}
                              {msg.file_url && (
                                <a
                                  href={msg.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2.5 mb-2 px-3 py-2.5 rounded-xl transition-all hover:scale-[1.01]"
                                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                                >
                                  {msg.file_type?.startsWith('image/') ? (
                                    <ImageIcon size={16} className="text-blue-400 flex-shrink-0" />
                                  ) : (
                                    <FileText size={16} className="text-blue-400 flex-shrink-0" />
                                  )}
                                  <span className="text-[12px] text-blue-300 truncate font-medium">{msg.file_name || 'Attachment'}</span>
                                </a>
                              )}

                              <p className="text-[13.5px] text-white/85 leading-relaxed whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>

                              {/* Time + sent/seen status */}
                              <div className={`flex items-center gap-1.5 mt-1.5 ${isMe ? 'justify-end' : ''}`}>
                                <span className="text-[9px] text-white/15">{formatTime(msg.created_at)}</span>
                                {isMe && (
                                  msg.is_read ? (
                                    <span className="flex items-center gap-0.5" title="Seen">
                                      <CheckCheck size={12} className="text-blue-400" />
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-0.5" title="Sent">
                                      <Clock size={10} className="text-white/20" />
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Input Area ── */}
              <div
                className="px-3 sm:px-4 py-3 sm:py-3.5 flex-shrink-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)', paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}
              >
                <div className="flex items-center gap-2">
                  {/* File upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2.5 rounded-xl text-white/25 hover:text-white/50 hover:bg-white/5 transition-all disabled:opacity-30"
                  >
                    {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />

                  {/* Text input */}
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 h-10 sm:h-11 px-3 sm:px-4 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.06] transition-all"
                    disabled={sending}
                  />

                  {/* Send button */}
                  <motion.button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || sending}
                    className="p-2.5 rounded-xl transition-all disabled:opacity-15"
                    style={{
                      background: input.trim()
                        ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                        : 'rgba(255,255,255,0.04)',
                      boxShadow: input.trim() ? '0 4px 16px rgba(59,130,246,0.3)' : 'none',
                    }}
                    whileHover={input.trim() ? { scale: 1.08 } : {}}
                    whileTap={input.trim() ? { scale: 0.9 } : {}}
                  >
                    {sending ? (
                      <Loader2 size={18} className="animate-spin text-white/60" />
                    ) : (
                      <Send size={18} className={input.trim() ? 'text-white' : 'text-white/15'} />
                    )}
                  </motion.button>
                </div>

                {/* Typing indicator for role */}
                <div className="mt-1.5 sm:mt-2 flex items-center justify-between">
                  <span className="text-[8px] sm:text-[9px] text-white/10">End-to-end connected to admin support</span>
                  <span className="text-[8px] sm:text-[9px] text-white/10 flex items-center gap-1">
                    {messages.length > 0 && <><CheckCheck size={9} className="text-blue-400/50" /> Sent &amp; Seen</>}
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

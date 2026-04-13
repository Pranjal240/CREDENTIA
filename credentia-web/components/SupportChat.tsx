'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, X, Send, Paperclip, Loader2,
  Headphones, ChevronDown, FileText, Image as ImageIcon, CheckCheck, Clock,
  Plus, Trash2, ArrowLeft, History
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

type Conversation = {
  id: string
  user_id: string
  user_role: string
  status: string
  subject: string
  last_message_at: string
  created_at: string
  unread_count: number
  last_message_preview: string
  total_messages: number
}

type SupportChatProps = {
  userId: string
  userRole: string
  userName: string
  userEmail: string
  externalOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onUnreadChange?: (count: number) => void
}

export function SupportChat({ userId, userRole, userName, userEmail, externalOpen, onOpenChange, onUnreadChange }: SupportChatProps) {
  const [open, setOpenInternal] = useState(false)

  useEffect(() => {
    if (externalOpen !== undefined) setOpenInternal(externalOpen)
  }, [externalOpen])

  const setOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const newVal = typeof val === 'function' ? val(open) : val
    setOpenInternal(newVal)
    onOpenChange?.(newVal)
  }

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat') // 'chat' = active chat, 'history' = list
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!userId) return
    try {
      const res = await fetch(`/api/chat/conversations?userId=${userId}&role=${userRole}`)
      const data = await res.json()
      if (data.conversations) {
        setConversations(data.conversations)
        const unread = data.conversations.reduce((acc: number, c: Conversation) => acc + c.unread_count, 0)
        setTotalUnread(unread)
        onUnreadChange?.(unread)
      }
    } catch (err) {
      console.error('Load conversations error:', err)
    }
  }, [userId, userRole, onUnreadChange])

  useEffect(() => { loadConversations() }, [loadConversations])

  // Auto-select first open conversation on initial load
  useEffect(() => {
    if (conversations.length > 0 && !activeConvId) {
      const openConv = conversations.find(c => c.status === 'open') || conversations[0]
      setActiveConvId(openConv.id)
    }
  }, [conversations, activeConvId])

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvId) return
    const loadMessages = async () => {
      setLoadingMsgs(true)
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${activeConvId}`)
        const data = await res.json()
        if (data.messages) setMessages(data.messages)
      } catch (err) {
        console.error('Load messages error:', err)
      } finally {
        setLoadingMsgs(false)
      }
    }
    loadMessages()
  }, [activeConvId])

  // Mark as read when open  
  useEffect(() => {
    if (!open || !activeConvId) return
    fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: activeConvId, readerRole: userRole }),
    }).then(() => {
      setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, unread_count: 0 } : c))
      const newTotal = conversations.reduce((acc, c) => acc + (c.id === activeConvId ? 0 : c.unread_count), 0)
      setTotalUnread(newTotal)
      onUnreadChange?.(newTotal)
    })
  }, [open, activeConvId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time subscription
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`support-user-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
      }, (payload: any) => {
        const newMsg = payload.new as Message
        // If this message belongs to the active conversation, add it
        if (newMsg.conversation_id === activeConvId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Mark as read if chat is open
          if (open && newMsg.sender_role !== userRole) {
            fetch('/api/chat/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId: activeConvId, readerRole: userRole }),
            })
          }
        }
        // Refresh conversations list for unread counts
        loadConversations()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_messages',
      }, (payload: any) => {
        const updated = payload.new as Message
        if (updated.conversation_id === activeConvId) {
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, is_read: updated.is_read } : m))
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_conversations',
      }, () => { loadConversations() })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, activeConvId, open, userRole, loadConversations])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when open
  useEffect(() => {
    if (open && view === 'chat') setTimeout(() => inputRef.current?.focus(), 350)
  }, [open, view])

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
          conversationId: activeConvId,
          fileUrl, fileName, fileType,
        }),
      })
      const data = await res.json()
      if (data.conversationId && !activeConvId) {
        setActiveConvId(data.conversationId)
        loadConversations()
      }
      setInput('')
      setView('chat')
    } catch (err) {
      console.error('Send error:', err)
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { alert('File too large. Maximum 10MB.'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'chat-attachments')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(errData.error || `Upload failed (HTTP ${res.status})`)
      }
      const data = await res.json()
      if (data.success && data.url) {
        await sendMessage(`📎 ${file.name}`, data.url, file.name, file.type)
      } else {
        throw new Error(data.error || 'Upload did not return a URL')
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      alert(`File upload failed: ${err.message || 'Unknown error'}. Please try again.`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const startNewChat = () => {
    setActiveConvId(null)
    setMessages([])
    setView('chat')
  }

  const deleteChat = async (convId: string) => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId }),
      })
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== convId))
        if (activeConvId === convId) {
          setActiveConvId(null)
          setMessages([])
        }
        loadConversations()
      }
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const selectConversation = (conv: Conversation) => {
    setActiveConvId(conv.id)
    setView('chat')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const relativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'Just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
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
    admin: '#10b981', student: '#3b82f6', company: '#f59e0b', university: '#8b5cf6',
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setOpen(prev => !prev)}
        className="fixed z-[60] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
        style={{
          bottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          right: 'max(20px, env(safe-area-inset-right, 20px))',
          background: open ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
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
          {totalUnread > 0 && !open && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center px-1"
              style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.5)' }}
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </motion.span>
          )}
        </AnimatePresence>

        {totalUnread > 0 && !open && (
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
                inset-2 sm:inset-auto
                sm:bottom-24 sm:right-6
                sm:w-[420px] sm:max-w-[calc(100vw-32px)]
                sm:h-[580px] sm:max-h-[calc(100vh-120px)]
                rounded-2xl"
              style={{
                background: 'rgba(10, 10, 20, 0.98)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* ── Header ── */}
              <div
                className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(180deg, rgba(255,255,255,0.03), transparent)' }}
              >
                {view === 'history' && (
                  <button onClick={() => setView('chat')} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-all">
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}
                >
                  <Headphones size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white tracking-tight">
                    {view === 'history' ? 'Chat History' : 'Credentia Support'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-white/40">
                      {view === 'history' ? `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}` : 'Online — Usually replies instantly'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {view === 'chat' && (
                    <>
                      <button
                        onClick={() => setView('history')}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/25 hover:text-white/50 transition-all"
                        title="Chat history"
                      >
                        <History size={16} />
                      </button>
                      <button
                        onClick={startNewChat}
                        className="p-2 rounded-lg hover:bg-white/5 text-white/25 hover:text-white/50 transition-all"
                        title="New chat"
                      >
                        <Plus size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-all"
                  >
                    <X size={18} className="sm:hidden" />
                    <ChevronDown size={18} className="hidden sm:block" />
                  </button>
                </div>
              </div>

              {/* ── View: Chat History List ── */}
              {view === 'history' ? (
                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' } as any}>
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                      <MessageCircle size={28} className="text-white/10" />
                      <p className="text-xs text-white/25">No conversations yet</p>
                    </div>
                  ) : (
                    <>
                      {/* New Chat button at top */}
                      <button
                        onClick={startNewChat}
                        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/[0.03] transition-colors"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-500/15">
                          <Plus size={16} className="text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-blue-400">New Conversation</p>
                          <p className="text-[10px] text-white/25">Start a fresh support ticket</p>
                        </div>
                      </button>

                      {conversations.map(conv => (
                        <div
                          key={conv.id}
                          className="relative group"
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        >
                          <button
                            onClick={() => selectConversation(conv)}
                            className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-white/[0.03] transition-colors"
                            style={{
                              background: activeConvId === conv.id ? 'rgba(59,130,246,0.06)' : 'transparent',
                              borderLeft: activeConvId === conv.id ? '3px solid #3b82f6' : '3px solid transparent',
                            }}
                          >
                            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-white/5">
                              <MessageCircle size={14} className="text-white/30" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-white/80 truncate">{conv.subject || 'Support Chat'}</p>
                                <span className="text-[9px] text-white/20 flex-shrink-0">{relativeTime(conv.last_message_at)}</span>
                              </div>
                              <p className="text-[11px] text-white/30 truncate mt-0.5">{conv.last_message_preview || 'No messages'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  conv.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400' : 
                                  conv.status === 'archived' ? 'bg-white/5 text-white/20' : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {conv.status}
                                </span>
                                {conv.unread_count > 0 && (
                                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center">
                                    {conv.unread_count}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                          {/* Delete button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteChat(conv.id) }}
                            className="absolute right-3 top-3 p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                            title="Delete conversation"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* ── Messages Area ── */}
                  <div
                    className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent', WebkitOverflowScrolling: 'touch' } as any}
                  >
                    {loadingMsgs ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 size={28} className="animate-spin text-blue-400" />
                          <span className="text-xs text-white/25">Loading messages...</span>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                        <div
                          className="w-16 h-16 rounded-2xl flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12))', border: '1px solid rgba(59,130,246,0.1)' }}
                        >
                          <MessageCircle size={28} className="text-blue-400/70" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white/70 mb-1">Start a conversation</p>
                          <p className="text-xs text-white/25 leading-relaxed max-w-[240px]">
                            Send us a message and our support team will respond as soon as possible.
                          </p>
                        </div>
                      </div>
                    ) : (
                      groupedMessages.map((group, gi) => (
                        <div key={gi}>
                          <div className="flex items-center gap-3 my-3">
                            <div className="flex-1 h-px bg-white/5" />
                            <span
                              className="text-[9px] text-white/20 font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
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
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: mi * 0.02, duration: 0.2 }}
                                className={`flex mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className="max-w-[80%] rounded-2xl px-3 py-2.5 relative"
                                  style={{
                                    background: isMe
                                      ? 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.15))'
                                      : 'rgba(255,255,255,0.04)',
                                    border: isMe
                                      ? '1px solid rgba(59,130,246,0.18)'
                                      : '1px solid rgba(255,255,255,0.06)',
                                    borderBottomRightRadius: isMe ? '6px' : '16px',
                                    borderBottomLeftRadius: isMe ? '16px' : '6px',
                                  }}
                                >
                                  {!isMe && (
                                    <p className="text-[9px] font-bold uppercase tracking-wider mb-1"
                                      style={{ color: roleColor[msg.sender_role] || '#64748b' }}
                                    >
                                      {msg.sender_role === 'admin' ? '🛡️ Support' : msg.sender_role}
                                    </p>
                                  )}

                                  {msg.file_url && (
                                    <a
                                      href={msg.file_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 mb-1.5 px-2.5 py-2 rounded-xl transition-all hover:scale-[1.01]"
                                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                                    >
                                      {msg.file_type?.startsWith('image/') ? (
                                        <ImageIcon size={14} className="text-blue-400 flex-shrink-0" />
                                      ) : (
                                        <FileText size={14} className="text-blue-400 flex-shrink-0" />
                                      )}
                                      <span className="text-[11px] text-blue-300 truncate font-medium">{msg.file_name || 'Attachment'}</span>
                                    </a>
                                  )}

                                  <p className="text-[13px] text-white/85 leading-relaxed whitespace-pre-wrap break-words">
                                    {msg.content}
                                  </p>

                                  <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : ''}`}>
                                    <span className="text-[9px] text-white/15">{formatTime(msg.created_at)}</span>
                                    {isMe && (
                                      msg.is_read ? (
                                        <CheckCheck size={11} className="text-blue-400" />
                                      ) : (
                                        <Clock size={9} className="text-white/20" />
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
                    className="px-3 py-3 flex-shrink-0"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="p-2.5 rounded-xl text-white/25 hover:text-white/50 hover:bg-white/5 transition-all disabled:opacity-30 flex-shrink-0"
                      >
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      />

                      <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 min-w-0 h-10 px-3 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-white placeholder-white/20 focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.06] transition-all"
                        disabled={sending}
                      />

                      <motion.button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || sending}
                        className="p-2.5 rounded-xl transition-all disabled:opacity-15 flex-shrink-0"
                        style={{
                          background: input.trim() ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.04)',
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
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

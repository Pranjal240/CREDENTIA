'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Search, Send, Paperclip, Loader2,
  CheckCheck, Clock, FileText, Image as ImageIcon,
  Headphones, Archive, CheckCircle2, User, X, ArrowLeft
} from 'lucide-react'

type Conversation = {
  id: string
  user_id: string
  user_role: string
  user_name: string
  user_email: string
  status: string
  subject: string
  last_message_at: string
  created_at: string
  unread_count: number
  last_message_preview: string
  last_message_role: string
  total_messages: number
}

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

export default function AdminSupportPage() {
  const [adminId, setAdminId] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAdminId(session.user.id)
        loadConversations(session.user.id)
      }
    })
  }, [])

  const loadConversations = async (uid: string) => {
    setLoading(true)
    const res = await fetch(`/api/chat/conversations?userId=${uid}&role=admin`)
    const data = await res.json()
    if (data.conversations) setConversations(data.conversations)
    setLoading(false)
  }

  const selectConversation = async (conv: Conversation) => {
    setSelectedConv(conv)
    setShowMobileChat(true)
    setLoadingMsgs(true)

    const res = await fetch(`/api/chat/messages?conversationId=${conv.id}`)
    const data = await res.json()
    if (data.messages) setMessages(data.messages)
    setLoadingMsgs(false)

    // Mark as read
    await fetch('/api/chat/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: conv.id, readerRole: 'admin' }),
    })

    // Update local unread
    setConversations(prev =>
      prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c)
    )

    setTimeout(() => inputRef.current?.focus(), 300)
  }

  // Real-time subscription for admin — listen to ALL support messages
  useEffect(() => {
    const channel = supabase
      .channel('admin-support')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
      }, (payload: any) => {
        const newMsg = payload.new as Message
        // If viewing this conversation, add message
        if (selectedConv && newMsg.conversation_id === selectedConv.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          // Mark as read
          if (newMsg.sender_role !== 'admin') {
            fetch('/api/chat/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId: newMsg.conversation_id, readerRole: 'admin' }),
            })
          }
        }
        // Refresh conversations list
        if (adminId) loadConversations(adminId)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_conversations',
      }, () => {
        if (adminId) loadConversations(adminId)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedConv, adminId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !selectedConv || !adminId) return
    setSending(true)
    try {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adminId,
          userRole: 'admin',
          userName: 'Support Agent',
          userEmail: '',
          content: input.trim(),
          conversationId: selectedConv.id,
        }),
      })
      setInput('')
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!selectedConv || !adminId) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'chat-attachments')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success && data.url) {
        await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: adminId,
            userRole: 'admin',
            userName: 'Support Agent',
            userEmail: '',
            content: `📎 ${file.name}`,
            conversationId: selectedConv.id,
            fileUrl: data.url,
            fileName: file.name,
            fileType: file.type,
          }),
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const updateConversationStatus = async (convId: string, status: string) => {
    // Just update the status directly without sending a chat message
    await fetch('/api/chat/conversations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: convId,
        status: status,
      }),
    })
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, status } : c)
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const y = new Date(today); y.setDate(y.getDate() - 1)
    if (d.toDateString() === y.toDateString()) return 'Yesterday'
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

  const filteredConvs = conversations.filter(c =>
    c.status !== 'archived' && (!search || (c.user_name + c.user_email + c.subject).toLowerCase().includes(search.toLowerCase()))
  )

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0)

  const roleColors: Record<string, { bg: string; text: string; label: string }> = {
    student: { bg: 'rgba(59,130,246,0.1)', text: '#3b82f6', label: 'Student' },
    company: { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b', label: 'Company' },
    university: { bg: 'rgba(139,92,246,0.1)', text: '#8b5cf6', label: 'University' },
  }

  const groupedMessages: { date: string; msgs: Message[] }[] = []
  messages.forEach(msg => {
    const d = formatDate(msg.created_at)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.date === d) last.msgs.push(msg)
    else groupedMessages.push({ date: d, msgs: [msg] })
  })

  return (
    <div className="h-[calc(100vh-80px)] flex rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>

      {/* ── Left Panel: Conversations List ── */}
      <div className={`w-full md:w-[360px] flex-shrink-0 flex flex-col ${showMobileChat ? 'hidden md:flex' : 'flex'}`} style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Header */}
        <div className="px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}>
              <Headphones size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-white">Support Inbox</h1>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">
                {totalUnread > 0 ? `${totalUnread} unread` : 'All caught up'} • {conversations.length} conversations
              </p>
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-9 pl-9 pr-4 rounded-xl text-xs bg-white/5 border border-white/8 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/40"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={20} className="animate-spin text-blue-400" />
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-center px-6">
              <MessageCircle size={24} className="text-white/10" />
              <p className="text-xs text-white/25">No conversations yet</p>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const role = roleColors[conv.user_role] || { bg: 'rgba(100,116,139,0.1)', text: '#64748b', label: conv.user_role }
              const isSelected = selectedConv?.id === conv.id
              return (
                <motion.button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className="w-full text-left px-5 py-3.5 transition-all hover:bg-white/[0.03]"
                  style={{
                    background: isSelected ? 'rgba(59,130,246,0.06)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                  }}
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: role.bg, color: role.text }}>
                      {(conv.user_name || 'U')[0].toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white/90 truncate">{conv.user_name || 'User'}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider flex-shrink-0" style={{ background: role.bg, color: role.text }}>
                          {role.label}
                        </span>
                      </div>
                      <p className="text-xs text-white/35 truncate mt-0.5">{conv.last_message_preview || conv.subject || 'No messages'}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[9px] text-white/20">{relativeTime(conv.last_message_at)}</span>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                      {conv.status === 'resolved' && (
                        <CheckCircle2 size={12} className="text-emerald-400" />
                      )}
                    </div>
                  </div>
                </motion.button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Right Panel: Chat View ── */}
      <div className={`flex-1 flex flex-col ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="px-5 py-3.5 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
              <button
                onClick={() => setShowMobileChat(false)}
                className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-white/40"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{
                background: (roleColors[selectedConv.user_role] || {}).bg || 'rgba(100,116,139,0.1)',
                color: (roleColors[selectedConv.user_role] || {}).text || '#64748b',
              }}>
                {(selectedConv.user_name || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{selectedConv.user_name || 'User'}</p>
                <p className="text-[10px] text-white/30">{selectedConv.user_email} • {(roleColors[selectedConv.user_role] || {}).label || selectedConv.user_role}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedConv.status !== 'resolved' && (
                  <button
                    onClick={() => updateConversationStatus(selectedConv.id, 'resolved')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-emerald-400 transition-colors hover:bg-emerald-500/10"
                    style={{ border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    <CheckCircle2 size={12} /> Resolve
                  </button>
                )}
                <button
                  onClick={() => updateConversationStatus(selectedConv.id, 'archived')}
                  className="p-1.5 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/5 transition-colors"
                >
                  <Archive size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 scrollbar-thin">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={24} className="animate-spin text-blue-400" />
                </div>
              ) : (
                groupedMessages.map((group, gi) => (
                  <div key={gi}>
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[10px] text-white/20 font-medium uppercase tracking-wider">{group.date}</span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    {group.msgs.map((msg, mi) => {
                      const isAdmin = msg.sender_role === 'admin'
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex mb-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className="max-w-[70%] rounded-2xl px-4 py-2.5"
                            style={{
                              background: isAdmin
                                ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'
                                : 'rgba(255,255,255,0.05)',
                              border: isAdmin
                                ? '1px solid rgba(16,185,129,0.15)'
                                : '1px solid rgba(255,255,255,0.06)',
                              borderBottomRightRadius: isAdmin ? '6px' : '16px',
                              borderBottomLeftRadius: isAdmin ? '16px' : '6px',
                            }}
                          >
                            {!isAdmin && (
                              <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{
                                color: (roleColors[msg.sender_role] || {}).text || '#64748b'
                              }}>
                                {msg.sender_role}
                              </p>
                            )}
                            {isAdmin && (
                              <p className="text-[9px] font-bold uppercase tracking-wider mb-1 text-emerald-400">You</p>
                            )}
                            {msg.file_url && (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 mb-1.5 px-2.5 py-2 rounded-lg hover:bg-white/5"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                              >
                                {msg.file_type?.startsWith('image/')
                                  ? <ImageIcon size={14} className="text-blue-400" />
                                  : <FileText size={14} className="text-blue-400" />}
                                <span className="text-[11px] text-blue-300 truncate">{msg.file_name || 'File'}</span>
                              </a>
                            )}
                            <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`flex items-center gap-1.5 mt-1 ${isAdmin ? 'justify-end' : ''}`}>
                              <span className="text-[9px] text-white/15">{formatTime(msg.created_at)}</span>
                              {isAdmin && (msg.is_read ? <CheckCheck size={10} className="text-emerald-400" /> : <Clock size={10} className="text-white/15" />)}
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

            {/* Reply Input */}
            <div className="px-5 py-3.5 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                >
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />

                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply to message..."
                  className="flex-1 h-11 px-4 rounded-xl text-sm bg-white/5 border border-white/8 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/40"
                  disabled={sending}
                />

                <motion.button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="px-5 h-11 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-20"
                  style={{
                    background: input.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)',
                    color: input.trim() ? 'white' : 'rgba(255,255,255,0.2)',
                  }}
                  whileHover={input.trim() ? { scale: 1.02 } : {}}
                  whileTap={input.trim() ? { scale: 0.96 } : {}}
                >
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1))' }}>
              <MessageCircle size={36} className="text-blue-400/50" />
            </div>
            <p className="text-lg font-heading font-bold text-white/30">Select a conversation</p>
            <p className="text-xs text-white/15 max-w-xs">
              Choose a conversation from the left panel to view and respond to support messages from students, companies, and universities.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

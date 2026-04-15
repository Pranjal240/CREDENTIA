'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell,
  Line,
} from 'recharts'
import {
  TrendingUp, Users, Shield, CheckCircle2, GraduationCap, RefreshCw,
  BarChart2, Activity, Zap, ArrowUpRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTheme } from 'next-themes'

/* ─── Animated Counter ─── */
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    if (!inView) return
    const dur = 1200, start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1)
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setDisplay(Math.round(value * e))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, inView])
  return <span ref={ref}>{display}{suffix}</span>
}

/* ─── Tooltip (fully inline, no CSS dependency) ─── */
function TT({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(10,12,30,0.94)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
      padding: '10px 14px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color || p.fill, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#e2e8f0' }}>{p.name}:</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginLeft: 'auto', paddingLeft: 12 }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}
const noTTBg: React.CSSProperties = { backgroundColor: 'transparent', border: 'none', padding: 0, boxShadow: 'none' }

/* ─── Animations ─── */
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 18 } } }
const springIn = { type: 'spring' as const, stiffness: 80, damping: 20 }

/* ═════════════════════════════════════════════════════════
   ADMIN ANALYTICS — Connected to real Supabase data
   ═════════════════════════════════════════════════════════ */
export default function AdminAnalytics() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const [profiles, setProfiles] = useState<any[]>([])
  const [verifications, setVerifications] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  /* ── Fetch from /api/admin/analytics ── */
  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setProfiles(data.profiles || [])
      setVerifications(data.verifications || [])
      setAllStudents(data.students || [])
      setLastUpdated(new Date())
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  /* ── Realtime: listen for changes on all 3 tables ── */
  useEffect(() => {
    load()
    const channel = supabase.channel('admin_analytics_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => load(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => load(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load(true))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [load])

  /*
   * ══════════════════════════════════════════════
   *  DERIVED DATA — all connected to real DB rows
   * ══════════════════════════════════════════════
   */

  /* Merge ATS scores from resume verification ai_result into students */
  const computedStudents = useMemo(() => {
    return allStudents.map(s => {
      const resumeVer = verifications.filter(v => v.student_id === s.id && v.type === 'resume').pop()
      const ats = resumeVer?.ai_result?.ats_score || s.ats_score || 0
      return { ...s, ats_score: ats }
    })
  }, [allStudents, verifications])

  /* Platform Growth — always render 6 months of time buckets */
  const userGrowthData = useMemo(() => {
    const now = new Date()
    const months: string[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }))
    }
    const mc: Record<string, number> = {}
    months.forEach(m => (mc[m] = 0))
    profiles.forEach(p => {
      const m = new Date(p.created_at).toLocaleString('default', { month: 'short', year: '2-digit' })
      if (mc[m] !== undefined) mc[m]++
    })
    let cum = 0
    return months.map(month => { cum += mc[month] || 0; return { month, newUsers: mc[month] || 0, totalUsers: cum } })
  }, [profiles])

  /* Role Distribution for donut */
  const roleDistribution = useMemo(() => {
    const c = profiles.reduce((a, p) => { a[p.role || 'student'] = (a[p.role || 'student'] || 0) + 1; return a }, {} as Record<string, number>)
    return [
      { name: 'Students', value: c.student || 0, color: '#818cf8' },
      { name: 'Companies', value: c.company || 0, color: '#34d399' },
      { name: 'Universities', value: c.university || 0, color: '#c084fc' },
      { name: 'Admins', value: c.admin || 0, color: '#fb7185' },
    ]
  }, [profiles])

  /*
   * Verification Status by Type
   * IMPORTANT: "not_submitted" means the student hasn't uploaded anything.
   * That is NOT "pending" — it's "Not Submitted". Only actual submitted
   * documents that are awaiting review should be "Pending".
   *
   * Real statuses in DB:
   *   - not_submitted → Not Submitted (student hasn't uploaded)
   *   - pending / uploaded / processing → Pending (awaiting AI/admin review)
   *   - ai_approved / admin_verified / verified → Verified
   *   - rejected → Rejected
   */
  const verificationStatusData = useMemo(() => {
    const typeMap: Record<string, string> = {
      resume: 'Resume', police: 'Police', aadhaar: 'Aadhaar',
      degree: 'Degree', marksheet_10th: '10th', marksheet_12th: '12th',
    }
    const counts = verifications.reduce((acc, v) => {
      const type = typeMap[v.type] || 'Other'
      if (!acc[type]) acc[type] = { name: type, verified: 0, pending: 0, rejected: 0, notSubmitted: 0 }

      const st = v.status
      if (['ai_approved', 'admin_verified', 'verified'].includes(st)) {
        acc[type].verified++
      } else if (st === 'rejected') {
        acc[type].rejected++
      } else if (st === 'not_submitted') {
        acc[type].notSubmitted++
      } else {
        // pending, uploaded, processing, etc.
        acc[type].pending++
      }
      return acc
    }, {} as Record<string, { name: string; verified: number; pending: number; rejected: number; notSubmitted: number }>)

    if (!Object.keys(counts).length) {
      return [{ name: 'No Data', verified: 0, pending: 0, rejected: 0, notSubmitted: 0 }]
    }
    return Object.values(counts)
  }, [verifications])

  /* Score Buckets — skip students with 0/null scores */
  const mkBuckets = (arr: any[], key: string) => {
    const labels = ['1-20', '21-40', '41-60', '61-80', '81-100']
    const b: Record<string, number> = {}
    labels.forEach(l => (b[l] = 0))
    arr.forEach(s => {
      const v = s[key] || 0
      if (v <= 0) return // only count students with actual scores
      if (v <= 20) b['1-20']++
      else if (v <= 40) b['21-40']++
      else if (v <= 60) b['41-60']++
      else if (v <= 80) b['61-80']++
      else b['81-100']++
    })
    return labels.map(range => ({ range, count: b[range] }))
  }
  const trustDist = useMemo(() => mkBuckets(computedStudents, 'trust_score'), [computedStudents])
  const atsDist = useMemo(() => mkBuckets(computedStudents, 'ats_score'), [computedStudents])

  /* Averages */
  const avgTrust = computedStudents.length ? Math.round(computedStudents.reduce((a, s) => a + (s.trust_score || 0), 0) / computedStudents.length) : 0
  const validATS = computedStudents.filter(s => s.ats_score > 0)
  const avgATS = validATS.length ? Math.round(validATS.reduce((a, s) => a + s.ats_score, 0) / validATS.length) : 0

  /* Counts */
  const verifiedCount = verifications.filter(v => ['ai_approved', 'admin_verified', 'verified'].includes(v.status)).length
  const submittedCount = verifications.filter(v => v.status !== 'not_submitted').length

  /* ── Theme Colors ── */
  const t = useMemo(() => ({
    grid: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)',
    axis: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
    cur: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    ds: isDark ? '#0f172a' : '#ffffff',
    bg: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.7)',
    border: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
    tp: isDark ? '#f1f5f9' : '#0f172a',
    tm: isDark ? '#64748b' : '#94a3b8',
    subtle: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
  }), [isDark])

  /* Card data */
  const stats = [
    { label: 'Total Users', value: profiles.length, icon: Users, color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
    { label: 'Submitted', value: submittedCount, icon: Shield, color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    { label: 'Verified', value: verifiedCount, icon: CheckCircle2, color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
    { label: 'Avg ATS', value: avgATS, icon: TrendingUp, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    { label: 'Trust Score', value: avgTrust, suffix: '%', icon: GraduationCap, color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  ]

  const card: React.CSSProperties = { background: t.bg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 16, backdropFilter: 'blur(12px)' }
  const cardLg: React.CSSProperties = { ...card, padding: 20 }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="relative"><div className="w-12 h-12 border-2 border-indigo-500/20 rounded-full" /><div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-indigo-500 rounded-full animate-spin" /></div>
        <span style={{ fontSize: 11, color: t.tm, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading Analytics</span>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 32 }} className="space-y-4 sm:space-y-5 px-3 sm:px-4 lg:px-6 w-full overflow-x-hidden">

      {/* ══ HEADER ══ */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: t.tp }} className="flex items-center gap-2">
            <Activity size={20} className="text-indigo-400" /> Platform Analytics
          </h1>
          <p style={{ fontSize: 11, color: t.tm, marginTop: 4 }} className="flex items-center gap-2">
            Real-time metrics · Credentia ecosystem
            <span className="inline-flex items-center gap-1" style={{ fontSize: 9, color: '#34d399', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} className="animate-pulse" /> Live
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && <span style={{ fontSize: 10, color: t.tm }} className="hidden md:inline">{lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={() => load(true)} disabled={refreshing} className="admin-refresh-btn">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline" style={{ fontSize: 11 }}>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="admin-error-banner"><Zap size={14} /> <strong>Error:</strong> {error}</motion.div>}
      </AnimatePresence>

      {/* ══ STAT CARDS ══ */}
      <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {stats.map((s, i) => (
          <motion.div key={i} variants={fadeUp} style={card} className="group relative overflow-hidden cursor-default">
            <div className="absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-2xl" style={{ background: s.color }} />
            <div className="flex items-start justify-between relative z-10 gap-2">
              <div className="min-w-0 flex-1 truncate">
                <div style={{ fontSize: 'clamp(8px, 1.5vw, 9px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: t.tm, marginBottom: 4 }} className="truncate">{s.label}</div>
                <div style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)', fontWeight: 900, color: t.tp, lineHeight: 1.1 }}><AnimatedNumber value={s.value} suffix={s.suffix || ''} /></div>
              </div>
              <div style={{ width: 'clamp(28px, 6vw, 34px)', height: 'clamp(28px, 6vw, 34px)', borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={16} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ══ ROW 1: GROWTH + DONUT ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">

        {/* Platform Growth */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={springIn} viewport={{ once: true }} className="lg:col-span-3" style={cardLg}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={14} className="text-indigo-400" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.tp }}>Platform Growth</div>
                <div style={{ fontSize: 10, color: t.tm }} className="hidden sm:block">User registrations over time</div>
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', background: 'rgba(129,140,248,0.1)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(129,140,248,0.15)' }}>
              <ArrowUpRight size={10} style={{ display: 'inline', marginTop: -2, marginRight: 2 }} />{profiles.length} users
            </span>
          </div>
          <div style={{ width: '100%', height: 'clamp(200px, 30vw, 300px)', minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis dataKey="month" stroke={t.axis} fontSize={10} tickMargin={8} axisLine={false} tickLine={false} />
                <YAxis stroke={t.axis} fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip content={<TT />} contentStyle={noTTBg} cursor={{ stroke: t.axis, strokeWidth: 1, strokeDasharray: '3 3' }} />
                <Area type="monotone" dataKey="totalUsers" name="Total Users" stroke="#818cf8" strokeWidth={2.5} fill="url(#gF)" dot={{ r: 4, fill: '#818cf8', stroke: t.ds, strokeWidth: 2 }} activeDot={{ r: 6, fill: '#818cf8', stroke: t.ds, strokeWidth: 3 }} animationDuration={2000} />
                <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#34d399" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3, fill: '#34d399', stroke: t.ds, strokeWidth: 2 }} animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 pt-2" style={{ borderTop: `1px solid ${t.border}` }}>
            <div className="flex items-center gap-1.5"><span style={{ width: 12, height: 2, borderRadius: 2, background: '#818cf8' }} /><span style={{ fontSize: 10, color: t.tm }}>Total</span></div>
            <div className="flex items-center gap-1.5"><span style={{ width: 12, height: 2, borderRadius: 2, background: '#34d399', opacity: 0.7 }} /><span style={{ fontSize: 10, color: t.tm }}>New</span></div>
          </div>
        </motion.div>

        {/* Donut */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ ...springIn, delay: 0.1 }} viewport={{ once: true }} className="lg:col-span-2 flex flex-col" style={cardLg}>
          <div className="flex items-center gap-2.5 mb-3">
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(52,211,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={14} className="text-emerald-400" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.tp }}>User Distribution</div>
              <div style={{ fontSize: 10, color: t.tm }} className="hidden sm:block">Breakdown by role</div>
            </div>
          </div>
          {/* Chart + center label share this exact container */}
          <div style={{ position: 'relative', width: '100%', height: 'clamp(180px, 25vw, 210px)', minHeight: 180 }}>
            {/* Center text — placed first so the chart SVG and Tooltip render on top of it */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 900, color: t.tp, lineHeight: 1 }}><AnimatedNumber value={profiles.length} /></span>
              <span style={{ fontSize: 'clamp(8px, 2vw, 9px)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: t.tm, marginTop: 2 }}>Users</span>
            </div>
            <ResponsiveContainer width="100%" height="100%" style={{ position: 'relative', zIndex: 10 }}>
              <PieChart>
                <Pie data={roleDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="60%" outerRadius="82%" paddingAngle={3} stroke="none" isAnimationActive animationBegin={200} animationDuration={1600}>
                  {roleDistribution.map((entry, i) => <Cell key={i} fill={entry.color} style={{ outline: 'none' }} />)}
                </Pie>
                <RechartsTooltip content={<TT />} contentStyle={noTTBg} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-auto pt-3 sm:gap-2">
            {roleDistribution.map(r => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px', borderRadius: 8, border: `1px solid ${t.border}`, background: t.subtle }} className="sm:gap-8 sm:px-2">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: t.tm, lineHeight: 1 }}>{r.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: t.tp, lineHeight: 1, marginTop: 2 }}>{r.value}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ══ ROW 2: VERIFICATIONS + ATS ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

        {/* Verifications by Type — 4 grouped bars: Verified, Pending, Rejected, Not Submitted */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={springIn} viewport={{ once: true }} style={cardLg}>
          <div className="flex items-center gap-2.5 mb-1">
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={14} className="text-violet-400" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.tp }}>Verifications by Type</div>
              <div style={{ fontSize: 10, color: t.tm }} className="hidden sm:block">Status per document type</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2 ml-2 sm:ml-9 flex-wrap">
            {[
              { l: 'Verified', c: '#34d399' },
              { l: 'Pending', c: '#fbbf24' },
              { l: 'Rejected', c: '#f87171' },
              { l: 'Not Submitted', c: '#64748b' },
            ].map(x => (
              <div key={x.l} className="flex items-center gap-1">
                <span style={{ width: 6, height: 6, borderRadius: 3, background: x.c }} />
                <span style={{ fontSize: 9, fontWeight: 600, color: t.tm, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{x.l}</span>
              </div>
            ))}
          </div>
          <div style={{ width: '100%', height: 'clamp(200px, 28vw, 260px)', minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={verificationStatusData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis dataKey="name" stroke={t.axis} fontSize={10} tickMargin={8} axisLine={false} tickLine={false} tickFormatter={(v) => v.length > 8 ? v.substring(0,8)+'..' : v} />
                <YAxis stroke={t.axis} fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip content={<TT />} contentStyle={noTTBg} cursor={{ fill: t.cur }} />
                <Bar dataKey="verified" name="Verified" fill="#34d399" radius={[4, 4, 0, 0]} animationDuration={1400} maxBarSize={24} />
                <Bar dataKey="pending" name="Pending" fill="#fbbf24" radius={[4, 4, 0, 0]} animationDuration={1400} maxBarSize={24} />
                <Bar dataKey="rejected" name="Rejected" fill="#f87171" radius={[4, 4, 0, 0]} animationDuration={1400} maxBarSize={24} />
                <Bar dataKey="notSubmitted" name="Not Submitted" fill="#64748b" radius={[4, 4, 0, 0]} animationDuration={1400} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ATS Score Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ ...springIn, delay: 0.08 }} viewport={{ once: true }} style={cardLg}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(129,140,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 size={14} className="text-indigo-400" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.tp }}>ATS Score Distribution</div>
                <div style={{ fontSize: 10, color: t.tm }} className="hidden sm:block">Resume quality ({validATS.length} students scored)</div>
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', background: 'rgba(129,140,248,0.1)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(129,140,248,0.15)' }}>Avg: {avgATS}</span>
          </div>
          <div style={{ width: '100%', height: 'clamp(200px, 28vw, 260px)', minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={atsDist} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barCategoryGap="20%">
                <defs>
                  <linearGradient id="atsG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis dataKey="range" stroke={t.axis} fontSize={10} tickMargin={8} axisLine={false} tickLine={false} />
                <YAxis stroke={t.axis} fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip content={<TT />} contentStyle={noTTBg} cursor={{ fill: t.cur }} />
                <Bar dataKey="count" name="Students" fill="url(#atsG)" radius={[6, 6, 0, 0]} animationDuration={1400} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* ══ ROW 3: TRUST SCORE ══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={springIn} viewport={{ once: true }} style={cardLg}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={14} className="text-cyan-400" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.tp }}>Trust Score Distribution</div>
              <div style={{ fontSize: 10, color: t.tm }} className="hidden sm:block">Platform credibility across {computedStudents.length} students</div>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#22d3ee', background: 'rgba(34,211,238,0.1)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(34,211,238,0.15)' }}>
            <GraduationCap size={10} style={{ display: 'inline', marginTop: -2, marginRight: 2 }} />Avg: {avgTrust}%
          </span>
        </div>
        <div style={{ width: '100%', height: 'clamp(200px, 24vw, 240px)', minHeight: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trustDist} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barCategoryGap="20%">
              <defs>
                <linearGradient id="tG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.25} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis dataKey="range" stroke={t.axis} fontSize={10} tickMargin={8} axisLine={false} tickLine={false} />
              <YAxis stroke={t.axis} fontSize={10} axisLine={false} tickLine={false} allowDecimals={false} />
              <RechartsTooltip content={<TT />} contentStyle={noTTBg} cursor={{ fill: t.cur }} />
              <Bar dataKey="count" name="Students" fill="url(#tG)" radius={[6, 6, 0, 0]} animationDuration={1400} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
}

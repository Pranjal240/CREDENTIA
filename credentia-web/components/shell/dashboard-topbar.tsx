'use client'

import * as React from 'react'
import Link from 'next/link'
import { CredentiaMark } from '@/components/brand/icons'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Home, LogOut, Search, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROLE_LABEL, DASH_NAV, type DashRole } from '@/lib/dashboard-nav'
import { timeAgo } from '@/lib/format'
import { useOutsideClick } from '@/hooks/use-outside-click'
import { useNotifications } from '@/hooks/use-notifications'
import GooeyFilter from '@/components/smoothui/components/gooey-filter'
import { ProfileAvatar } from '@/components/dash/profile-avatar'
import { useDash } from '@/components/dash/dashboard-context'

interface TopBarProps {
  prompt: string
  onOpenSearch: () => void
}

/** Pops open under its trigger and closes on a press outside or Escape. */
function usePopover() {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  useOutsideClick(ref, () => setOpen(false))
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  return { open, setOpen, ref }
}

function Popover({ open, align = 'right', className, children }: { open: boolean; align?: 'left' | 'right'; className?: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className={cn('overlay-surface absolute top-full z-50 mt-3 rounded-2xl', align === 'right' ? 'right-0' : 'left-0', className)}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

/**
 * Notification bell. The count badge is drawn inside a gooey filter with the
 * disc behind the bell, so the badge looks like it grows out of the bell and
 * pops when a new notification arrives.
 */
function NotificationBell({ userId }: { userId: string | null }) {
  const router = useRouter()
  const { items, unread, markRead } = useNotifications(userId)
  const { open, setOpen, ref } = usePopover()

  return (
    <div ref={ref} className="relative">
      <div className="relative size-11">
        <GooeyFilter className="absolute inset-0" strength={4} contrast={16}>
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-white/10" />
          {unread > 0 ? (
            <motion.span
              key={unread}
              aria-hidden="true"
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 16 }}
              className="absolute -right-0.5 -top-0.5 size-[18px] rounded-full bg-brand"
            />
          ) : null}
        </GooeyFilter>
        <button
          type="button"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="absolute inset-0 grid place-items-center rounded-full text-foreground/85 transition-colors hover:text-foreground"
        >
          <Bell className="size-[18px]" aria-hidden="true" />
        </button>
        {unread > 0 ? (
          <span aria-hidden="true" className="pointer-events-none absolute -right-0.5 -top-0.5 grid size-[18px] place-items-center text-[10px] font-extrabold leading-none text-on-brand">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </div>

      <Popover open={open} className="w-[min(92vw,360px)]">
        <div role="dialog" aria-label="Notifications">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-extrabold">Notifications</h2>
            <button type="button" disabled={unread === 0} onClick={() => markRead()} className="text-xs font-semibold text-brand-ink hover:underline disabled:pointer-events-none disabled:opacity-40">
              Mark all read
            </button>
          </div>
          <ul className="max-h-[22rem] overflow-y-auto p-1.5 scrollbar-thin">
            {items.length === 0 ? (
              <li className="px-3 py-8 text-center text-xs text-muted-foreground">You are all caught up.</li>
            ) : (
              items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.is_read) markRead([n.id])
                      setOpen(false)
                      if (n.action_url) router.push(n.action_url)
                    }}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                  >
                    <span aria-hidden="true" className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.is_read ? 'bg-white/20' : 'bg-brand')} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-foreground">{n.title}</span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.message}</span>
                      <span className="mt-1 block text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </Popover>
    </div>
  )
}

function AccountMenu({ role }: { role: DashRole }) {
  const { profile, displayName, email, userId, setAvatar, signOut } = useDash()
  const { open, setOpen, ref } = usePopover()
  const settings = DASH_NAV[role].find((item) => item.label === 'Settings')

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/[0.06] transition-colors hover:bg-white/10"
      >
        <ProfileAvatar name={displayName} email={email} avatarUrl={profile?.avatar_url as string | null} size={32} />
      </button>
      <Popover open={open} className="w-64 p-2">
        <div role="menu" aria-label="Account">
          <div className="flex items-center gap-3 px-2.5 py-2.5">
            <ProfileAvatar name={displayName} email={email} avatarUrl={profile?.avatar_url as string | null} userId={userId} size={44} editable onUploaded={setAvatar} />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
              <span className="mt-1 inline-flex rounded-md border border-brand/40 bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand-ink">{ROLE_LABEL[role]}</span>
            </div>
          </div>
          <div className="my-1 border-t border-white/10" />
          {settings ? (
            <Link role="menuitem" href={settings.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-foreground/85 hover:bg-white/[0.06]">
              <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
              Account settings
            </Link>
          ) : null}
          <Link role="menuitem" href="/" onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-foreground/85 hover:bg-white/[0.06]">
            <Home className="size-4 text-muted-foreground" aria-hidden="true" />
            Back to site
          </Link>
          <button type="button" role="menuitem" onClick={signOut} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-destructive hover:bg-destructive/10">
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </Popover>
    </div>
  )
}

/**
 * The glass bar across the top of every dashboard: brand, the ask bar that
 * opens search, notifications and the account menu. The ask bar types out a
 * suggestion that matches the page you are on.
 */
export function DashboardTopBar({ prompt, onOpenSearch }: TopBarProps) {
  const { role, userId } = useDash()
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform)

  return (
    <header className="glass relative z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 rounded-2xl px-2 py-1.5 sm:gap-x-3 sm:rounded-2xl sm:px-3">
      <Link href="/" aria-label="Credentia home" className="col-start-1 row-start-1 flex min-w-0 items-center gap-2.5 rounded-lg pl-1">
        <CredentiaMark className="size-9 shrink-0 text-foreground" />
        <span className="hidden min-w-0 leading-tight sm:block">
          <strong className="block text-xs font-extrabold tracking-[0.17em]">CREDENTIA</strong>
          <small className="block text-[10px] text-muted-foreground">{ROLE_LABEL[role]} workspace</small>
        </span>
      </Link>

      <button
        type="button"
        onClick={onOpenSearch}
        aria-label="Open search"
        className="col-span-3 row-start-2 flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-left transition-colors hover:bg-white/[0.09] sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:mx-auto sm:max-w-[420px]"
      >
        <span key={prompt} className="ask-typing min-w-0 flex-1 truncate text-xs font-semibold text-foreground/90">
          {prompt}
        </span>
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <kbd className="hidden shrink-0 rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted-foreground md:block">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>

      <div className="col-start-3 row-start-1 flex items-center gap-1.5">
        <NotificationBell userId={userId} />
        <AccountMenu role={role} />
      </div>
    </header>
  )
}

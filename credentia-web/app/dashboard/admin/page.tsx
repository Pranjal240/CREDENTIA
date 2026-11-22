'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, Briefcase, Building2, FileText, Headphones, ScrollText, ShieldCheck, Users, Clock3 } from 'lucide-react'
import { useAdminResource } from '@/hooks/use-admin'
import { useDash } from '@/components/dash/dashboard-context'
import { BarsChart, DonutChart, SERIES } from '@/components/dash/charts'
import { FolderShelf, type FolderSpec } from '@/components/dash/folder-shelf'
import { PinShelf } from '@/components/dash/pin-shelf'
import { LiveBriefing, useLastChange, type BriefingItem } from '@/components/dash/live-briefing'
import { EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel } from '@/components/dash/kit'
import { smoothButtonVariants } from '@/components/ui/button'
import { describeAction, ROLE_LABEL } from '@/lib/admin-client'
import { DOC_TYPES, docLabel, docShort } from '@/lib/documents'
import { formatDateShort, formatNumber, timeAgo } from '@/lib/format'
import { statusInfo } from '@/lib/status'
import type { AdminOverview } from '@/lib/admin-types'

export default function AdminDashboardPage() {
  const { userId } = useDash()
  const { data, loading, error, refresh } = useAdminResource<AdminOverview>('/api/admin/overview', { tables: ['verifications', 'profiles', 'support_messages', 'companies', 'universities'] })

  const updatedAt = useLastChange(data)

  if (loading) return <PageSkeleton metrics={4} panels={2} />
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />
  if (!data) return null

  const { users, documents, approvals, support, queue, recent, audit } = data
  const waiting = documents.pending + approvals.universities + approvals.companies
  const rate = documents.total ? Math.round((documents.verified / documents.total) * 100) : 0

  const oldestMs = queue[0]?.updated_at ? Date.now() - new Date(queue[0].updated_at).getTime() : 0
  const oldestDays = Math.floor(oldestMs / 86_400_000)
  const briefing: BriefingItem[] = []
  if (documents.pending > 0) {
    briefing.push({
      id: 'docs',
      tone: oldestDays >= 2 ? 'alert' : 'tip',
      title: `${formatNumber(documents.pending)} ${documents.pending === 1 ? 'document needs' : 'documents need'} a decision`,
      detail: oldestDays >= 2 ? `The longest wait is ${oldestDays} days. Students are waiting on these.` : 'Decisions made quickly keep students moving.',
      href: '/dashboard/admin/verifications',
    })
  } else {
    briefing.push({ id: 'docs', tone: 'good', title: 'The review queue is clear', detail: 'Every submitted document has a decision.' })
  }
  if (approvals.universities + approvals.companies > 0) {
    briefing.push({
      id: 'approvals',
      tone: 'tip',
      title: `${formatNumber(approvals.universities + approvals.companies)} ${approvals.universities + approvals.companies === 1 ? 'organisation is' : 'organisations are'} waiting for approval`,
      detail: `${formatNumber(approvals.companies)} companies and ${formatNumber(approvals.universities)} universities registered and cannot use their portal yet.`,
      href: approvals.companies >= approvals.universities ? '/dashboard/admin/companies' : '/dashboard/admin/outreach',
    })
  }
  if (support.unread > 0) {
    briefing.push({ id: 'support', tone: 'alert', title: `${formatNumber(support.unread)} unread support ${support.unread === 1 ? 'message' : 'messages'}`, detail: `${formatNumber(support.open)} open ${support.open === 1 ? 'conversation' : 'conversations'}. A quick reply builds trust.`, href: '/dashboard/admin/support' })
  }
  if (documents.total >= 5 && rate < 60) {
    briefing.push({ id: 'rate', tone: 'tip', title: `Only ${rate}% of submitted documents are verified`, detail: 'Check the verification rules in Settings and see which document types are rejected most.', href: '/dashboard/admin/settings' })
  }
  if (users.inactive > 0) {
    briefing.push({ id: 'inactive', tone: 'tip', title: `${formatNumber(users.inactive)} ${users.inactive === 1 ? 'account is' : 'accounts are'} switched off`, detail: 'Open Users to switch any of them back on.', href: '/dashboard/admin/users' })
  }
  if (recent[0]) {
    briefing.push({ id: 'recent', tone: 'good', title: `Newest account: ${recent[0].full_name || recent[0].email || 'Someone'}`, detail: `Joined as a ${ROLE_LABEL[recent[0].role].toLowerCase()} ${timeAgo(recent[0].created_at)}.`, href: '/dashboard/admin/users' })
  }

  const decisions = [
    { href: '/dashboard/admin/verifications', icon: <ShieldCheck />, label: 'Documents to review', hint: 'Waiting for an admin to approve or reject', count: documents.pending },
    { href: '/dashboard/admin/outreach', icon: <Building2 />, label: 'Universities to approve', hint: 'Registered, not yet approved', count: approvals.universities },
    { href: '/dashboard/admin/companies', icon: <Briefcase />, label: 'Companies to approve', hint: 'Registered, not yet approved', count: approvals.companies },
    { href: '/dashboard/admin/support', icon: <Headphones />, label: 'Unread support messages', hint: `${formatNumber(support.open)} open ${support.open === 1 ? 'conversation' : 'conversations'}`, count: support.unread },
  ]

  const bars = DOC_TYPES.map((type) => {
    const row = documents.byType[type] ?? { verified: 0, pending: 0, rejected: 0 }
    return { label: docShort(type), values: [row.verified, row.pending, row.rejected] }
  })

  const folders: FolderSpec[] = [
    {
      id: 'review',
      label: 'Documents to review',
      art: 'crimson',
      subtitle: 'The documents that have waited longest. Press one to open it in the review screen.',
      meta: queue.length === 0 ? 'Empty' : `${documents.pending} waiting`,
      entries: queue.map((item) => ({
        id: item.id,
        name: `${item.student_name}, ${docLabel(item.type)}`,
        kind: 'doc' as const,
        meta: item.ai_confidence ? `AI confidence ${item.ai_confidence}%` : 'No AI result',
        date: formatDateShort(item.updated_at),
        status: statusInfo(item.status),
        href: `/dashboard/admin/verifications?verification=${item.id}`,
      })),
      emptyTitle: 'Nothing is waiting',
      emptyHint: 'Documents that need a person appear here.',
    },
    {
      id: 'approvals',
      label: 'Awaiting approval',
      art: 'ember',
      subtitle: 'Universities and companies that registered and are not approved yet.',
      meta: approvals.items.length === 0 ? 'Empty' : `${approvals.universities + approvals.companies} waiting`,
      entries: approvals.items.map((item) => ({
        id: item.id,
        name: item.name,
        kind: 'folder' as const,
        meta: [item.kind === 'university' ? 'University' : 'Company', item.place].filter(Boolean).join(', '),
        date: formatDateShort(item.created_at),
        status: { label: 'Not approved', tone: 'warning' as const },
        href: `${item.kind === 'university' ? '/dashboard/admin/outreach' : '/dashboard/admin/companies'}?q=${encodeURIComponent(item.name)}`,
      })),
      emptyTitle: 'Everyone is approved',
      emptyHint: 'New registrations that need approval appear here.',
    },
    {
      id: 'recent',
      label: 'New accounts',
      art: 'obsidian',
      subtitle: 'The latest people to sign up. Press one to open their account.',
      meta: recent.length === 0 ? 'Empty' : `${recent.length} latest`,
      entries: recent.map((account) => ({
        id: account.id,
        name: account.full_name || account.email || 'Account',
        kind: 'person' as const,
        meta: [ROLE_LABEL[account.role] ?? account.role, account.email].filter(Boolean).join(', '),
        date: formatDateShort(account.created_at),
        href: `/dashboard/admin/users?q=${encodeURIComponent(account.email || account.full_name || '')}`,
      })),
      emptyTitle: 'No accounts yet',
    },
  ]

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="What is happening across Credentia, and what is waiting for a decision."
        actions={
          <Link href="/dashboard/admin/verifications" className={smoothButtonVariants({ size: 'sm', variant: 'outline', shape: 'pill' })}>
            <ShieldCheck aria-hidden="true" />
            Review documents
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric index={0} emphasis title="Accounts" icon={<Users />} value={users.total} detail={`${formatNumber(users.students)} students, ${formatNumber(users.companies)} companies, ${formatNumber(users.universities)} universities`} />
        <Metric index={1} title="Documents verified" icon={<ShieldCheck />} value={documents.verified} detail={documents.total ? `${rate}% of ${formatNumber(documents.total)} submitted` : 'Nothing submitted yet'} />
        <Metric index={2} title="Waiting for a decision" icon={<Clock3 />} value={waiting} detail="Documents and approvals" />
        <Metric index={3} title="Open support" icon={<Headphones />} value={support.open} detail={`${formatNumber(support.unread)} unread ${support.unread === 1 ? 'message' : 'messages'}`} />
      </div>

      <LiveBriefing items={briefing} updatedAt={updatedAt} className="mt-3" />

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[1.35fr_1fr]">
        <Panel index={4} title="Needs a decision" subtitle="Press a row to go straight to it">
          <ul className="grid grid-cols-1 gap-2">
            {decisions.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex min-h-14 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 transition-colors hover:border-brand/50 hover:bg-brand/[0.08]"
                >
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white/[0.07] text-brand-ink [&_svg]:size-4">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{item.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.hint}</span>
                  </span>
                  <span className={item.count > 0 ? 'tabular rounded-md bg-brand px-2.5 py-1 text-xs font-extrabold text-on-brand' : 'tabular rounded-md bg-white/[0.07] px-2.5 py-1 text-xs font-bold text-muted-foreground'}>
                    {item.count > 0 ? formatNumber(item.count) : 'None'}
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel index={5} title="Document status" subtitle="Every submitted document">
          {documents.total === 0 ? (
            <EmptyState icon={<FileText />} title="No documents yet" hint="Once students upload documents, their status shows here." />
          ) : (
            <DonutChart
              title="Document status"
              centerLabel="Documents"
              segments={[
                { label: 'Verified', value: documents.verified, color: SERIES.green },
                { label: 'Needs review', value: documents.pending, color: SERIES.amber },
                { label: 'Rejected', value: documents.rejected, color: SERIES.red },
              ]}
            />
          )}
        </Panel>
      </div>

      <div className="mt-3">
        <Panel index={6} title="Folders" subtitle="Press a folder to open what is inside it">
          <FolderShelf folders={folders} />
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel index={7} title="Documents by type" subtitle="How each kind of document stands">
          {documents.total === 0 ? (
            <EmptyState icon={<FileText />} title="No documents yet" />
          ) : (
            <BarsChart
              title="Documents by type"
              items={bars}
              series={[
                { label: 'Verified', color: SERIES.green },
                { label: 'Needs review', color: SERIES.amber },
                { label: 'Rejected', color: SERIES.red },
              ]}
            />
          )}
        </Panel>

        <Panel
          index={8}
          title="Recent admin activity"
          subtitle="The latest actions taken on the platform"
          action={
            <Link href="/dashboard/admin/audit" className="inline-flex items-center gap-1 text-xs font-bold text-brand-ink hover:underline">
              Open audit log
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        >
          {audit.length === 0 ? (
            <EmptyState icon={<ScrollText />} title="Nothing has happened yet" hint="Admin decisions are recorded here." />
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {audit.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{describeAction(row.action)}</span>
                    <span className="block truncate text-xs text-muted-foreground">{row.actor_email || 'System'}</span>
                  </span>
                  <time dateTime={row.created_at} className="shrink-0 pt-0.5 text-xs text-muted-foreground">
                    {timeAgo(row.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {queue.length > 0 && userId ? (
        <div className="mt-3">
          <PinShelf
            index={9}
            storageKey={`credentia:pins:admin:${userId}`}
            title="Pinned reviews"
            subtitle="Pin the documents you want to come back to"
            label="Documents"
            max={4}
            items={queue.map((item) => ({
              id: item.id,
              title: `${item.student_name}, ${docLabel(item.type)}`,
              meta: item.ai_confidence ? `AI confidence ${item.ai_confidence}%` : 'No AI result',
              icon: <FileText className="size-4" />,
              href: `/dashboard/admin/verifications?verification=${item.id}`,
            }))}
          />
        </div>
      ) : null}
    </>
  )
}

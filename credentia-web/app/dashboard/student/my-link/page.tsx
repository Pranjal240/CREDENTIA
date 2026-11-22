'use client'

import * as React from 'react'
import QRCode from 'react-qr-code'
import { EnvelopeSimple, LinkedinLogo, WhatsappLogo } from '@phosphor-icons/react'
import { ExternalLink, Eye, Link2 } from 'lucide-react'
import { useStudentData } from '@/hooks/use-student-data'
import { EmptyState, ErrorState, Metric, PageHeader, PageSkeleton, Panel } from '@/components/dash/kit'
import { Switch } from '@/components/dash/form'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'

export default function MyLinkPage() {
  const { student, loading, error, refresh } = useStudentData()
  const [origin, setOrigin] = React.useState('')
  const [busy, setBusy] = React.useState<'generate' | 'visibility' | null>(null)
  const [message, setMessage] = React.useState('')

  React.useEffect(() => setOrigin(window.location.origin), [])

  const token = student?.share_token ?? ''
  const isPublic = student?.profile_is_public === true
  const url = token && origin ? `${origin}/verify/${token}` : ''

  const generate = async () => {
    setBusy('generate')
    setMessage('')
    try {
      const res = await fetch('/api/generate-link', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.error || 'The link could not be created.')
      await refresh()
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const setVisibility = async (next: boolean) => {
    setBusy('visibility')
    setMessage('')
    try {
      const res = await fetch('/api/student/update-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile_is_public: next }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'That could not be changed.')
      await refresh()
    } catch (err) {
      setMessage((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <PageSkeleton metrics={0} panels={2} />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const shareText = encodeURIComponent(`Check my verified credentials: ${url}`)

  return (
    <>
      <PageHeader title="My link" description="One link and QR code that shows your verified documents to anyone you send it to. It works only while your profile is public." />

      {!token ? (
        <Panel>
          <EmptyState
            icon={<Link2 />}
            title="You do not have a link yet"
            hint="Create one to share your verified credentials. Your profile becomes public when you do, and you can switch that off at any time."
            action={
              <Button variant="primary" onClick={generate} disabled={busy === 'generate'}>
                {busy === 'generate' ? 'Creating' : 'Create my link'}
              </Button>
            }
          />
          {message ? (
            <p role="alert" className="pb-4 text-center text-sm text-destructive">
              {message}
            </p>
          ) : null}
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr]">
          <div className="min-w-0 space-y-3">
            <Panel index={0} title="Your verified profile" subtitle="Anyone with this link can see the documents you have verified">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-xl border border-white/10 bg-white/[0.05] px-3.5">
                  <span className="truncate font-mono text-xs text-foreground/90" aria-label="Your profile link">
                    {url || 'Preparing your link'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton value={url} />
                  <Button href={url || undefined} target="_blank" rel="noreferrer" variant="default" size="sm" disabled={!url}>
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Preview
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-bold text-muted-foreground">Share through</span>
                <Button href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noreferrer" variant="default" size="sm">
                  <WhatsappLogo className="size-4" aria-hidden="true" />
                  WhatsApp
                </Button>
                <Button href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" variant="default" size="sm">
                  <LinkedinLogo className="size-4" aria-hidden="true" />
                  LinkedIn
                </Button>
                <Button href={`mailto:?subject=${encodeURIComponent('My verified credentials')}&body=${shareText}`} variant="default" size="sm">
                  <EnvelopeSimple className="size-4" aria-hidden="true" />
                  Email
                </Button>
              </div>
            </Panel>

            <Panel index={1} title="Who can see your profile">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 text-sm">
                  <p className="font-bold">{isPublic ? 'Public' : 'Private'}</p>
                  <p className="mt-1 leading-relaxed text-muted-foreground">
                    {isPublic
                      ? 'Your link works, and companies can find you in talent search. Switch this off to hide your profile everywhere.'
                      : 'Your link shows a not found page and companies cannot find you. Switch this on when you are ready to be seen.'}
                  </p>
                </div>
                <Switch checked={isPublic} onChange={setVisibility} label="Make my profile public" disabled={busy === 'visibility'} />
              </div>
              {message ? (
                <p role="alert" className="mt-3 text-sm text-destructive">
                  {message}
                </p>
              ) : null}
            </Panel>
          </div>

          <div className="min-w-0 space-y-3">
            <Panel index={2} title="QR code" subtitle="Scan to open your profile">
              <div className="grid place-items-center py-2">
                {url ? (
                  <div className="rounded-2xl bg-white p-3" role="img" aria-label="QR code for your profile link">
                    <QRCode value={url} size={168} bgColor="#FFFFFF" fgColor="#000000" />
                  </div>
                ) : (
                  <div className="skeleton size-[192px]" aria-hidden="true" />
                )}
              </div>
            </Panel>
            <Metric index={3} title="Profile views" icon={<Eye />} value={student?.profile_views ?? 0} detail="Each time the link is opened" />
          </div>
        </div>
      )}
    </>
  )
}

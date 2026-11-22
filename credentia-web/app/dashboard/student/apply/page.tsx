'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { Briefcase, ExternalLink, MapPin, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Badge, EmptyState, ErrorState, PageHeader, PageSkeleton, Panel, StatusBadge } from '@/components/dash/kit'
import { Dialog } from '@/components/dash/dialog'
import { Field, TextArea, TextInput } from '@/components/dash/form'
import { ProfileAvatar } from '@/components/dash/profile-avatar'
import { SearchBar } from '@/components/ui/search-bar'
import { useSearch } from '@/components/search/search-context'
import { Button } from '@/components/ui/button'
import { formatDateShort } from '@/lib/format'

interface CompanyEntity {
  company_name?: string | null
  industry?: string | null
  company_size?: string | null
  website?: string | null
  logo_url?: string | null
  state?: string | null
  description?: string | null
  is_verified?: boolean | null
  minimum_ats_score?: number | null
  minimum_cgpa?: number | null
  require_police_verification?: boolean | null
  require_aadhaar?: boolean | null
  require_degree?: boolean | null
}

interface Company {
  id: string
  full_name?: string | null
  avatar_url?: string | null
  entityData?: CompanyEntity | null
}

interface Application {
  company_id: string
  job_title?: string | null
  status?: string | null
  created_at?: string | null
}

const nameOf = (company: Company) => company.entityData?.company_name || company.full_name || 'Company'

function Requirements({ entity }: { entity?: CompanyEntity | null }) {
  const items = [
    entity?.minimum_ats_score ? `ATS ${entity.minimum_ats_score} or above` : null,
    entity?.minimum_cgpa ? `CGPA ${entity.minimum_cgpa} or above` : null,
    entity?.require_police_verification ? 'Police certificate verified' : null,
    entity?.require_aadhaar ? 'Aadhaar verified' : null,
    entity?.require_degree ? 'Degree verified' : null,
  ].filter(Boolean) as string[]
  if (items.length === 0) return null
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold text-muted-foreground">Looks for</p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li key={item} className="rounded-lg border border-white/12 bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function StudentApplyPage() {
  const search = useSearch()
  const params = useSearchParams()
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [applications, setApplications] = React.useState<Application[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [query, setQuery] = React.useState('')
  const [target, setTarget] = React.useState<Company | null>(null)
  const [role, setRole] = React.useState('')
  const [note, setNote] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [formError, setFormError] = React.useState('')
  const [sent, setSent] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const [companyRes, applicationRes] = await Promise.all([fetch('/api/student/companies', { cache: 'no-store' }), fetch('/api/student/my-applications', { cache: 'no-store' })])
      if (!companyRes.ok) throw new Error('Companies could not be loaded.')
      const companyData = await companyRes.json()
      const applicationData = applicationRes.ok ? await applicationRes.json() : { applications: [] }
      setCompanies(companyData.companies ?? [])
      setApplications(applicationData.applications ?? [])
      setError('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
    // Company details change when a company edits its page, so the list stays current.
    const channel = supabase
      .channel('student_companies_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => void load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  // A search result can link straight to one company.
  const wanted = params?.get('company')
  React.useEffect(() => {
    if (!wanted || companies.length === 0) return
    const match = companies.find((company) => company.id === wanted)
    if (match) setTarget(match)
  }, [wanted, companies])

  const applied = React.useMemo(() => new Map(applications.map((a) => [a.company_id, a])), [applications])
  const q = query.trim().toLowerCase()
  const shown = companies.filter((company) => !q || `${nameOf(company)} ${company.entityData?.industry ?? ''} ${company.entityData?.description ?? ''} ${company.entityData?.state ?? ''}`.toLowerCase().includes(q))

  const close = React.useCallback(() => {
    setTarget(null)
    setRole('')
    setNote('')
    setFormError('')
    setSent(false)
  }, [])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!target || !role.trim()) {
      setFormError('Tell the company which role you are applying for.')
      return
    }
    setSending(true)
    setFormError('')
    try {
      const res = await fetch('/api/student/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: target.id, job_title: role.trim(), notes: note.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'The application could not be sent.')
      setSent(true)
      await load()
      window.setTimeout(close, 1400)
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <PageSkeleton metrics={0} panels={2} />
  if (error) return <ErrorState message={error} onRetry={load} />

  const mine = applications.map((a) => ({ ...a, name: nameOf(companies.find((c) => c.id === a.company_id) ?? { id: '', full_name: 'Company' }) }))

  return (
    <>
      <PageHeader title="Companies" description="Browse the companies on Credentia and apply with your verified profile. Companies see your scores and which documents are verified." />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
        <Panel index={0} title="Open to applications" subtitle={`${shown.length} of ${companies.length} companies`}>
          <SearchBar value={query} onChange={setQuery} placeholder="Search by company, industry or state" className="mb-4" onAskAI={(q) => search.open({ query: q })} />
          {shown.length === 0 ? (
            <EmptyState icon={<Briefcase />} title={companies.length === 0 ? 'No companies yet' : 'No company matches'} hint={companies.length === 0 ? 'Companies appear here once they join Credentia.' : 'Try a different word.'} />
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {shown.map((company) => {
                const entity = company.entityData
                const done = applied.get(company.id)
                return (
                  <li key={company.id} className="glass-flat flex min-w-0 flex-col gap-3 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <ProfileAvatar name={nameOf(company)} avatarUrl={entity?.logo_url || company.avatar_url} size={44} />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-extrabold">{nameOf(company)}</h3>
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          {entity?.industry ? <span>{entity.industry}</span> : null}
                          {entity?.state ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3" aria-hidden="true" />
                              {entity.state}
                            </span>
                          ) : null}
                          {entity?.company_size ? (
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-3" aria-hidden="true" />
                              {entity.company_size}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      {entity?.is_verified ? <Badge tone="success">Approved</Badge> : null}
                    </div>
                    {entity?.description ? <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{entity.description}</p> : null}
                    <Requirements entity={entity} />
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      {done ? (
                        <>
                          <StatusBadge status={done.status || 'pending'} />
                          <span className="text-xs text-muted-foreground">Applied for {done.job_title}</span>
                        </>
                      ) : (
                        <Button size="sm" variant="primary" onClick={() => setTarget(company)}>
                          Apply
                        </Button>
                      )}
                      {entity?.website ? (
                        <a href={/^https?:\/\//.test(entity.website) ? entity.website : `https://${entity.website}`} target="_blank" rel="noreferrer" className="ml-auto inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand-ink hover:underline">
                          Website
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel index={1} title="My applications" subtitle="Where you have applied">
          {mine.length === 0 ? (
            <EmptyState icon={<Briefcase />} title="No applications yet" hint="Pick a company and press Apply." />
          ) : (
            <ul className="divide-y divide-white/10">
              {mine.map((application) => (
                <li key={application.company_id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{application.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{application.job_title}</p>
                    <p className="text-[11px] text-muted-foreground">{formatDateShort(application.created_at)}</p>
                  </div>
                  <StatusBadge status={application.status || 'pending'} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Dialog
        open={Boolean(target)}
        onClose={close}
        title={target ? `Apply to ${nameOf(target)}` : ''}
        description="Your verified profile is shared with the company when you apply."
        size="sm"
      >
        {sent ? (
          <p role="status" className="py-6 text-center text-sm font-semibold text-success">
            Application sent.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Role you are applying for" htmlFor="apply-role">
              <TextInput id="apply-role" value={role} onChange={(e) => setRole(e.target.value)} maxLength={100} placeholder="For example, Software engineer intern" autoFocus required />
            </Field>
            <Field label="Note to the company (optional)" htmlFor="apply-note">
              <TextArea id="apply-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Why you are a fit" />
            </Field>
            {formError ? (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="default" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={sending}>
                {sending ? 'Sending' : 'Send application'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  )
}

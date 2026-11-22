'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase'
import { useDash } from '@/components/dash/dashboard-context'
import { Badge, ErrorState, PageHeader, PageSkeleton, Panel } from '@/components/dash/kit'
import { Field, SelectInput, Switch, TextArea, TextInput } from '@/components/dash/form'
import { ProfileAvatar } from '@/components/dash/profile-avatar'
import { Button } from '@/components/ui/button'

interface Form {
  company_name: string
  phone: string
  industry: string
  company_size: string
  state: string
  website: string
  description: string
  minimum_ats_score: string
  minimum_cgpa: string
  require_police_verification: boolean
  require_aadhaar: boolean
  require_degree: boolean
}

const SIZES = ['1 to 10', '11 to 50', '51 to 200', '201 to 500', '501 to 1000', 'More than 1000']

export default function CompanySettingsPage() {
  const { userId, email, profile, displayName, setAvatar } = useDash()
  const [form, setForm] = React.useState<Form | null>(null)
  const [approved, setApproved] = React.useState<boolean | null>(null)
  const [error, setError] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [notice, setNotice] = React.useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const load = React.useCallback(async () => {
    if (!userId) return
    const { data, error: loadError } = await supabase.from('companies').select('*').eq('id', userId).maybeSingle()
    if (loadError) {
      setError(loadError.message)
      return
    }
    setApproved(data?.is_verified === true)
    setForm({
      company_name: data?.company_name || (profile?.full_name as string) || '',
      phone: (profile?.phone as string) || '',
      industry: data?.industry || '',
      company_size: data?.company_size || '',
      state: data?.state || '',
      website: data?.website || '',
      description: data?.description || '',
      minimum_ats_score: data?.minimum_ats_score ? String(data.minimum_ats_score) : '',
      minimum_cgpa: data?.minimum_cgpa ? String(data.minimum_cgpa) : '',
      require_police_verification: Boolean(data?.require_police_verification),
      require_aadhaar: Boolean(data?.require_aadhaar),
      require_degree: Boolean(data?.require_degree),
    })
  }, [userId, profile])

  React.useEffect(() => {
    void load()
    // load reads the profile once the dashboard has it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form) return
    setSaving(true)
    setNotice(null)
    try {
      const res = await fetch('/api/company/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, minimum_ats_score: form.minimum_ats_score ? Number(form.minimum_ats_score) : null, minimum_cgpa: form.minimum_cgpa ? Number(form.minimum_cgpa) : null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Your settings could not be saved.')
      setNotice({ tone: 'success', text: 'Saved.' })
    } catch (err) {
      setNotice({ tone: 'error', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!form) return <PageSkeleton metrics={0} panels={2} />

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Your company page, and what you look for in candidates. Students see this when they decide where to apply." />

      <div className="space-y-3">
        <Panel index={0}>
          <div className="flex items-center gap-4">
            <ProfileAvatar name={displayName} email={email} avatarUrl={profile?.avatar_url as string | null} userId={userId} size={64} editable onUploaded={setAvatar} />
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold">{form.company_name || 'Your company'}</p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
              <div className="mt-1.5">
                <Badge tone={approved ? 'success' : 'warning'}>{approved ? 'Approved by an admin' : 'Waiting for admin approval'}</Badge>
              </div>
            </div>
          </div>
        </Panel>

        <Panel index={1} title="Company profile">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Company name" htmlFor="c-name" className="sm:col-span-2">
              <TextInput id="c-name" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} maxLength={120} required />
            </Field>
            <Field label="Industry" htmlFor="c-industry">
              <TextInput id="c-industry" value={form.industry} onChange={(e) => set('industry', e.target.value)} maxLength={80} placeholder="Technology" />
            </Field>
            <Field label="Company size" htmlFor="c-size">
              <SelectInput id="c-size" value={form.company_size} onChange={(e) => set('company_size', e.target.value)}>
                <option value="">Not added</option>
                {SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} people
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="State" htmlFor="c-state">
              <TextInput id="c-state" value={form.state} onChange={(e) => set('state', e.target.value)} maxLength={80} autoComplete="address-level1" />
            </Field>
            <Field label="Phone number" htmlFor="c-phone">
              <TextInput id="c-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} maxLength={20} autoComplete="tel" />
            </Field>
            <Field label="Website" htmlFor="c-site" className="sm:col-span-2">
              <TextInput id="c-site" type="url" value={form.website} onChange={(e) => set('website', e.target.value)} maxLength={200} placeholder="https://example.com" />
            </Field>
            <Field label="About the company" htmlFor="c-about" hint="Shown to students on the Companies page" className="sm:col-span-2">
              <TextArea id="c-about" value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={1200} />
            </Field>
          </div>
        </Panel>

        <Panel index={2} title="What you look for" subtitle="Students see this before they apply. It does not block anyone.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Minimum ATS score" htmlFor="c-ats" hint="From 0 to 100">
              <TextInput id="c-ats" type="number" inputMode="numeric" min={0} max={100} value={form.minimum_ats_score} onChange={(e) => set('minimum_ats_score', e.target.value)} placeholder="70" />
            </Field>
            <Field label="Minimum CGPA" htmlFor="c-cgpa" hint="Out of 10">
              <TextInput id="c-cgpa" type="number" inputMode="decimal" step="0.1" min={0} max={10} value={form.minimum_cgpa} onChange={(e) => set('minimum_cgpa', e.target.value)} placeholder="7.5" />
            </Field>
          </div>
          <ul className="mt-5 divide-y divide-white/10">
            {(
              [
                ['require_police_verification', 'Police certificate verified'],
                ['require_aadhaar', 'Aadhaar verified'],
                ['require_degree', 'Degree verified'],
              ] as const
            ).map(([key, label]) => (
              <li key={key} className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm font-semibold">{label}</span>
                <Switch checked={form[key]} onChange={(value) => set(key, value)} label={label} />
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex flex-wrap items-center justify-end gap-3 pb-2">
          {notice ? (
            <p role={notice.tone === 'error' ? 'alert' : 'status'} className={notice.tone === 'error' ? 'text-sm text-destructive' : 'text-sm font-semibold text-success'}>
              {notice.text}
            </p>
          ) : null}
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving' : 'Save changes'}
          </Button>
        </div>
      </div>
    </form>
  )
}

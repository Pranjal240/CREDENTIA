'use client'

import * as React from 'react'
import { useDash } from '@/components/dash/dashboard-context'
import { useRegistry } from '@/hooks/use-registry'
import { Badge, ErrorState, PageHeader, PageSkeleton, Panel } from '@/components/dash/kit'
import { Field, SelectInput, TextInput } from '@/components/dash/form'
import { ProfileAvatar } from '@/components/dash/profile-avatar'
import { Button } from '@/components/ui/button'

const NAAC = ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C']

interface Form {
  university_name: string
  city: string
  state: string
  ugc_id: string
  naac_grade: string
}

export default function UniversitySettingsPage() {
  const { userId, email, profile, displayName, setAvatar } = useDash()
  const { approved, university, loading, error, refresh } = useRegistry()
  const [form, setForm] = React.useState<Form | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [notice, setNotice] = React.useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  React.useEffect(() => {
    if (loading || form || !university) return
    setForm({ university_name: university.name, city: university.city ?? '', state: university.state ?? '', ugc_id: university.ugc_id ?? '', naac_grade: university.naac_grade ?? '' })
  }, [loading, form, university])

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form) return
    setSaving(true)
    setNotice(null)
    try {
      const res = await fetch('/api/university/update-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Your settings could not be saved.')
      setNotice({ tone: 'success', text: 'Saved.' })
      await refresh()
    } catch (err) {
      setNotice({ tone: 'error', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  if (error) return <ErrorState message={error} onRetry={refresh} />
  if (loading || !form) return <PageSkeleton metrics={0} panels={2} />

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Your institution's details. Students see the name when they link to you." />

      <div className="space-y-3">
        <Panel index={0}>
          <div className="flex items-center gap-4">
            <ProfileAvatar name={displayName} email={email} avatarUrl={profile?.avatar_url as string | null} userId={userId} size={64} editable onUploaded={setAvatar} />
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold">{form.university_name || 'Your institution'}</p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
              <div className="mt-1.5">
                <Badge tone={approved ? 'success' : 'warning'}>{approved ? 'Approved by an admin' : 'Waiting for admin approval'}</Badge>
              </div>
            </div>
          </div>
        </Panel>

        <Panel index={1} title="Institution">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Institution name" htmlFor="u-name" className="sm:col-span-2">
              <TextInput id="u-name" value={form.university_name} onChange={(e) => set('university_name', e.target.value)} maxLength={160} required />
            </Field>
            <Field label="City" htmlFor="u-city">
              <TextInput id="u-city" value={form.city} onChange={(e) => set('city', e.target.value)} maxLength={80} autoComplete="address-level2" />
            </Field>
            <Field label="State" htmlFor="u-state">
              <TextInput id="u-state" value={form.state} onChange={(e) => set('state', e.target.value)} maxLength={80} autoComplete="address-level1" />
            </Field>
            <Field label="UGC identifier" htmlFor="u-ugc" hint="Helps an admin confirm your institution">
              <TextInput id="u-ugc" value={form.ugc_id} onChange={(e) => set('ugc_id', e.target.value)} maxLength={40} />
            </Field>
            <Field label="NAAC grade" htmlFor="u-naac">
              <SelectInput id="u-naac" value={form.naac_grade} onChange={(e) => set('naac_grade', e.target.value)}>
                <option value="">Not added</option>
                {NAAC.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
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

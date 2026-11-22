'use client'

import * as React from 'react'
import { useDash } from '@/components/dash/dashboard-context'
import { useStudentData } from '@/hooks/use-student-data'
import { Badge, ErrorState, PageHeader, PageSkeleton, Panel } from '@/components/dash/kit'
import { Field, SelectInput, Switch, TextInput } from '@/components/dash/form'
import { ProfileAvatar } from '@/components/dash/profile-avatar'
import { Button } from '@/components/ui/button'

interface University {
  id: string
  name: string
  city?: string | null
  state?: string | null
  approved: boolean
}

interface Form {
  name: string
  phone: string
  course: string
  branch: string
  graduation_year: string
  cgpa: string
  city: string
  state: string
  profile_is_public: boolean
  university_id: string
}

const firstOf = (verifications: { type: string; ai_result?: Record<string, any> | null }[], pick: (type: string, ai: Record<string, any>) => unknown) => {
  for (const v of verifications) {
    if (!v.ai_result) continue
    const value = pick(v.type, v.ai_result)
    if (value !== undefined && value !== null && value !== '') return String(value)
  }
  return ''
}

export default function StudentSettingsPage() {
  const { userId, email, profile, displayName, setAvatar } = useDash()
  const { student, verifications, loading, error, refresh } = useStudentData()
  const [form, setForm] = React.useState<Form | null>(null)
  const [universities, setUniversities] = React.useState<University[]>([])
  const [saving, setSaving] = React.useState(false)
  const [notice, setNotice] = React.useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  // Start from the saved record. Anything still empty is filled from what the AI read, as before.
  React.useEffect(() => {
    if (loading || form) return
    const resume = verifications.filter((v) => v.type === 'resume')
    const degree = verifications.filter((v) => v.type === 'degree')
    setForm({
      name: (student?.name as string) || (profile?.full_name as string) || '',
      phone: (profile?.phone as string) || '',
      course: student?.course || firstOf(degree, (_t, ai) => ai.course || ai.degree) || firstOf(resume, (_t, ai) => ai.course),
      branch: student?.branch || firstOf(resume, (_t, ai) => ai.branch),
      graduation_year: student?.graduation_year ? String(student.graduation_year) : firstOf(resume, (_t, ai) => ai.graduation_year) || firstOf(degree, (_t, ai) => ai.year_of_passing),
      cgpa: student?.cgpa ? String(student.cgpa) : firstOf(degree, (_t, ai) => String(ai.grade_cgpa ?? '').replace(/[^0-9.]/g, '')) || firstOf(resume, (_t, ai) => ai.cgpa),
      city: student?.city || firstOf(resume, (_t, ai) => ai.city),
      state: student?.state || firstOf(resume, (_t, ai) => ai.state),
      profile_is_public: student?.profile_is_public ?? true,
      university_id: student?.university_id || (profile?.linked_university_id as string) || '',
    })
  }, [loading, form, student, verifications, profile])

  React.useEffect(() => {
    fetch('/api/student/universities', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { universities: [] }))
      .then((data) => setUniversities(data.universities ?? []))
      .catch(() => undefined)
  }, [])

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form) return
    if (!form.name.trim()) {
      setNotice({ tone: 'error', text: 'Your name cannot be empty.' })
      return
    }
    setSaving(true)
    setNotice(null)
    try {
      const res = await fetch('/api/student/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, graduation_year: form.graduation_year ? Number(form.graduation_year) : null, cgpa: form.cgpa ? Number(form.cgpa) : null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Your details could not be saved.')
      setNotice({ tone: 'success', text: 'Saved.' })
      await refresh()
    } catch (err) {
      setNotice({ tone: 'error', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) return <PageSkeleton metrics={0} panels={2} />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const linked = universities.find((u) => u.id === form.university_id)

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Your details, who can see your profile, and the university you are linked to." />

      <div className="space-y-3">
        <Panel index={0}>
          <div className="flex items-center gap-4">
            <ProfileAvatar name={displayName} email={email} avatarUrl={profile?.avatar_url as string | null} userId={userId} size={64} editable onUploaded={setAvatar} />
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold">{form.name || 'Student'}</p>
              <p className="truncate text-sm text-muted-foreground">{email}</p>
              <p className="mt-1 text-xs text-muted-foreground">Press your photo to change it.</p>
            </div>
          </div>
        </Panel>

        <Panel index={1} title="Personal details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="s-name">
              <TextInput id="s-name" value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={120} autoComplete="name" required />
            </Field>
            <Field label="Phone number" htmlFor="s-phone">
              <TextInput id="s-phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} maxLength={20} autoComplete="tel" placeholder="9876543210" />
            </Field>
            <Field label="Course" htmlFor="s-course">
              <TextInput id="s-course" value={form.course} onChange={(e) => set('course', e.target.value)} maxLength={80} placeholder="B.Tech" />
            </Field>
            <Field label="Branch or specialisation" htmlFor="s-branch">
              <TextInput id="s-branch" value={form.branch} onChange={(e) => set('branch', e.target.value)} maxLength={80} placeholder="Computer Science" />
            </Field>
            <Field label="Graduation year" htmlFor="s-year">
              <TextInput id="s-year" type="number" inputMode="numeric" min={1980} max={2100} value={form.graduation_year} onChange={(e) => set('graduation_year', e.target.value)} placeholder="2026" />
            </Field>
            <Field label="CGPA" htmlFor="s-cgpa" hint="Out of 10">
              <TextInput id="s-cgpa" type="number" inputMode="decimal" step="0.01" min={0} max={10} value={form.cgpa} onChange={(e) => set('cgpa', e.target.value)} placeholder="8.5" />
            </Field>
            <Field label="City" htmlFor="s-city">
              <TextInput id="s-city" value={form.city} onChange={(e) => set('city', e.target.value)} maxLength={80} autoComplete="address-level2" />
            </Field>
            <Field label="State" htmlFor="s-state">
              <TextInput id="s-state" value={form.state} onChange={(e) => set('state', e.target.value)} maxLength={80} autoComplete="address-level1" />
            </Field>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
            <Field label="10th percentage" hint="Read from your marksheet. Only an admin can change it.">
              <div className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.02] px-3.5 text-sm text-muted-foreground">{student?.percentage_10th ? `${student.percentage_10th}%` : 'Not read yet'}</div>
            </Field>
            <Field label="12th percentage" hint="Read from your marksheet. Only an admin can change it.">
              <div className="flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.02] px-3.5 text-sm text-muted-foreground">{student?.percentage_12th ? `${student.percentage_12th}%` : 'Not read yet'}</div>
            </Field>
          </div>
        </Panel>

        <Panel index={2} title="Visibility">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 text-sm">
              <p className="font-bold">Visible to companies</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">
                {form.profile_is_public ? 'Companies can find you in talent search and your public link works.' : 'Your profile is private. Companies cannot find you and your public link shows a not found page.'}
              </p>
            </div>
            <Switch checked={form.profile_is_public} onChange={(value) => set('profile_is_public', value)} label="Visible to companies" />
          </div>
        </Panel>

        <Panel index={3} title="My university" subtitle="Link your account so your university can see your verification progress">
          <Field label="University" htmlFor="s-uni" hint={linked && !linked.approved ? 'This university is waiting for admin approval, so it cannot see students yet.' : undefined}>
            <SelectInput id="s-uni" value={form.university_id} onChange={(e) => set('university_id', e.target.value)}>
              <option value="">Not linked</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.city ? `, ${u.city}` : ''}
                  {u.approved ? '' : ' (waiting for approval)'}
                </option>
              ))}
            </SelectInput>
          </Field>
          {linked ? (
            <div className="mt-3">
              <Badge tone={linked.approved ? 'success' : 'warning'}>{linked.approved ? 'Approved university' : 'Waiting for approval'}</Badge>
            </div>
          ) : null}
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

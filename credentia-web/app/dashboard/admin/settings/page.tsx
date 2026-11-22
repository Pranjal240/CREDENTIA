'use client'

import * as React from 'react'
import { CircleAlert, Database, FileStack, ScanText, Sparkles } from 'lucide-react'
import SmoothButton from '@/components/smoothui/components/smooth-button'
import { Button } from '@/components/ui/button'
import { useAdminResource } from '@/hooks/use-admin'
import { Field, SelectInput, Switch, TextInput } from '@/components/dash/form'
import { Badge, ErrorState, PageHeader, PageSkeleton, Panel } from '@/components/dash/kit'
import { adminPost } from '@/lib/admin-client'
import { timeAgo } from '@/lib/format'
import { PLATFORM_SETTINGS, validateSetting } from '@/lib/platform-settings'
import type { PlatformSetting, ServiceStatus } from '@/lib/admin-types'

const SERVICE_ICON: Record<string, React.ReactNode> = { Database: <Database />, 'File storage': <FileStack />, 'Document AI': <ScanText />, 'Fast AI': <Sparkles /> }

export default function AdminSettingsPage() {
  const { data, loading, error, refresh } = useAdminResource<{ settings: PlatformSetting[]; services: ServiceStatus[] }>('/api/admin/settings', { pollMs: 0 })
  const [values, setValues] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)
  const [notice, setNotice] = React.useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  // Fill the form once the settings arrive, and again after a save, never in the middle of an edit.
  const seeded = React.useRef(false)
  React.useEffect(() => {
    if (data && !seeded.current) {
      seeded.current = true
      setValues(Object.fromEntries(data.settings.map((s) => [s.key, s.value])))
    }
  }, [data])

  const saved = React.useMemo(() => new Map((data?.settings ?? []).map((s) => [s.key, s])), [data])
  const problems = React.useMemo(() => {
    const out: Record<string, string> = {}
    for (const setting of PLATFORM_SETTINGS) {
      const result = validateSetting(setting.key, values[setting.key] ?? '')
      if (!result.ok) out[setting.key] = result.error
    }
    return out
  }, [values])
  const changed = PLATFORM_SETTINGS.filter((s) => saved.has(s.key) && (values[s.key] ?? '') !== saved.get(s.key)?.value)
  const hasProblems = Object.keys(problems).length > 0

  const save = async () => {
    if (changed.length === 0 || hasProblems) return
    setSaving(true)
    setNotice(null)
    try {
      await adminPost('/api/admin/settings', { settings: changed.map((s) => ({ key: s.key, value: values[s.key] })) })
      seeded.current = false
      await refresh()
      setNotice({ tone: 'success', text: `${changed.length} ${changed.length === 1 ? 'setting' : 'settings'} saved and written to the audit log.` })
    } catch (err) {
      setNotice({ tone: 'error', text: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const discard = () => {
    setValues(Object.fromEntries((data?.settings ?? []).map((s) => [s.key, s.value])))
    setNotice(null)
  }

  if (loading) return <PageSkeleton metrics={0} panels={2} />
  if (error && !data) return <ErrorState message={error} onRetry={refresh} />
  if (!data) return null

  return (
    <>
      <PageHeader title="Settings" description="The rules the team has agreed for verification, and the state of the services the platform runs on." />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
        <Panel index={0} title="Verification rules" subtitle="Press Save changes when you are done. Each change is written to the audit log.">
          <p className="mb-4 flex gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs leading-relaxed text-foreground/90">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            <span>The first three rules decide new documents within about a minute of saving. Maintenance mode is recorded but does not block anything yet.</span>
          </p>

          <div className="space-y-3">
            {PLATFORM_SETTINGS.map((setting) => {
              const current = values[setting.key] ?? setting.fallback
              const row = saved.get(setting.key)
              const dirty = changed.some((c) => c.key === setting.key)
              return (
                <div key={setting.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                    <div className="min-w-0 flex-1 basis-60">
                      <p className="flex items-center gap-2 text-sm font-extrabold">
                        {setting.label}
                        {dirty ? <Badge tone="warning">Not saved</Badge> : null}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{setting.description}</p>
                      {row?.updated_at ? <p className="mt-1.5 text-[11px] text-muted-foreground">Last changed {timeAgo(row.updated_at)}</p> : null}
                    </div>

                    <div className="shrink-0">
                      {setting.kind === 'toggle' ? (
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-muted-foreground">{current === 'true' ? 'On' : 'Off'}</span>
                          <Switch checked={current === 'true'} label={setting.label} onChange={(on) => setValues({ ...values, [setting.key]: on ? 'true' : 'false' })} />
                        </div>
                      ) : setting.kind === 'choice' ? (
                        <Field label="Choose" htmlFor={`set-${setting.key}`} error={problems[setting.key]} className="w-64 max-w-full">
                          <SelectInput id={`set-${setting.key}`} value={current} onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}>
                            {setting.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </SelectInput>
                        </Field>
                      ) : (
                        <Field label="Value" htmlFor={`set-${setting.key}`} error={problems[setting.key]} className="w-40">
                          <div className="flex items-center gap-2">
                            <TextInput id={`set-${setting.key}`} type="number" inputMode="numeric" min={setting.min} max={setting.max} value={current} onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })} className="tabular text-center font-bold" />
                            {setting.suffix ? <span className="text-xs font-bold text-muted-foreground">{setting.suffix}</span> : null}
                          </div>
                        </Field>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="sm" disabled={saving || changed.length === 0 || hasProblems} onClick={() => void save()}>
              {saving ? 'Saving' : changed.length > 0 ? `Save ${changed.length} ${changed.length === 1 ? 'change' : 'changes'}` : 'Save changes'}
            </Button>
            <SmoothButton variant="ghost" shape="pill" size="sm" disabled={saving || changed.length === 0} onClick={discard}>
              Discard
            </SmoothButton>
            {notice ? (
              <p role={notice.tone === 'error' ? 'alert' : 'status'} className={notice.tone === 'error' ? 'text-sm font-semibold text-destructive' : 'text-sm font-semibold text-success'}>
                {notice.text}
              </p>
            ) : null}
          </div>
        </Panel>

        <Panel index={1} className="lg:self-start" title="Services" subtitle="Whether each service has its credentials in place. Keys are never shown.">
          <ul className="space-y-2.5">
            {data.services.map((service) => (
              <li key={service.name} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-white/[0.07] text-brand-ink [&_svg]:size-4">
                  {SERVICE_ICON[service.name]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{service.name}</span>
                    <span className="text-xs text-muted-foreground">{service.provider}</span>
                  </span>
                  <span className="mt-0.5 block break-words text-xs leading-relaxed text-muted-foreground">{service.detail}</span>
                </span>
                {service.ready ? <Badge tone="success">Set up</Badge> : <Badge tone="danger">Missing</Badge>}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  )
}

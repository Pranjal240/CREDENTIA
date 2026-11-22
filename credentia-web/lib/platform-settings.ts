/**
 * The platform settings an admin can change. Each has a type, so the server can
 * refuse a value that makes no sense and the page can draw the right control.
 */

export type SettingKind = 'number' | 'choice' | 'toggle'

export interface SettingDefinition {
  key: string
  label: string
  description: string
  kind: SettingKind
  fallback: string
  min?: number
  max?: number
  suffix?: string
  options?: { value: string; label: string }[]
}

export const PLATFORM_SETTINGS: SettingDefinition[] = [
  {
    key: 'ai_confidence_threshold',
    label: 'AI confidence needed to approve a document',
    description: 'The least confidence, as a percentage, the AI must have before a document can be approved without a person.',
    kind: 'number',
    fallback: '70',
    min: 0,
    max: 100,
    suffix: '%',
  },
  {
    key: 'auto_resume_threshold',
    label: 'ATS score that approves a resume',
    description: 'A resume scoring above this ATS score is approved automatically.',
    kind: 'number',
    fallback: '60',
    min: 0,
    max: 100,
    suffix: 'points',
  },
  {
    key: 'manual_review_types',
    label: 'Documents that need a person',
    description: 'These document types are always checked by an admin, even when the AI is confident.',
    kind: 'choice',
    fallback: 'police',
    options: [
      { value: 'police', label: 'Police certificate' },
      { value: 'police,aadhaar', label: 'Police certificate and Aadhaar' },
      { value: 'police,aadhaar,degree', label: 'Police certificate, Aadhaar and degree' },
      { value: 'none', label: 'None, trust the AI' },
    ],
  },
  {
    key: 'maintenance_mode',
    label: 'Maintenance mode',
    description: 'Puts the platform in maintenance mode.',
    kind: 'toggle',
    fallback: 'false',
  },
]

/** The outcome of checking one value. `error` is empty when `ok` is true. */
export interface SettingCheck {
  ok: boolean
  value: string
  error: string
}

const good = (value: string): SettingCheck => ({ ok: true, value, error: '' })
const bad = (error: string): SettingCheck => ({ ok: false, value: '', error })

export function validateSetting(key: string, raw: unknown): SettingCheck {
  const setting = PLATFORM_SETTINGS.find((s) => s.key === key)
  if (!setting) return bad(`${key || 'That setting'} is not a known setting.`)
  const text = typeof raw === 'number' || typeof raw === 'boolean' ? String(raw) : typeof raw === 'string' ? raw.trim() : ''

  if (setting.kind === 'toggle') {
    return text === 'true' || text === 'false' ? good(text) : bad(`${setting.label} must be on or off.`)
  }
  if (setting.kind === 'choice') {
    return setting.options?.some((option) => option.value === text) ? good(text) : bad(`Choose one of the listed options for ${setting.label}.`)
  }
  const n = Number(text)
  if (text === '' || !Number.isFinite(n) || n < (setting.min ?? 0) || n > (setting.max ?? 100)) {
    return bad(`${setting.label} must be a number from ${setting.min ?? 0} to ${setting.max ?? 100}.`)
  }
  return good(String(Math.round(n)))
}

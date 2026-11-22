import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { audit, requireAdmin } from '@/lib/admin'
import { PLATFORM_SETTINGS, validateSetting } from '@/lib/platform-settings'
import { GEMINI_MODELS, GROQ_TEXT_MODEL } from '@/lib/ai-config'
import { clearPolicyCache } from '@/lib/doc-policy'
import type { PlatformSetting, ServiceStatus } from '@/lib/admin-types'

export const dynamic = 'force-dynamic'

const has = (...names: string[]) => names.every((name) => Boolean(process.env[name]))

/** Which services have their credentials in place. Only yes or no is reported, never a value. */
function services(): ServiceStatus[] {
  return [
    { name: 'Database', provider: 'Supabase', detail: 'Accounts, documents and the audit log', ready: has('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY') },
    { name: 'File storage', provider: 'Cloudflare R2', detail: 'Uploaded documents and resumes', ready: has('CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_BUCKET_NAME') },
    { name: 'Document AI', provider: 'Google Gemini', detail: `Reads documents. Models: ${GEMINI_MODELS.join(', ')}`, ready: has('GEMINI_API_KEY') },
    { name: 'Fast AI', provider: 'Groq', detail: `Search and Peon. Model: ${GROQ_TEXT_MODEL}`, ready: has('GROQ_API_KEY') },
  ]
}

/** The platform settings, with a default for any that was never saved. */
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabaseAdmin.from('platform_settings').select('key, value, updated_at')
  if (error) {
    console.error('[admin/settings] failed:', error.message)
    return NextResponse.json({ error: 'The settings could not be loaded.' }, { status: 500 })
  }
  const stored = new Map((data ?? []).map((row) => [row.key as string, row]))
  const settings: PlatformSetting[] = PLATFORM_SETTINGS.map((setting) => ({
    key: setting.key,
    label: setting.label,
    description: setting.description,
    value: (stored.get(setting.key)?.value as string | undefined) ?? setting.fallback,
    updated_at: (stored.get(setting.key)?.updated_at as string | undefined) ?? null,
  }))
  return NextResponse.json({ settings, services: services() })
}

/** Saves the settings that changed. Unknown keys and out of range values are refused. */
export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => null)
  const incoming: unknown = body?.settings
  if (!Array.isArray(incoming) || incoming.length === 0) return NextResponse.json({ error: 'Nothing to save.' }, { status: 400 })

  const clean: { key: string; value: string }[] = []
  for (const entry of incoming) {
    const key = typeof entry?.key === 'string' ? entry.key : ''
    const result = validateSetting(key, entry?.value)
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    clean.push({ key, value: result.value })
  }

  try {
    const { data: before } = await supabaseAdmin.from('platform_settings').select('key, value').in('key', clean.map((c) => c.key))
    const previous = new Map((before ?? []).map((row) => [row.key as string, row.value as string]))
    const now = new Date().toISOString()

    const { error } = await supabaseAdmin.from('platform_settings').upsert(
      clean.map((c) => {
        const meta = PLATFORM_SETTINGS.find((s) => s.key === c.key)
        return { key: c.key, value: c.value, label: meta?.label ?? c.key, description: meta?.description ?? '', updated_at: now, updated_by: admin.userId }
      }),
      { onConflict: 'key' },
    )
    if (error) throw error
    // New documents are decided by these values, so the next one should see the change on this server straight away.
    clearPolicyCache()

    const changed = clean.filter((c) => (previous.get(c.key) ?? PLATFORM_SETTINGS.find((s) => s.key === c.key)?.fallback) !== c.value)
    if (changed.length > 0) {
      await audit(admin, 'update_settings', 'platform_settings', changed.map((c) => c.key).join(','), {
        changes: Object.fromEntries(changed.map((c) => [c.key, { from: previous.get(c.key) ?? null, to: c.value }])),
      })
    }
    return NextResponse.json({ success: true, changed: changed.length })
  } catch (error) {
    console.error('[admin/settings] save failed:', (error as Error).message)
    return NextResponse.json({ error: 'The settings could not be saved.' }, { status: 500 })
  }
}

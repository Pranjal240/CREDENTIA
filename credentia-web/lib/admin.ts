import { supabaseAdmin } from '@/lib/supabase'
import { getCallerWithRole, type Caller } from '@/lib/api-auth'

/** The signed in admin, or null. Every admin route starts here. */
export const requireAdmin = () => getCallerWithRole(['admin'])

/**
 * Writes one line to the audit log with the columns the table really has.
 * Failing to log never blocks the action, but it is reported on the server.
 */
export async function audit(actor: Caller, action: string, targetType: string, targetId: string, details?: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from('audit_logs').insert({
    actor_id: actor.userId,
    actor_email: actor.email,
    action,
    target_type: targetType,
    target_id: targetId,
    details: details ?? null,
  })
  if (error) console.error(`[audit] ${action} could not be logged:`, error.message)
}

export const cleanText = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : ''

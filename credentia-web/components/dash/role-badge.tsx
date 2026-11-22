import { cn } from '@/lib/utils'
import { ROLE_LABEL } from '@/lib/admin-client'

/** The role of an account. Admins stand out in the brand colour, the rest are quiet. */
export function RoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-bold',
        role === 'admin' ? 'bg-brand/15 text-brand-ink' : 'bg-white/[0.07] text-foreground/85',
        className,
      )}
    >
      {ROLE_LABEL[role] ?? role}
    </span>
  )
}

export default RoleBadge

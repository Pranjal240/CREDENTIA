'use client'

import { SwipeHeading } from '@/components/site/swipe'
import { cn } from '@/lib/utils'

/**
 * Section heading whose words rise into view as it scrolls onto the screen. Used on every public
 * section so text arrives the same way everywhere.
 */
export function RevealHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div className={cn('mb-10 max-w-2xl sm:mb-14', align === 'center' ? 'mx-auto text-center' : 'text-left', className)}>
      {eyebrow ? (
        <p data-swipe className="eyebrow">
          {eyebrow}
        </p>
      ) : null}
      <SwipeHeading
        text={title}
        className="mt-3 text-balance text-[clamp(1.8rem,4.2vw,2.9rem)] font-extrabold leading-[1.1] tracking-tight text-foreground"
      />
      {subtitle ? (
        <p data-swipe style={{ '--i': 3 } as React.CSSProperties} className="mt-4 text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

export default RevealHeading

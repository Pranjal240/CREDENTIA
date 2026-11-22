import * as React from 'react'
import BlurOutUp from '@/components/smoothui/components/blur-out-up'
import { cn } from '@/lib/utils'

/**
 * Building blocks for the public information pages (features, pricing, legal,
 * about and so on). The header and footer come from the site layout, so a page
 * is a hero and a body.
 */

export function InfoPage({
  eyebrow,
  title,
  subtitle,
  children,
  width = 'max-w-5xl',
}: {
  eyebrow?: string
  title: string
  subtitle: string
  children: React.ReactNode
  width?: string
}) {
  return (
    <>
      <section className="relative px-4 pb-10 pt-32 text-center sm:pt-40">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1 className="mx-auto mt-4 max-w-3xl text-balance text-[clamp(2.1rem,6vw,4.1rem)] font-extrabold leading-[1.05] tracking-tight text-foreground">
          <BlurOutUp>{title}</BlurOutUp>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          <BlurOutUp delay={250} stagger={10}>
            {subtitle}
          </BlurOutUp>
        </p>
      </section>
      <div className={cn('mx-auto w-full px-4 pb-24 sm:px-6', width)}>{children}</div>
    </>
  )
}

export function CardGrid({ children, cols = 3, className }: { children: React.ReactNode; cols?: 2 | 3 | 4; className?: string }) {
  return (
    <div className={cn('grid gap-4', cols === 2 && 'md:grid-cols-2', cols === 3 && 'md:grid-cols-2 lg:grid-cols-3', cols === 4 && 'sm:grid-cols-2 lg:grid-cols-4', className)}>
      {children}
    </div>
  )
}

export function InfoCard({
  icon,
  title,
  children,
  className,
  id,
}: {
  icon?: React.ReactNode
  title: string
  children?: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <article id={id} data-swipe className={cn('glass-flat scroll-mt-28 rounded-2xl p-5 sm:p-6', className)}>
      {icon ? <div className="mb-4 grid size-11 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-foreground [&_svg]:size-5">{icon}</div> : null}
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {children ? <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div> : null}
    </article>
  )
}

/** Long form text, such as a policy. Headings, paragraphs and lists get consistent spacing. */
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'glass-flat mx-auto max-w-3xl rounded-3xl p-6 sm:p-10',
        '[&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2:first-child]:mt-0',
        '[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-foreground',
        '[&_p]:mb-4 [&_p]:text-sm [&_p]:leading-7 [&_p]:text-foreground/75',
        '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:text-sm [&_ul]:leading-7 [&_ul]:text-foreground/75',
        '[&_a]:text-brand-ink [&_a]:underline-offset-4 hover:[&_a]:underline',
        '[&_strong]:font-bold [&_strong]:text-foreground',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center' }: { eyebrow?: string; title: string; subtitle?: string; align?: 'center' | 'left' }) {
  return (
    <div className={cn('mb-10 max-w-2xl', align === 'center' ? 'mx-auto text-center' : 'text-left')}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-3 text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight tracking-tight text-foreground">{title}</h2>
      {subtitle ? <p className="mt-3 text-base leading-relaxed text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}

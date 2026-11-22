'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUp, ArrowUpRight, BookOpen, Home, Mail, MapPin } from 'lucide-react'
import { InstagramLogo, LinkedinLogo, XLogo } from '@phosphor-icons/react'
import { CredentiaMark } from '@/components/brand/icons'
import { FitWordmark } from '@/components/site/fit-wordmark'
import { scrollToTarget } from '@/components/shell/smooth-scroll'
import { Button } from '@/components/ui/button'
import GlassDock, { type DockItem } from '@/components/ui/glass-dock'
import { CONTACT_EMAIL, FOOTER_LINKS, SOCIALS } from '@/lib/site-config'

const DOCK: DockItem[] = [
  { title: 'Home', icon: Home, morph: 'home', href: '/' },
  { title: 'Blog', icon: BookOpen, morph: 'blog', href: '/blog' },
  { title: 'Contact', icon: MapPin, morph: 'marker', href: '/contact' },
  { title: 'Email', icon: Mail, morph: 'email', href: `mailto:${CONTACT_EMAIL}` },
  { title: 'LinkedIn', icon: LinkedinLogo, morph: 'linkedin', href: SOCIALS.linkedin.href },
  { title: 'X', icon: XLogo, morph: 'x', href: SOCIALS.x.href },
  { title: 'Instagram', icon: InstagramLogo, href: SOCIALS.instagram.href },
]

const PORTAL_LINKS = [
  { label: 'Student portal', href: '/login/student' },
  { label: 'Company portal', href: '/for-companies' },
  { label: 'University portal', href: '/login/university' },
]

const MARQUEE = ['Resume', 'Police certificate', 'Aadhaar', 'Degree', 'One trusted link']

function MarqueeRun() {
  return (
    <div className="flex shrink-0 items-center gap-8 pr-8 sm:gap-12 sm:pr-12">
      {MARQUEE.map((word) => (
        <span key={word} className="flex items-center gap-8 sm:gap-12">
          <span>{word}</span>
          <CredentiaMark className="size-5 text-brand-ink" />
        </span>
      ))}
    </div>
  )
}

const style = (i: number) => ({ '--i': i }) as React.CSSProperties

/**
 * The footer is a curtain. On a large screen the page scrolls away and uncovers it, and what it holds
 * arrives as it is uncovered. On smaller screens it is an ordinary block at the end of the page.
 * It carries the closing call to action, the links, and a giant outlined wordmark.
 */
export function SiteFooter() {
  return (
    <div className="curtain">
      <footer className="curtain-pane relative flex flex-col overflow-hidden border-t border-white/12 bg-black/55 text-foreground">
        <div aria-hidden="true" className="curtain-giant pointer-events-none relative z-0 order-last select-none px-[var(--edge)] pb-4 pt-6">
          <FitWordmark text="CREDENTIA" outline animate={false} />
        </div>

        <div aria-hidden="true" className="relative z-10 mt-24 -rotate-1 scale-105 overflow-hidden border-y border-white/12 bg-black/50 py-3.5 lg:mt-[clamp(88px,11vh,130px)]">
          <div className="marquee-track flex w-max text-xs font-bold uppercase tracking-[0.28em] text-muted-foreground sm:text-sm">
            <MarqueeRun />
            <MarqueeRun />
          </div>
        </div>

        <div className="page-x relative z-10 grid flex-1 gap-10 py-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-16 lg:py-4">
          <div>
            <h2 className="curtain-rise max-w-[16ch] text-balance text-[clamp(2.4rem,4.8vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.04em]" style={style(0)}>
              Get your profile verified today.
            </h2>
            <p className="curtain-rise mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg" style={style(1)}>
              Free for students. Companies and universities can sign in to the portal built for them.
            </p>
            <div className="curtain-rise mt-7 flex flex-wrap items-center gap-3" style={style(2)}>
              <Button href="/register" variant="primary" size="lg">
                Create free profile
                <ArrowRight className="size-4" />
              </Button>
              <Button href="/contact" variant="default" size="lg">
                Talk to us
              </Button>
            </div>
          </div>

          <ul className="curtain-rise" style={style(2)}>
            {PORTAL_LINKS.map((link) => (
              <li key={link.href} className="border-t border-white/12 last:border-b">
                <Link
                  href={link.href}
                  prefetch={false}
                  className="group flex min-h-14 items-center justify-between gap-4 py-4 text-2xl font-extrabold tracking-tight transition-colors hover:text-brand-ink focus-visible:text-brand-ink focus-visible:outline-none sm:text-3xl"
                >
                  {link.label}
                  <ArrowUpRight className="size-6 text-muted-foreground transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-brand-ink" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="curtain-rise page-x relative z-10 grid gap-10 border-t border-white/12 pb-8 pt-8 md:grid-cols-[1.3fr_repeat(3,1fr)]" style={style(3)}>
          <div>
            <Link href="/" prefetch={false} className="inline-flex items-center gap-2.5 text-base font-extrabold tracking-tight">
              <CredentiaMark className="size-9 text-foreground" />
              Credentia
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI credential verification for students, companies and universities in India. Verify once, share one trusted link.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <nav key={group} aria-label={group}>
              <h2 className="eyebrow !text-muted-foreground">{group}</h2>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} prefetch={false} className="text-sm text-foreground/75 transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="curtain-rise page-x relative z-20 flex flex-col items-center justify-between gap-5 border-t border-white/12 py-5 text-xs text-muted-foreground sm:flex-row lg:pr-28" style={style(4)}>
          <p>
            © {new Date().getFullYear()} Credentia. All rights reserved. Made in India.
          </p>
          <GlassDock items={DOCK} />
          <button
            type="button"
            onClick={() => scrollToTarget(0)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-xs font-bold text-foreground transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to top
            <ArrowUp className="size-4" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </div>
  )
}

export default SiteFooter

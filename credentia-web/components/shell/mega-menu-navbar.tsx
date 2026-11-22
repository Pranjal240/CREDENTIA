'use client'

import * as React from 'react'
import Link from 'next/link'
import { CredentiaMark } from '@/components/brand/icons'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, MoveRight, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { scrollToTarget } from '@/components/shell/smooth-scroll'

/** Any icon component that takes a className, so the site's own icons and the stock ones both fit. */
export type NavIcon = React.ComponentType<{ className?: string }>

export interface MegaMenuItem {
  title: string
  description?: string
  href: string
  icon?: NavIcon
  badge?: string
}

export interface MegaMenuResourceGroup {
  title: string
  links: MegaMenuItem[]
}

export interface MegaMenuPromo {
  icon: NavIcon
  title: string
  description: string
  href: string
  cta: string
}

export interface MegaMenuNavbarProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  brandName?: string
  brandHref?: string
  /** Replaces the default logo image. */
  logo?: React.ReactNode
  /** First menu, a wide grid of feature cards. */
  featuresLabel?: string
  features: MegaMenuItem[]
  featuresFooter?: { text: string; href: string; cta: string }
  /** Second menu, a short list of audiences. */
  audienceLabel?: string
  audiences: MegaMenuItem[]
  audienceFooter?: { title: string; text: string; href: string; cta: string }
  /** Plain link between the two menus and the resources menu. */
  pricingHref?: string
  /** Third menu, a promo card plus grouped links. */
  resourcesLabel?: string
  resourcePromo?: MegaMenuPromo
  resourceGroups: MegaMenuResourceGroup[]
  loginHref?: string
  ctaHref?: string
  ctaLabel?: string
  /** When set, the header shows one button to this destination instead of log in and sign up. */
  signedInHref?: string
  signedInLabel?: string
  /** When set, a search button sits beside the menus and calls this. */
  onSearch?: () => void
}

type DesktopMenu = 'features' | 'audience' | 'resources' | null
type MobileSection = Exclude<DesktopMenu, null>

function isHash(href: string) {
  return href.startsWith('#')
}

/** A link that is a Next link for paths and a smooth scroll for in page hashes. */
function NavLink({
  href,
  className,
  children,
  onNavigate,
  ...rest
}: {
  href: string
  className?: string
  children: React.ReactNode
  onNavigate?: () => void
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  if (isHash(href)) {
    return (
      <a
        href={href}
        className={className}
        onClick={(e) => {
          e.preventDefault()
          onNavigate?.()
          scrollToTarget(href, -90)
        }}
        {...rest}
      >
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className} onClick={onNavigate} {...rest}>
      {children}
    </Link>
  )
}

function Brand({
  brandName,
  brandHref,
  logo,
  onNavigate,
}: {
  brandName: string
  brandHref: string
  logo?: React.ReactNode
  onNavigate?: () => void
}) {
  return (
    <Link
      href={brandHref}
      onClick={onNavigate}
      className="relative z-10 flex shrink-0 items-center gap-2.5 rounded-lg text-base font-extrabold tracking-tight text-foreground"
    >
      {logo ?? (
        <CredentiaMark className="size-8 text-foreground" />
      )}
      <span>{brandName}</span>
    </Link>
  )
}

function MenuTrigger({
  id,
  label,
  isOpen,
  onToggle,
  onOpen,
}: {
  id: string
  label: string
  isOpen: boolean
  onToggle: () => void
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={id}
      onClick={onToggle}
      onFocus={onOpen}
      className={cn(
        'flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium state-transition',
        'text-foreground/70 hover:bg-white/[0.07] hover:text-foreground',
        isOpen && 'bg-white/[0.07] text-foreground',
      )}
    >
      {label}
      <ChevronDown className={cn('size-3.5 opacity-60 transition-transform duration-200', isOpen && 'rotate-180')} />
    </button>
  )
}

function DesktopDropdown({
  id,
  open,
  className,
  children,
}: {
  id: string
  open: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      id={id}
      aria-hidden={!open}
      className={cn(
        'absolute left-0 top-full z-50 pt-3 transition-all duration-200 ease-out-smooth',
        open ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible translate-y-2 opacity-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

function IconTile({ icon: Icon, className }: { icon: NavIcon; className?: string }) {
  return (
    <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] transition-colors group-hover/item:border-brand/50 group-hover/item:bg-brand/10', className)}>
      <Icon className="size-6 text-foreground" />
    </span>
  )
}

function MobileAccordion({
  title,
  value,
  openSection,
  onToggle,
  children,
}: {
  title: string
  value: MobileSection
  openSection: MobileSection | null
  onToggle: (value: MobileSection) => void
  children: React.ReactNode
}) {
  const isOpen = openSection === value
  const contentId = `mobile-${value}-content`
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => onToggle(value)}
        className="flex min-h-12 w-full items-center justify-between py-3 text-sm font-semibold text-foreground"
      >
        {title}
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>
      <div
        id={contentId}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr] pb-3 opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-2 flex flex-col gap-1 border-l-2 border-white/10 pl-3">{children}</div>
        </div>
      </div>
    </div>
  )
}

function MobileMenuItem({ item, onNavigate }: { item: MegaMenuItem; onNavigate: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      href={item.href}
      onNavigate={onNavigate}
      className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground/70 state-transition hover:bg-white/[0.07] hover:text-foreground"
    >
      {Icon ? <Icon className="size-4 text-brand-ink" /> : null}
      <span>{item.title}</span>
    </NavLink>
  )
}

/**
 * The Credentia header, built as a floating glass notch. Three mega menus
 * (features, audiences, resources), a plain pricing link, and the account
 * buttons. Menus open on hover or focus and toggle on click. A drawer with
 * accordions replaces them below the large breakpoint.
 */
export function MegaMenuNavbar({
  brandName = 'Credentia',
  brandHref = '/',
  logo,
  featuresLabel = 'Features',
  features,
  featuresFooter,
  audienceLabel = 'Use Cases',
  audiences,
  audienceFooter,
  pricingHref = '/pricing',
  resourcesLabel = 'Resources',
  resourcePromo,
  resourceGroups,
  loginHref = '/login',
  ctaHref = '/register',
  ctaLabel = 'Get started',
  signedInHref,
  signedInLabel = 'Dashboard',
  onSearch,
  className,
  ...props
}: MegaMenuNavbarProps) {
  const pathname = usePathname() ?? ''
  const [openMenu, setOpenMenu] = React.useState<DesktopMenu>(null)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [mobileSection, setMobileSection] = React.useState<MobileSection | null>(null)
  const [raised, setRaised] = React.useState(false)
  const navRef = React.useRef<HTMLElement>(null)
  const drawerRef = React.useRef<HTMLElement>(null)
  const closeButtonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenu(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpenMenu(null)
      setMobileOpen(false)
    }
    const onScroll = () => setRaised(window.scrollY > 16)
    onScroll()
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // A new page closes every menu.
  React.useEffect(() => {
    setOpenMenu(null)
    setMobileOpen(false)
    setMobileSection(null)
  }, [pathname])

  // The drawer is inert while closed so its links cannot be tabbed to.
  React.useEffect(() => {
    const drawer = drawerRef.current
    if (!drawer) return
    drawer.toggleAttribute('inert', !mobileOpen)
  }, [mobileOpen])

  React.useEffect(() => {
    if (!mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileOpen])

  const closeMobile = () => {
    setMobileOpen(false)
    setMobileSection(null)
  }
  const toggleDesktopMenu = (menu: Exclude<DesktopMenu, null>) =>
    setOpenMenu((current) => (current === menu ? null : menu))
  const toggleMobileSection = (section: MobileSection) =>
    setMobileSection((current) => (current === section ? null : section))

  const isActive = (href: string) => !isHash(href) && (pathname === href || (href !== '/' && pathname.startsWith(href)))

  return (
    <header
      {...props}
      ref={navRef}
      className={cn('fixed inset-x-0 top-3 z-50 flex justify-center px-3', className)}
      onMouseLeave={(event) => {
        setOpenMenu(null)
        props.onMouseLeave?.(event)
      }}
    >
      <div
        className={cn(
          'glass-strong w-full max-w-6xl rounded-2xl px-3 transition-shadow duration-300 sm:px-4',
          raised && 'shadow-[0_18px_50px_-18px_rgba(0,0,0,0.9)]',
        )}
      >
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Brand brandName={brandName} brandHref={brandHref} logo={logo} />

            <nav aria-label="Primary navigation" className="hidden items-center lg:flex">
              <ul className="flex items-center gap-0.5">
                <li className="relative" onMouseEnter={() => setOpenMenu('features')}>
                  <MenuTrigger id="features-mega-menu" label={featuresLabel} isOpen={openMenu === 'features'} onToggle={() => toggleDesktopMenu('features')} onOpen={() => setOpenMenu('features')} />
                  <DesktopDropdown id="features-mega-menu" open={openMenu === 'features'} className="w-[640px]">
                    <div className="overlay-surface rounded-2xl p-4">
                      <div className="grid grid-cols-2 gap-1.5">
                        {features.map((item) => (
                          <NavLink
                            key={item.title}
                            href={item.href}
                            className="group/item flex items-start gap-3 rounded-xl p-3 state-transition hover:bg-white/[0.06]"
                          >
                            {item.icon ? <IconTile icon={item.icon} /> : null}
                            <span className="min-w-0">
                              <span className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">{item.title}</span>
                                {item.badge ? (
                                  <span className="rounded-md border border-brand/40 bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-ink">{item.badge}</span>
                                ) : null}
                              </span>
                              {item.description ? (
                                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{item.description}</span>
                              ) : null}
                            </span>
                          </NavLink>
                        ))}
                      </div>
                      {featuresFooter ? (
                        <div className="mt-3 flex items-center justify-between border-t border-white/10 px-2 pt-3">
                          <span className="text-sm text-muted-foreground">{featuresFooter.text}</span>
                          <NavLink href={featuresFooter.href} className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-brand-ink">
                            {featuresFooter.cta}
                            <MoveRight className="size-4" />
                          </NavLink>
                        </div>
                      ) : null}
                    </div>
                  </DesktopDropdown>
                </li>

                <li className="relative" onMouseEnter={() => setOpenMenu('audience')}>
                  <MenuTrigger id="audience-mega-menu" label={audienceLabel} isOpen={openMenu === 'audience'} onToggle={() => toggleDesktopMenu('audience')} onOpen={() => setOpenMenu('audience')} />
                  <DesktopDropdown id="audience-mega-menu" open={openMenu === 'audience'} className="w-[390px]">
                    <div className="overlay-surface rounded-2xl p-3">
                      <div className="flex flex-col gap-1">
                        {audiences.map((item) => (
                          <NavLink
                            key={item.title}
                            href={item.href}
                            className="group/item flex items-center gap-3 rounded-xl p-3 state-transition hover:bg-white/[0.06]"
                          >
                            {item.icon ? <IconTile icon={item.icon} /> : null}
                            <span>
                              <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                              {item.description ? (
                                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.description}</span>
                              ) : null}
                            </span>
                          </NavLink>
                        ))}
                      </div>
                      {audienceFooter ? (
                        <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-sm font-semibold text-foreground">{audienceFooter.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{audienceFooter.text}</p>
                          <NavLink href={audienceFooter.href} className="mt-3 inline-flex text-xs font-semibold text-brand-ink hover:underline">
                            {audienceFooter.cta}
                          </NavLink>
                        </div>
                      ) : null}
                    </div>
                  </DesktopDropdown>
                </li>

                <li>
                  <NavLink
                    href={pricingHref}
                    aria-current={isActive(pricingHref) ? 'page' : undefined}
                    className={cn(
                      'inline-flex rounded-lg px-3.5 py-2 text-sm font-medium state-transition hover:bg-white/[0.07] hover:text-foreground',
                      isActive(pricingHref) ? 'text-foreground' : 'text-foreground/70',
                    )}
                  >
                    Pricing
                  </NavLink>
                </li>

                <li className="relative" onMouseEnter={() => setOpenMenu('resources')}>
                  <MenuTrigger id="resources-mega-menu" label={resourcesLabel} isOpen={openMenu === 'resources'} onToggle={() => toggleDesktopMenu('resources')} onOpen={() => setOpenMenu('resources')} />
                  <DesktopDropdown id="resources-mega-menu" open={openMenu === 'resources'} className="w-[620px]">
                    <div className="overlay-surface grid grid-cols-3 gap-5 rounded-2xl p-5">
                      {resourcePromo ? (
                        <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/[0.04] p-5">
                          <div>
                            <span className="flex size-10 items-center justify-center rounded-xl bg-brand/15 text-brand-ink">
                              <resourcePromo.icon className="size-5" />
                            </span>
                            <h4 className="mt-4 text-sm font-semibold text-foreground">{resourcePromo.title}</h4>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{resourcePromo.description}</p>
                          </div>
                          <NavLink href={resourcePromo.href} className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink hover:underline">
                            {resourcePromo.cta}
                            <MoveRight className="size-3.5" />
                          </NavLink>
                        </div>
                      ) : null}
                      <div className={cn('grid grid-cols-2 gap-5', resourcePromo ? 'col-span-2' : 'col-span-3')}>
                        {resourceGroups.map((group) => (
                          <div key={group.title} className="flex flex-col gap-1">
                            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.title}</h4>
                            {group.links.map((item) => {
                              const Icon = item.icon
                              return (
                                <NavLink
                                  key={item.title}
                                  href={item.href}
                                  className="flex items-center gap-2 rounded-lg p-2 text-sm text-foreground/70 state-transition hover:bg-white/[0.07] hover:text-foreground"
                                >
                                  {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
                                  {item.title}
                                </NavLink>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </DesktopDropdown>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {onSearch ? (
              <button
                type="button"
                aria-label="Search Credentia"
                onClick={onSearch}
                className="flex size-11 items-center justify-center rounded-xl text-foreground/80 state-transition hover:bg-white/[0.07] hover:text-foreground"
              >
                <Search className="size-5" aria-hidden="true" />
              </button>
            ) : null}
            <div className="hidden items-center gap-2 lg:flex">
              {signedInHref ? (
                <Button href={signedInHref} variant="primary" size="sm">
                  {signedInLabel}
                </Button>
              ) : (
                <>
                  <Button href={loginHref} variant="default" size="sm">
                    Log in
                  </Button>
                  <Button href={ctaHref} variant="primary" size="sm">
                    {ctaLabel}
                  </Button>
                </>
              )}
            </div>

            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="flex size-11 items-center justify-center rounded-xl text-foreground/80 state-transition hover:bg-white/[0.07] lg:hidden"
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>
      </div>

      <div
        aria-hidden={!mobileOpen}
        onClick={closeMobile}
        className={cn(
          'fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileOpen}
        aria-label="Mobile navigation"
        className={cn(
          'fixed inset-y-0 right-0 z-[60] flex w-full max-w-sm flex-col overlay-surface p-6 transition-transform duration-300 ease-out lg:hidden',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <Brand brandName={brandName} brandHref={brandHref} logo={logo} onNavigate={closeMobile} />
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeMobile}
            aria-label="Close navigation menu"
            className="flex size-11 items-center justify-center rounded-xl text-muted-foreground state-transition hover:bg-white/[0.07] hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Mobile navigation" className="-mx-6 flex-1 overflow-y-auto px-6" data-lenis-prevent>
          <MobileAccordion title={featuresLabel} value="features" openSection={mobileSection} onToggle={toggleMobileSection}>
            {features.map((item) => (
              <MobileMenuItem key={item.title} item={item} onNavigate={closeMobile} />
            ))}
          </MobileAccordion>
          <MobileAccordion title={audienceLabel} value="audience" openSection={mobileSection} onToggle={toggleMobileSection}>
            {audiences.map((item) => (
              <MobileMenuItem key={item.title} item={item} onNavigate={closeMobile} />
            ))}
          </MobileAccordion>
          <NavLink href={pricingHref} onNavigate={closeMobile} className="flex min-h-12 items-center border-b border-white/10 py-3 text-sm font-semibold text-foreground">
            Pricing
          </NavLink>
          <MobileAccordion title={resourcesLabel} value="resources" openSection={mobileSection} onToggle={toggleMobileSection}>
            {resourceGroups.flatMap((group) =>
              group.links.map((item) => <MobileMenuItem key={`${group.title}-${item.title}`} item={item} onNavigate={closeMobile} />),
            )}
          </MobileAccordion>
        </nav>

        <div className="mt-auto grid grid-cols-1 gap-3 pt-6">
          {signedInHref ? (
            <Button href={signedInHref} variant="primary" onClick={closeMobile}>
              {signedInLabel}
            </Button>
          ) : (
            <>
              <Button href={ctaHref} variant="primary" onClick={closeMobile}>
                {ctaLabel}
              </Button>
              <Button href={loginHref} variant="default" onClick={closeMobile}>
                Log in
              </Button>
            </>
          )}
        </div>
      </aside>
    </header>
  )
}

export default MegaMenuNavbar

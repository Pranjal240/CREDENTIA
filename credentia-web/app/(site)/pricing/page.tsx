import type { Metadata } from 'next'
import { Building2, Check, Star, Zap } from 'lucide-react'
import { InfoPage } from '@/components/site/info-kit'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Pricing', description: 'Free for students. Plans for teams and institutions.' }

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'For students starting out. All core verification features included.',
    icon: Zap,
    popular: false,
    features: [
      'Resume upload and AI analysis',
      'ATS score and keyword analysis',
      'Police certificate verification',
      'Aadhaar identity verification',
      'Degree and marksheet verification',
      'Shareable verified profile link and QR code',
      'Email support',
    ],
    cta: 'Get started free',
    href: '/register',
    disabled: false,
  },
  {
    name: 'Pro',
    price: '₹299',
    period: '/month', // link-ok
    description: 'For professionals who want priority verification and advanced analytics.',
    icon: Star,
    popular: true,
    features: [
      'Everything in Free',
      'Priority AI verification queue',
      'Advanced resume analytics',
      'Multiple resume versions',
      'Custom verification page branding',
      'Detailed credential reports',
      'Priority email and chat support',
      'Verification badge on profile',
    ],
    cta: 'Coming soon',
    href: '#',
    disabled: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For companies and universities that verify at scale.',
    icon: Building2,
    popular: false,
    features: [
      'Everything in Pro',
      'Bulk verifications',
      'API access for integration',
      'Custom verification workflows',
      'Dedicated account manager',
      'SSO and advanced security',
      'Service level agreements',
      'White-label options',
    ],
    cta: 'Contact sales',
    href: '/contact',
    disabled: false,
  },
]

export default function PricingPage() {
  return (
    <InfoPage eyebrow="Pricing" title="Simple pricing" subtitle="Start free, move up when you need more. Paid plans are being built, and Pro is marked as coming soon until it ships.">
      <div className="grid items-start gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className={cn('glass-flat relative rounded-3xl p-6 sm:p-8', plan.popular && 'border-brand/60 bg-brand/[0.06]')}>
            {plan.popular ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-lg bg-brand px-4 py-1 text-xs font-bold text-on-brand">Most popular</span> : null}
            <div className="mb-4 grid size-12 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-ink">
              <plan.icon className="size-6" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold">{plan.name}</h2>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tracking-tight">{plan.price}</span>
              {plan.period ? <span className="text-sm text-muted-foreground">{plan.period}</span> : null}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>
            <ul className="my-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-foreground/80">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button href={plan.disabled ? undefined : plan.href} disabled={plan.disabled} variant={plan.popular ? 'primary' : 'default'} className="w-full">
              {plan.cta}
            </Button>
          </article>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        Questions about pricing? <a href="/contact" className="font-semibold text-brand-ink hover:underline">Contact us</a> and we will help you find the right plan.
      </p>
    </InfoPage>
  )
}

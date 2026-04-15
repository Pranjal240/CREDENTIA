'use client'

import { Check, Star, Zap, Building2 } from 'lucide-react'
import InfoPageLayout from '@/components/landing/InfoPageLayout'

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for students starting out. All core verification features included.',
    icon: Zap,
    color: 'from-emerald-500 to-teal-400',
    popular: false,
    features: [
      'Resume upload & AI analysis',
      'ATS score & keyword analysis',
      'Police certificate verification',
      'Aadhaar identity verification',
      'Shareable verification link',
      'Basic credential certificate',
      'Email support',
    ],
    cta: 'Get Started Free',
    href: '/register',
  },
  {
    name: 'Pro',
    price: '₹299',
    period: '/month',
    description: 'For professionals who want priority verification and advanced analytics.',
    icon: Star,
    color: 'from-blue-500 to-cyan-400',
    popular: true,
    features: [
      'Everything in Free',
      'Priority AI verification queue',
      'Advanced resume analytics',
      'Multiple resume versions',
      'Custom verification page branding',
      'Detailed credential reports',
      'Priority email & chat support',
      'Verification badge on profile',
    ],
    cta: 'Coming Soon',
    href: '#',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For companies and universities processing bulk verifications at scale.',
    icon: Building2,
    color: 'from-purple-500 to-pink-400',
    popular: false,
    features: [
      'Everything in Pro',
      'Unlimited bulk verifications',
      'API access for integration',
      'Custom verification workflows',
      'Dedicated account manager',
      'SSO & advanced security',
      'SLA guarantees',
      'White-label options',
      'On-premise deployment option',
    ],
    cta: 'Contact Sales',
    href: '/contact',
  },
]

export default function PricingPage() {
  return (
    <InfoPageLayout
      title="Simple Pricing"
      subtitle="Start free, upgrade when you need more. No hidden fees, no surprises."
    >
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`card p-6 sm:p-8 relative ${plan.popular ? 'border-[rgb(var(--accent))]/40 ring-1 ring-[rgb(var(--accent))]/20' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs font-bold">
                Most Popular
              </div>
            )}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
              <plan.icon size={24} className="text-white" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[rgb(var(--text-primary))]">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mt-2 mb-2">
              <span className="font-heading text-3xl font-black text-[rgb(var(--text-primary))]">{plan.price}</span>
              {plan.period && <span className="text-sm text-[rgb(var(--text-muted))]">{plan.period}</span>}
            </div>
            <p className="text-sm text-[rgb(var(--text-secondary))] mb-6">{plan.description}</p>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-[rgb(var(--text-secondary))]">
                  <Check size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <a
              href={plan.href}
              className={`block w-full text-center px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                plan.popular
                  ? 'btn-primary'
                  : 'border border-[rgb(var(--border-default))] text-[rgb(var(--text-primary))] hover:border-[rgb(var(--accent))]/50 hover:bg-[rgb(var(--accent))]/5'
              }`}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>

      {/* FAQ teaser */}
      <div className="mt-16 text-center">
        <p className="text-[rgb(var(--text-muted))] text-sm">
          Questions about pricing? <a href="/contact" className="text-[rgb(var(--accent))] hover:underline">Contact us</a> and we&apos;ll help you find the right plan.
        </p>
      </div>
    </InfoPageLayout>
  )
}

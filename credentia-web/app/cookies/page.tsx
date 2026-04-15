'use client'

import { Cookie, Settings, BarChart3, Shield } from 'lucide-react'
import InfoPageLayout from '@/components/landing/InfoPageLayout'

const cookieTypes = [
  {
    icon: Shield,
    title: 'Essential Cookies',
    description: 'These cookies are necessary for the platform to function properly. They enable core features like authentication, session management, and security.',
    examples: ['Authentication session tokens', 'CSRF protection tokens', 'Theme preference (dark/light mode)'],
    canDisable: false,
    color: 'from-emerald-500 to-teal-400',
  },
  {
    icon: Settings,
    title: 'Functional Cookies',
    description: 'These cookies remember your preferences and settings to provide a personalized experience.',
    examples: ['Language preferences', 'Dashboard layout preferences', 'Recently viewed sections'],
    canDisable: true,
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: BarChart3,
    title: 'Analytics Cookies',
    description: 'These cookies help us understand how visitors interact with our platform so we can improve the user experience.',
    examples: ['Page visit tracking', 'Feature usage analytics', 'Error and performance monitoring'],
    canDisable: true,
    color: 'from-purple-500 to-pink-400',
  },
]

export default function CookiesPage() {
  return (
    <InfoPageLayout
      title="Cookie Policy"
      subtitle="Last updated: April 2026. Learn how we use cookies and similar technologies on our platform."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Introduction */}
        <div className="card p-6 sm:p-8 border-[rgb(var(--accent))]/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-400/20 flex items-center justify-center">
              <Cookie size={20} className="text-amber-400" />
            </div>
            <h2 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))]">What Are Cookies?</h2>
          </div>
          <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
            Cookies are small text files placed on your device when you visit our platform. They help us provide essential features, remember your preferences, and understand how you use our services so we can improve them.
          </p>
        </div>

        {/* Cookie types */}
        {cookieTypes.map((cookie, i) => (
          <div key={i} className="card p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cookie.color} flex items-center justify-center flex-shrink-0`}>
                <cookie.icon size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))]">{cookie.title}</h2>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cookie.canDisable ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {cookie.canDisable ? 'Optional' : 'Required'}
                  </span>
                </div>
                <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed mb-3">{cookie.description}</p>
                <div>
                  <p className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider mb-2">Examples:</p>
                  <ul className="space-y-1">
                    {cookie.examples.map((example, j) => (
                      <li key={j} className="text-sm text-[rgb(var(--text-secondary))] pl-3 border-l-2 border-[rgb(var(--border-default))]">
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Managing cookies */}
        <div className="card p-6 sm:p-8">
          <h2 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))] mb-4">Managing Your Cookie Preferences</h2>
          <div className="space-y-3">
            <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
              Most web browsers allow you to control cookies through their settings. You can typically:
            </p>
            <ul className="space-y-2">
              {[
                'View and delete existing cookies',
                'Block all cookies or only third-party cookies',
                'Set preferences for specific websites',
                'Configure automatic cookie deletion when you close your browser',
              ].map((item, i) => (
                <li key={i} className="text-sm text-[rgb(var(--text-secondary))] pl-4 border-l-2 border-[rgb(var(--border-default))]">
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed mt-3">
              Please note that disabling essential cookies may prevent you from using some features of our platform.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-6 sm:p-8">
          <h2 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))] mb-3">Questions?</h2>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            If you have questions about our Cookie Policy, please contact us at{' '}
            <a href="mailto:contact@credentiaonline.in" className="text-[rgb(var(--accent))] hover:underline">
              contact@credentiaonline.in
            </a>
          </p>
        </div>
      </div>
    </InfoPageLayout>
  )
}

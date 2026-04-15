'use client'

import { Mail, MapPin, MessageCircle } from 'lucide-react'
import InfoPageLayout from '@/components/landing/InfoPageLayout'

const XIcon = () => <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
const LinkedInIcon = () => <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
const InstagramIcon = () => <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>

const socials = [
  {
    name: 'X (Twitter)',
    handle: '@Nihal81788',
    href: 'https://x.com/Nihal81788',
    icon: XIcon,
    description: 'Follow us for the latest updates, feature announcements, and industry insights.',
    color: 'from-gray-600 to-gray-800',
    hoverBg: 'hover:bg-gray-500/10',
  },
  {
    name: 'LinkedIn',
    handle: 'Pranjal Mishra',
    href: 'https://www.linkedin.com/in/pranjal-mishra-3a7256291/',
    icon: LinkedInIcon,
    description: 'Connect with us for professional updates, partnerships, and career opportunities.',
    color: 'from-blue-600 to-blue-800',
    hoverBg: 'hover:bg-blue-500/10',
  },
  {
    name: 'Instagram',
    handle: '@pranjal.__.mishra',
    href: 'https://www.instagram.com/pranjal.__.mishra/',
    icon: InstagramIcon,
    description: 'Behind-the-scenes content, team culture, and visual updates from the Credentia journey.',
    color: 'from-pink-500 to-purple-600',
    hoverBg: 'hover:bg-pink-500/10',
  },
]

export default function ContactPage() {
  return (
    <InfoPageLayout
      title="Get in Touch"
      subtitle="Have questions, partnership inquiries, or just want to say hello? We'd love to hear from you."
    >
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Contact info */}
        <div className="space-y-6">
          {/* Email */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center">
                <Mail size={20} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-[rgb(var(--text-primary))]">Email Us</h3>
                <p className="text-xs text-[rgb(var(--text-muted))]">We usually respond within 24 hours</p>
              </div>
            </div>
            <a href="mailto:contact@credentiaonline.in" className="text-[rgb(var(--accent))] hover:underline text-sm font-medium">
              contact@credentiaonline.in
            </a>
          </div>

          {/* Location */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-400/20 flex items-center justify-center">
                <MapPin size={20} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-[rgb(var(--text-primary))]">Location</h3>
                <p className="text-xs text-[rgb(var(--text-muted))]">Based in India, serving globally</p>
              </div>
            </div>
            <p className="text-sm text-[rgb(var(--text-secondary))]">India 🇮🇳</p>
          </div>

          {/* Support */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-400/20 flex items-center justify-center">
                <MessageCircle size={20} className="text-purple-400" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-[rgb(var(--text-primary))]">Live Support</h3>
                <p className="text-xs text-[rgb(var(--text-muted))]">Available on the dashboard</p>
              </div>
            </div>
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              Logged-in users can access live chat support directly from their dashboard.
            </p>
          </div>
        </div>

        {/* Right: Social cards */}
        <div className="space-y-6">
          <h2 className="font-heading text-xl font-bold text-[rgb(var(--text-primary))]">Connect With Us</h2>
          {socials.map((social, i) => (
            <a
              key={i}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className={`card p-6 flex items-start gap-4 group hover:border-[rgb(var(--accent))]/30 ${social.hoverBg} transition-all block`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${social.color} flex items-center justify-center flex-shrink-0 text-white group-hover:scale-110 transition-transform duration-300`}>
                <social.icon />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))]">{social.name}</h3>
                <p className="text-sm text-[rgb(var(--accent))] font-medium mb-1">{social.handle}</p>
                <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">{social.description}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 text-center">
        <div className="card p-8 sm:p-12 max-w-2xl mx-auto border-[rgb(var(--accent))]/20">
          <h2 className="font-heading text-xl font-bold text-[rgb(var(--text-primary))] mb-3">Ready to get started?</h2>
          <p className="text-[rgb(var(--text-secondary))] mb-6 text-sm">
            Join thousands of students and companies already using Credentia.
          </p>
          <a href="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm">
            Start Verifying Free →
          </a>
        </div>
      </div>
    </InfoPageLayout>
  )
}

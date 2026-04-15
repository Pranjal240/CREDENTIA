'use client'

import Link from 'next/link'
import Image from 'next/image'

const XIcon = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
const LinkedInIcon = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
const InstagramIcon = () => <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>

const links = {
  Product: [
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'For Companies', href: '/for-companies' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Data Security', href: '/data-security' },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-[rgb(var(--border-default))]/50 pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-[rgb(var(--accent))]/20">
                <Image src="/logo.png" alt="CREDENTIA" fill className="object-contain p-0.5" />
              </div>
              <span className="font-heading text-lg font-extrabold text-[rgb(var(--text-primary))]">CREDENTIA</span>
            </Link>
            <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed mb-4 max-w-xs">
              India&apos;s most trusted AI-powered credential verification platform. Verify once. Trusted forever.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: XIcon, href: 'https://x.com/Nihal81788', label: 'X' },
                { icon: LinkedInIcon, href: 'https://www.linkedin.com/in/pranjal-mishra-3a7256291/', label: 'LinkedIn' },
                { icon: InstagramIcon, href: 'https://www.instagram.com/pranjal.__.mishra/', label: 'Instagram' },
              ].map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center text-[rgb(var(--text-muted))] hover:text-[rgb(var(--accent))] hover:bg-[rgb(var(--accent))]/5 transition-all" aria-label={social.label}>
                  <social.icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-heading text-sm font-bold text-[rgb(var(--text-primary))] mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[rgb(var(--border-default))]/30 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[rgb(var(--text-muted))] text-xs">
            © {new Date().getFullYear()} CREDENTIA. All rights reserved.
          </p>
          <p className="text-[rgb(var(--text-muted))] text-xs">
            Made in India 🇮🇳 with ❤️
          </p>
        </div>
      </div>
    </footer>
  )
}

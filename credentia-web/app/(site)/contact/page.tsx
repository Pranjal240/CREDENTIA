import type { Metadata } from 'next'
import { Mail, MapPin, MessageCircle } from 'lucide-react'
import { InstagramLogo, LinkedinLogo, XLogo } from '@phosphor-icons/react/dist/ssr'
import { InfoCard, InfoPage } from '@/components/site/info-kit'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { CONTACT_EMAIL, SOCIALS } from '@/lib/site-config'

export const metadata: Metadata = { title: 'Contact', description: 'Questions, partnerships, or a hello. We read everything.' }

const SOCIAL_LIST = [
  { ...SOCIALS.x, icon: XLogo, text: 'Product updates and announcements.' },
  { ...SOCIALS.linkedin, icon: LinkedinLogo, text: 'Partnerships and professional updates.' },
  { ...SOCIALS.instagram, icon: InstagramLogo, text: 'Behind the scenes and team moments.' },
]

export default function ContactPage() {
  return (
    <InfoPage eyebrow="Contact" title="Get in touch" subtitle="Questions, partnership ideas, or just hello. Write to us and a person will answer.">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <InfoCard icon={<Mail />} title="Email us">
            <div className="flex items-center justify-between gap-3">
              <a href={`mailto:${CONTACT_EMAIL}`} className="break-all font-semibold text-brand-ink hover:underline">
                {CONTACT_EMAIL}
              </a>
              <CopyButton value={CONTACT_EMAIL} />
            </div>
          </InfoCard>
          <InfoCard icon={<MapPin />} title="Location">
            Based in India.
          </InfoCard>
          <InfoCard icon={<MessageCircle />} title="Support inside the app">
            Signed in users can ask Peon, our assistant, and reach the support team from their dashboard.
          </InfoCard>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-extrabold">Find us online</h2>
          {SOCIAL_LIST.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-flat group flex items-start gap-4 rounded-2xl p-5 state-transition hover:border-brand/50 hover:bg-white/[0.07]"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-foreground">
                <social.icon className="size-6" weight="fill" />
              </span>
              <span>
                <span className="block text-base font-bold">{social.label}</span>
                <span className="block text-sm font-semibold text-brand-ink">{social.handle}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{social.text}</span>
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="glass-strong mx-auto mt-16 max-w-2xl rounded-3xl p-8 text-center sm:p-12">
        <h2 className="text-xl font-extrabold">Ready to get started?</h2>
        <p className="mt-3 text-sm text-muted-foreground">Create a free profile and verify your first document.</p>
        <div className="mt-6 flex justify-center">
          <Button href="/register" variant="primary">
            Create free profile
          </Button>
        </div>
      </div>
    </InfoPage>
  )
}

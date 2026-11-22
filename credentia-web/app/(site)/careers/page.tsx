import type { Metadata } from 'next'
import { Briefcase, Code, Heart, MapPin, Palette, Rocket } from 'lucide-react'
import { CardGrid, InfoCard, InfoPage, SectionHeading } from '@/components/site/info-kit'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Careers', description: 'Help build credential verification for India.' }

const perks = [
  { icon: Rocket, title: 'Build what matters', text: 'Work on AI products that help students and companies across India.' },
  { icon: Code, title: 'A modern stack', text: 'Next.js, React, TypeScript, Supabase and Google Gemini. The right tool for each job.' },
  { icon: Heart, title: 'Remote first', text: 'Work from anywhere in India. Good work happens when you are comfortable.' },
  { icon: Palette, title: 'Room to try things', text: 'Bring ideas, experiment, and ship with confidence.' },
]

const openings = [
  { role: 'Full Stack Developer', type: 'Full-time, remote', text: 'Build and scale our Next.js and Supabase platform. Experience with React, TypeScript and APIs required.' },
  { role: 'AI and ML Engineer', type: 'Full-time, remote', text: 'Work on Gemini integration for document analysis, NLP and fraud detection.' },
  { role: 'UI and UX Designer', type: 'Part-time, remote', text: 'Design accessible interfaces for our multi-portal platform. Figma experience preferred.' },
]

export default function CareersPage() {
  return (
    <InfoPage eyebrow="Careers" title="Join the team" subtitle="Help us build credential verification for India. We are always glad to hear from thoughtful people.">
      <CardGrid cols={2}>
        {perks.map((perk) => (
          <InfoCard key={perk.title} icon={<perk.icon />} title={perk.title}>
            {perk.text}
          </InfoCard>
        ))}
      </CardGrid>

      <div className="mt-16">
        <SectionHeading title="Current openings" />
        <ul className="mx-auto max-w-3xl space-y-3">
          {openings.map((job) => (
            <li key={job.role} className="glass-flat flex flex-col justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h3 className="flex items-center gap-2 font-bold">
                  <Briefcase className="size-4 text-brand-ink" aria-hidden="true" />
                  {job.role}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3" aria-hidden="true" />
                  {job.type}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{job.text}</p>
              </div>
              <Button href="/contact" variant="primary" size="sm" className="shrink-0">
                Apply
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-strong mx-auto mt-14 max-w-2xl rounded-3xl p-8 text-center sm:p-12">
        <h2 className="text-xl font-extrabold">Do not see your role?</h2>
        <p className="mt-3 text-sm text-muted-foreground">Send us your resume and tell us how you would like to contribute.</p>
        <div className="mt-6 flex justify-center">
          <Button href="/contact" variant="default">
            Get in touch
          </Button>
        </div>
      </div>
    </InfoPage>
  )
}

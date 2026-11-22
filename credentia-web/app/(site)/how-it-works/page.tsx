import type { Metadata } from 'next'
import { Building2, CheckCircle2, FileSearch, Share2, Upload, UserCheck } from 'lucide-react'
import { CardGrid, InfoCard, InfoPage, SectionHeading } from '@/components/site/info-kit'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'How it works', description: 'From upload to a trusted profile link, step by step.' }

const STEPS = [
  {
    icon: Upload,
    title: 'Upload your documents',
    text: 'Add your resume, police certificate, Aadhaar card and degree certificate as a PDF or an image. Drag and drop, or browse your device.',
  },
  {
    icon: FileSearch,
    title: 'AI reads each one',
    text: 'AI extracts the fields on each document and gives every result a confidence score. You see what was found as soon as it finishes.',
  },
  {
    icon: UserCheck,
    title: 'A person checks the unsure ones',
    text: 'When the AI is not sure, the document is marked Needs review and an admin decides. Every status is visible to you, and every admin decision is recorded.',
  },
  {
    icon: Share2,
    title: 'Share one link',
    text: 'You get a public profile link and a QR code. Share it with any employer instead of uploading the same files again and again.',
  },
]

export default function HowItWorksPage() {
  return (
    <InfoPage eyebrow="How it works" title="From upload to a trusted link" subtitle="Four steps for students. Three for the people who check them.">
      <ol className="grid gap-4 md:grid-cols-2">
        {STEPS.map((step, i) => (
          <li key={step.title} className="glass-flat rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand-ink">
                <step.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="font-mono text-sm font-semibold text-brand-ink">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <h2 className="mt-4 text-lg font-bold">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
          </li>
        ))}
      </ol>

      <div className="mt-20">
        <SectionHeading eyebrow="For companies" title="Checking a candidate" subtitle="No more waiting on documents by email." />
        <CardGrid cols={3}>
          <InfoCard icon={<Building2 />} title="Register your company">
            Create a company account and set up your organization profile.
          </InfoCard>
          <InfoCard icon={<Share2 />} title="Receive profile links">
            Candidates share their Credentia link, or you find public profiles in talent search.
          </InfoCard>
          <InfoCard icon={<CheckCircle2 />} title="See the verified record">
            Open a profile to see each document, its status, the confidence score and the AI analysis.
          </InfoCard>
        </CardGrid>
      </div>

      <div className="mt-14 flex flex-wrap justify-center gap-3">
        <Button href="/register" variant="primary">
          Create free profile
        </Button>
        <Button href="/features" variant="default">
          See every feature
        </Button>
      </div>
    </InfoPage>
  )
}

'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useInView } from 'framer-motion'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import {
  AadhaarIcon,
  CompanyIcon,
  DegreeIcon,
  PoliceIcon,
  ResumeIcon,
  ReviewIcon,
  ScanIcon,
  ShareIcon,
  StudentIcon,
  UniversityIcon,
  UploadIcon,
} from '@/components/brand/icons'
import { SwipeHeading } from '@/components/site/swipe'
import { Counter } from '@/components/dash/kit'
import { Button } from '@/components/ui/button'
import ExpandableBentoGrid, { type BentoItem } from '@/components/ui/expandable-bento-grid'
import { usePublicStats } from '@/hooks/use-public-stats'
import { cn } from '@/lib/utils'

/** Index for staggering neighbours as they swipe up. */
const idx = (i: number) => ({ '--i': i }) as React.CSSProperties

const SECTION = 'page-x pt-[clamp(64px,9vw,140px)]'

/** A section opener: a small number and label, a large heading, and a short note on the right. */
function SectionHead({ n, label, title, children }: { n: string; label: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,6.2fr)_minmax(0,3.6fr)] lg:items-end">
      <p data-swipe className="eyebrow flex items-baseline gap-3 !text-muted-foreground lg:self-start lg:pt-3">
        <span className="tabular font-mono text-brand-ink">{n}</span>
        <span>{label}</span>
      </p>
      <SwipeHeading
        text={title}
        className="text-balance text-[clamp(1.9rem,4.3vw,4.2rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-foreground"
      />
      {children ? (
        <div data-swipe style={idx(2)} className="text-base leading-relaxed text-muted-foreground lg:pb-2">
          {children}
        </div>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* The four documents                                                         */
/* -------------------------------------------------------------------------- */

const DOCS = [
  { n: '01', name: 'Resume', icon: ResumeIcon, reads: 'ATS score, skills, gaps and contact details', result: 'An ATS score from 0 to 100', href: '/features#resume', offset: 'lg:mt-0' },
  { n: '02', name: 'Police certificate', icon: PoliceIcon, reads: 'Certificate number, authority, issue date, district and state', result: 'Verified, Needs review or Invalid', href: '/features#police', offset: 'lg:mt-12' },
  { n: '03', name: 'Aadhaar', icon: AadhaarIcon, reads: 'Name, date of birth, gender and state', result: 'Only the last four digits are kept', href: '/features#aadhaar', offset: 'lg:mt-4' },
  { n: '04', name: 'Degree certificate', icon: DegreeIcon, reads: 'University, degree, course, year, CGPA and roll number', result: 'Shown only on profiles you made public', href: '/features#degree', offset: 'lg:mt-16' },
]

export function DocumentsSection() {
  return (
    <section id="documents" className={cn(SECTION, 'scroll-mt-10')}>
      <SectionHead n="01" label="Documents" title="Four documents. One trust score.">
        Four core documents make your trust score. Marksheets and any other credential sit beside them.
      </SectionHead>

      <ul className="mt-[clamp(32px,5vw,72px)] grid grid-cols-2 gap-[var(--gap)] lg:grid-cols-4">
        {DOCS.map((doc, i) => (
          <li key={doc.n} data-swipe="mask" style={idx(i % 2)} className={cn('min-w-0', i % 2 === 1 && 'mt-8', doc.offset)}>
            <Link
              href={doc.href}
              className="group relative flex min-h-[21rem] flex-col justify-between overflow-hidden rounded-[22px] border border-white/12 bg-white/[0.045] p-4 transition-colors duration-300 hover:border-brand/60 hover:bg-white/[0.08] focus-visible:border-brand focus-visible:outline-none sm:p-6 lg:aspect-[3/4] lg:min-h-0"
            >
              <span className="flex items-start justify-between">
                <span className="tabular font-mono text-xs font-semibold text-muted-foreground">{doc.n}</span>
                <ArrowUpRight className="size-4 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-ink" aria-hidden="true" />
              </span>

              <span className="grid place-items-center py-4">
                <doc.icon className="w-[44%] min-w-[64px] text-foreground transition-transform duration-500 ease-out group-hover:-rotate-3 group-hover:scale-110" />
              </span>

              <span className="block">
                <span className="block text-lg font-extrabold leading-tight tracking-tight text-foreground sm:text-2xl">{doc.name}</span>
                <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground sm:text-sm">{doc.reads}</span>
                <span className="mt-3 block border-t border-white/12 pt-3 text-xs font-semibold text-brand-ink">{doc.result}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div data-swipe className="mt-[clamp(32px,4vw,64px)] grid gap-8 border-y border-white/12 py-8 lg:grid-cols-2 lg:gap-16 lg:py-10">
        <div className="flex items-start gap-5">
          <UploadIcon className="size-12 shrink-0 text-foreground sm:size-14" aria-hidden="true" />
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Any other credential too</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              10th and 12th marksheets are read by AI. Any other credential or certificate is stored in your account for an admin to look at.
            </p>
          </div>
        </div>
        <ul className="space-y-3.5 self-center text-sm text-foreground/85 sm:text-base">
          {['One saved file for each document. Upload again to replace it.', 'Open your saved files any time from your dashboard.', 'Companies see only what you choose to make public.'].map((text) => (
            <li key={text} className="flex gap-3">
              <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden="true" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Resume tools                                                               */
/* -------------------------------------------------------------------------- */

const TOOLS = [
  { icon: UploadIcon, title: 'Upload and save', text: 'Keep your important documents in one place. Each one has one saved file, and you can open it any time.' },
  { icon: ScanIcon, title: 'A free, real ATS check', text: 'Your resume gets an ATS score, your top skills, the keywords it has and the ones it lacks, and what to improve.' },
  { icon: ReviewIcon, title: 'Check it against a job', text: 'Paste a job description. See how well your resume matches it, which keywords are missing and exactly what to add.' },
  { icon: ResumeIcon, title: 'LaTeX for Jake\'s resume', text: 'Only when you ask for it. Get your resume as LaTeX in Jake\'s style, with a step by step guide to finish it on Overleaf.' },
]

export function ResumeToolsSection() {
  return (
    <section id="resume-tools" className={cn(SECTION, 'scroll-mt-10')}>
      <SectionHead n="02" label="Resume tools" title="A free ATS check, built in">
        Upload your resume once. Check it for any job, and get a clean version you can send.
      </SectionHead>

      <ul className="mt-[clamp(32px,5vw,72px)] grid gap-[var(--gap)] sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map((tool, i) => (
          <li key={tool.title} data-swipe style={idx(i % 4)} className="relative min-w-0 overflow-hidden rounded-[22px] border border-white/12 bg-white/[0.04] p-6 transition-colors duration-300 hover:border-brand/50 hover:bg-white/[0.07] sm:p-7">
            <span aria-hidden="true" className="pointer-events-none absolute right-4 top-2 text-[clamp(3.5rem,6vw,5.5rem)] font-extrabold leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.12)]">
              {String(i + 1).padStart(2, '0')}
            </span>
            <tool.icon className="relative size-11 text-foreground" aria-hidden="true" />
            <h3 className="relative mt-8 text-xl font-extrabold leading-tight tracking-tight text-foreground">{tool.title}</h3>
            <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{tool.text}</p>
          </li>
        ))}
      </ul>

      <div data-swipe className="mt-10 flex flex-wrap gap-3">
        <Button href="/register" variant="primary">
          Try it free
          <ArrowRight className="size-4" />
        </Button>
        <Button href="/features#resume" variant="default">
          See how the resume check works
        </Button>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Live panels                                                                */
/* -------------------------------------------------------------------------- */

const LIVE = [
  { who: 'Admin panel', icon: ReviewIcon, lines: ['How long the oldest document has waited', 'Approvals and support messages that need you', 'A warning when too few documents are verified'] },
  { who: 'Company panel', icon: CompanyIcon, lines: ['New public profiles this week', 'Strong, fully verified students you have not saved', 'Which candidates still lack verified documents'] },
  { who: 'University panel', icon: UniversityIcon, lines: ['Students who joined this week', 'Students who have not verified one document', 'Students with no CGPA on record'] },
]

export function LivePanelsSection() {
  return (
    <section className={SECTION}>
      <SectionHead n="03" label="Live panels" title="Every panel tells you what to do next">
        Admins, companies and universities each get a live briefing. It updates by itself the moment something changes.
      </SectionHead>

      <ul className="mt-[clamp(32px,5vw,72px)] grid gap-[var(--gap)] lg:grid-cols-3">
        {LIVE.map((panel, i) => (
          <li key={panel.who} data-swipe style={idx(i)} className="min-w-0 rounded-[22px] border border-white/12 bg-white/[0.04] p-6 sm:p-8">
            <panel.icon className="size-11 text-foreground" aria-hidden="true" />
            <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground">{panel.who}</h3>
            <ul className="mt-5 space-y-3 border-t border-white/12 pt-5">
              {panel.lines.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-foreground/85">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* How it works                                                               */
/* -------------------------------------------------------------------------- */

const STEPS = [
  { icon: UploadIcon, title: 'Upload', text: 'Add a resume, police certificate, Aadhaar and degree as a PDF or an image.' },
  { icon: ScanIcon, title: 'AI reads', text: 'Models read each document and pull out its fields, with a confidence score for every result.' },
  { icon: ReviewIcon, title: 'Review', text: 'Anything the AI is unsure about goes to an admin for a decision. You always see the status.' },
  { icon: ShareIcon, title: 'Share', text: 'Get a public link and QR code. Companies only see the profiles that students make public.' },
]

export function HowItWorksSection() {
  return (
    <section className={SECTION}>
      <SectionHead n="04" label="How it works" title="From upload to a trusted link">
        Four steps. You stay in control of what is shared at every one of them.
      </SectionHead>

      <ol className="mt-[clamp(32px,5vw,72px)] border-b border-white/12">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            data-swipe
            style={idx(0)}
            className="group grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-5 gap-y-3 border-t border-white/12 py-7 transition-colors duration-300 hover:bg-white/[0.03] sm:gap-x-8 sm:py-9 lg:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-x-12"
          >
            <span
              aria-hidden="true"
              className="text-[clamp(3rem,7vw,6.5rem)] font-extrabold leading-[0.85] tracking-[-0.04em] text-transparent transition-colors duration-300 [-webkit-text-stroke:1px_rgba(255,255,255,0.35)] group-hover:text-brand group-hover:[-webkit-text-stroke:1px_transparent] lg:row-span-1"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-4">
              <step.icon className="size-9 shrink-0 text-foreground sm:size-11" aria-hidden="true" />
              <h3 className="text-[clamp(1.5rem,3vw,2.5rem)] font-extrabold leading-none tracking-tight text-foreground">{step.title}</h3>
            </div>
            <p className="col-span-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:col-span-1">{step.text}</p>
          </li>
        ))}
      </ol>

      <div data-swipe className="mt-10 flex">
        <Button href="/how-it-works" variant="default">
          Read the full guide
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Portals                                                                    */
/* -------------------------------------------------------------------------- */

const checks = (items: string[]) => (
  <ul className="space-y-2.5">
    {items.map((item) => (
      <li key={item} className="flex gap-2.5">
        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
)

const peek = (items: string[]) => (
  <span className="mt-5 hidden border-t border-white/12 pt-4 lg:block">
    {items.map((item) => (
      <span key={item} className="flex gap-2.5 py-1 text-xs leading-relaxed text-foreground/75">
        <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
        <span>{item}</span>
      </span>
    ))}
  </span>
)

/** Three equal cards. Every line describes something the platform really does. */
const PORTALS: BentoItem[] = [
  {
    id: 'student',
    title: 'Student portal',
    subtitle: 'Upload once. Share one verified link.',
    description: 'For students and job seekers',
    icon: <StudentIcon className="size-6" />,
    className: 'lg:col-span-4',
    href: '/login/student',
    ctaLabel: 'Open the student portal',
    preview: peek(['Upload your documents and see every result', 'Share a public link and QR code you control', 'Apply to companies from your dashboard']),
    content: checks([
      'Upload a resume, police certificate, Aadhaar and degree.',
      'Add marksheets and any other credential beside them.',
      'See every result with its status and what the AI found.',
      'Share a public profile link and QR code that you control.',
      'Apply to companies straight from your dashboard.',
    ]),
  },
  {
    id: 'company',
    title: 'Company portal',
    subtitle: 'Search verified talent.',
    description: 'For hiring teams',
    icon: <CompanyIcon className="size-6" />,
    className: 'lg:col-span-4',
    href: '/for-companies',
    ctaLabel: 'See the company portal',
    preview: peek(['Filter by ATS score, CGPA, course and year', 'Paste a job description and let AI rank candidates', 'Save candidates and review applicants']),
    content: checks([
      'Filter by ATS score, verified documents, CGPA, course and year.',
      'Paste a job description and let AI rank candidates.',
      'Save candidates and review applicants in one place.',
      'You only see profiles that students chose to make public.',
    ]),
  },
  {
    id: 'university',
    title: 'University portal',
    subtitle: 'Know where your students stand.',
    description: 'For institutions',
    icon: <UniversityIcon className="size-6" />,
    className: 'lg:col-span-4',
    href: '/login/university',
    ctaLabel: 'Open the university portal',
    preview: peek(['See which documents each student has verified', 'Keep student CGPA records up to date', 'Track completion across your institution']),
    content: checks([
      'See every linked student and which documents are verified.',
      'Keep student CGPA records up to date.',
      'Track verification completion across your institution.',
      'Institutions join after an admin approves them.',
    ]),
  },
]

export function PortalsSection() {
  return (
    <section className="pt-[clamp(64px,9vw,140px)]">
      <div className="page-x pb-[clamp(40px,6vw,88px)]">
        <SectionHead n="05" label="Portals" title="One platform, three portals">
          Students, hiring teams and institutions each get a portal built for what they do.
        </SectionHead>
      </div>
      <ExpandableBentoGrid
        items={PORTALS}
        caption={
          <>
            <span>Three portals</span>
            <span>Press a card to see what it does</span>
          </>
        }
      />
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Real numbers                                                               */
/* -------------------------------------------------------------------------- */

export function LiveNumbersSection() {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const stats = usePublicStats()
  // The numbers could not be read, so the section is left out rather than showing zeros.
  if (stats === null) return null

  const items = [
    { label: 'Students on Credentia', value: stats?.students ?? 0 },
    { label: 'Documents analysed', value: stats?.documentsAnalyzed ?? 0 },
    { label: 'Documents verified', value: stats?.documentsVerified ?? 0 },
    { label: 'Companies', value: stats?.companies ?? 0 },
    { label: 'Approved institutions', value: stats?.universities ?? 0 },
  ]

  return (
    <section className={SECTION}>
      <SectionHead n="06" label="The platform today" title="Real counts, live from the database">
        Counted from the Credentia database each time the page loads.
      </SectionHead>
      <div ref={ref}>
        <dl className="mt-[clamp(32px,5vw,72px)] border-b border-white/12">
          {items.map((item) => (
            <div
              key={item.label}
              data-swipe
              className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-t border-white/12 py-5 transition-colors duration-300 hover:bg-white/[0.03] sm:py-7"
            >
              <dt className="text-base font-bold text-foreground/85 transition-colors group-hover:text-foreground sm:text-xl lg:text-2xl">{item.label}</dt>
              <dd className="tabular text-[clamp(2.2rem,6vw,5.5rem)] font-extrabold leading-none tracking-[-0.04em] text-foreground">
                {stats ? <Counter value={inView ? item.value : 0} duration={1.4} /> : <span className="skeleton block h-[1em] w-24" aria-hidden="true" />}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Trust and privacy                                                          */
/* -------------------------------------------------------------------------- */

const TRUST = [
  { icon: AadhaarIcon, title: 'Aadhaar is handled with care', text: 'Only the last four digits of an Aadhaar number are saved as data, and the rest of the number is never kept in your profile. The file you upload is stored in Cloudflare R2.' },
  { icon: ReviewIcon, title: 'Uncertain results get a human', text: 'Every result carries a confidence score. When the AI is not sure, the document goes to an admin for a decision instead of being quietly accepted.' },
  { icon: ShareIcon, title: 'You choose who sees your profile', text: 'Companies only find students who made their profile public. You can change that whenever you like.' },
  { icon: ResumeIcon, title: 'Admin actions are recorded', text: 'Every override and status change made by an admin is written to an audit log, so decisions can be traced.' },
]

export function TrustSection() {
  return (
    <section className={SECTION}>
      <SectionHead n="07" label="Trust and privacy" title="Built so people can check the work">
        Plain statements about how Credentia treats documents and decisions.
      </SectionHead>

      <ul className="mt-[clamp(32px,5vw,72px)] grid gap-[var(--gap)] md:grid-cols-2">
        {TRUST.map((item, i) => (
          <li key={item.title} data-swipe style={idx(i % 2)} className="relative min-w-0 overflow-hidden rounded-[22px] border border-white/12 bg-white/[0.04] p-6 sm:p-8">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-5 top-3 text-[clamp(4rem,9vw,8rem)] font-extrabold leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.12)]"
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <item.icon className="relative size-11 text-foreground" aria-hidden="true" />
            <h3 className="relative mt-10 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{item.title}</h3>
            <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{item.text}</p>
          </li>
        ))}
      </ul>

      <div data-swipe className="mt-12 flex">
        <Button href="/data-security" variant="default">
          Read about data security
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Team                                                                       */
/* -------------------------------------------------------------------------- */

const FOUNDERS = [
  { name: 'Pranjal Mishra', role: 'Founder, CEO and Senior Developer', img: '/team/pranjal.png', position: 'object-top', bio: 'Building the trust layer for credentials in India, so hiring fraud gets harder and honest students get easier to believe.', offset: 'lg:mt-0' },
  { name: 'Kriti Ahlawat', role: 'Co-founder, Product', img: '/team/kriti.png', position: 'object-center', bio: 'Shapes the product and the partnerships across education and hiring, with a focus on verification that feels simple.', offset: 'lg:mt-14' },
  { name: 'Pragya Mishra', role: 'Co-founder, Design', img: '/team/pragya-mishra.png', position: 'object-[30%_0%]', bio: 'Designs and builds the interfaces people use every day, from the first upload to the shared profile.', offset: 'lg:mt-6' },
  { name: 'Sourav', role: 'Co-founder, Engineering', img: '/team/sourav.png', position: 'object-top', bio: 'Builds the backend and integrations that keep verification fast and dependable.', offset: 'lg:mt-12' },
]

export function TeamSection() {
  return (
    <section className={cn(SECTION, 'pb-[clamp(72px,10vw,150px)]')}>
      <SectionHead n="08" label="The team" title="The people behind Credentia">
        A small team building the trust layer for credentials in India.
      </SectionHead>

      <ul className="mt-[clamp(32px,5vw,72px)] grid grid-cols-2 gap-x-[var(--gap)] gap-y-10 lg:grid-cols-4">
        {FOUNDERS.map((person, i) => (
          <li key={person.name} className={cn('min-w-0', i % 2 === 1 && 'mt-8', person.offset)}>
            <figure data-swipe="mask" style={idx(i % 2)} className="relative aspect-[4/5] w-full overflow-hidden rounded-[22px] border border-white/12 bg-white/[0.045]">
              <Image src={person.img} alt={person.name} fill sizes="(min-width:1024px) 22vw, 45vw" className={`object-cover ${person.position}`} />
            </figure>
            <div data-swipe style={idx(2)}>
              <h3 className="mt-4 text-lg font-extrabold tracking-tight text-foreground">{person.name}</h3>
              <p className="mt-0.5 text-xs font-semibold text-brand-ink">{person.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{person.bio}</p>
            </div>
          </li>
        ))}
      </ul>

      <div data-swipe className="mt-12 flex">
        <Button href="/team" variant="default">
          Meet everyone
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  )
}

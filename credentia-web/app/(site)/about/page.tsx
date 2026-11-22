import type { Metadata } from 'next'
import { Eye, Heart, Scale, Target, Users } from 'lucide-react'
import { CardGrid, InfoCard, InfoPage, SectionHeading } from '@/components/site/info-kit'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'About', description: 'Why Credentia exists and what it stands for.' }

export default function AboutPage() {
  return (
    <InfoPage eyebrow="About" title="Making credentials easy to trust" subtitle="Credentia helps students prove who they are and what they have done, and helps others check it without delay.">
      <CardGrid cols={2}>
        <InfoCard icon={<Target />} title="Our mission">
          To make credential verification free and fast for students, and simple for the companies and universities that rely on it, so fraud has fewer places to hide and honest people are easier to believe.
        </InfoCard>
        <InfoCard icon={<Eye />} title="Our vision">
          A job market where every claim on a profile can be checked quickly, and where students do not have to upload the same documents for every application.
        </InfoCard>
      </CardGrid>

      <section className="glass-flat mt-6 rounded-3xl p-6 sm:p-10">
        <h2 className="text-2xl font-extrabold tracking-tight">Our story</h2>
        <div className="mt-4 space-y-4 text-sm leading-7 text-foreground/75">
          <p>
            Credentia began with a simple frustration: checking a candidate&apos;s documents takes far longer than it should. Students upload the same files again and again, and companies wait for answers they could read in minutes.
          </p>
          <p>
            So we built one place for it. AI reads a resume, a police certificate, an Aadhaar card and a degree. An admin reviews anything uncertain. The student gets one profile and one link to share, and companies and universities get a record they can open and check.
          </p>
          <p>It is free for students, and we are building the company and university portals alongside it.</p>
        </div>
      </section>

      <div className="mt-16">
        <SectionHeading title="What we care about" />
        <CardGrid cols={3}>
          <InfoCard icon={<Scale />} title="Honest results">
            We show confidence scores and send uncertain cases to a person. We would rather say we are not sure than guess.
          </InfoCard>
          <InfoCard icon={<Heart />} title="Students first">
            Verification is free for students, and they decide who can see their profile.
          </InfoCard>
          <InfoCard icon={<Users />} title="Privacy by default">
            We keep only what we need. For the Aadhaar number, that is the last four digits.
          </InfoCard>
        </CardGrid>
      </div>

      <div className="mt-14 flex flex-wrap justify-center gap-3">
        <Button href="/team" variant="default">
          Meet the team
        </Button>
        <Button href="/register" variant="primary">
          Create free profile
        </Button>
      </div>
    </InfoPage>
  )
}

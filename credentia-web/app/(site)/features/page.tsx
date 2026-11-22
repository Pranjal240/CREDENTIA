import type { Metadata } from 'next'
import { BarChart3, Brain, FileText, Fingerprint, GraduationCap, Link2, ShieldCheck } from 'lucide-react'
import { CardGrid, InfoCard, InfoPage } from '@/components/site/info-kit'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Features', description: 'What Credentia reads, checks and shares, document by document.' }

const list = (items: string[]) => (
  <ul className="mt-3 space-y-1.5">
    {items.map((item) => (
      <li key={item} className="flex gap-2">
        <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-brand-ink" />
        {item}
      </li>
    ))}
  </ul>
)

export default function FeaturesPage() {
  return (
    <InfoPage
      eyebrow="Features"
      title="What Credentia does for every document"
      subtitle="Four documents, one profile. Here is what is read, what is saved, and what you can share."
    >
      <CardGrid cols={2}>
        <InfoCard id="resume" icon={<FileText />} title="Resume analysis">
          Upload a PDF or an image. AI returns:
          {list([
            'An ATS score from 0 to 100 and an authenticity score',
            'Your top skills, with keywords found and missing',
            'Strengths and suggested improvements',
            'Name, contact, course, branch, graduation year, experience and a short summary',
            'A job specific check: paste a job description to see your match, the missing keywords and exactly what to add',
            'Your resume as LaTeX in the popular Jake resume style, built only when you ask, with a guide to finish it on Overleaf',
          ])}
          The ATS check is free for every student.
        </InfoCard>

        <InfoCard id="police" icon={<ShieldCheck />} title="Police certificate">
          Upload a police clearance certificate. AI reads:
          {list([
            'Certificate number, issue date and issuing authority',
            'District, state and applicant name',
            'Whether it looks like a valid police certificate, with a confidence score',
            'A result of Verified, Needs review or Invalid',
          ])}
        </InfoCard>

        <InfoCard id="aadhaar" icon={<Fingerprint />} title="Aadhaar check">
          Upload an Aadhaar card image. AI reads:
          {list(['Name, date of birth, gender and state', 'The last four digits of the number, the only part of it kept in your profile', 'A verified result with a confidence score'])}
        </InfoCard>

        <InfoCard id="degree" icon={<GraduationCap />} title="Degree verification">
          Upload a degree certificate. AI reads:
          {list(['University, degree type and course', 'Year of passing, CGPA or grade, and roll number', 'A verified result with a confidence score'])}
        </InfoCard>

        <InfoCard id="share-link" icon={<Link2 />} title="Verified share link">
          Generate one public link and a QR code for your profile.
          {list([
            'The link works while your profile is public, and you can switch it off at any time',
            'Anyone with the link can see your verified credentials without signing in',
            'Companies can find you in talent search only while your profile is public',
            'You see how many times your profile was viewed',
          ])}
        </InfoCard>

        <InfoCard id="analytics" icon={<BarChart3 />} title="Live dashboards">
          Dashboards update as statuses change.
          {list([
            'Students see progress, trust score and every result',
            'Universities see verification completion across their students',
            'Companies see their talent pool and applicants',
            'Admins see platform activity and what needs a decision',
          ])}
        </InfoCard>
      </CardGrid>

      <div className="mt-6">
        <InfoCard icon={<Brain />} title="How the AI is used">
          Documents are read by Google Gemini, with Groq models as a backup when a provider is busy. Every result carries a confidence score. When the AI is not sure, the document goes to an admin for a decision instead of being accepted quietly. AI results are assessments to support a decision, not legal certifications.
        </InfoCard>
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Button href="/register" variant="primary">
          Create free profile
        </Button>
        <Button href="/how-it-works" variant="default">
          See how it works
        </Button>
      </div>
    </InfoPage>
  )
}

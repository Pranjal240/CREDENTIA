import type { Metadata } from 'next'
import { BarChart3, Bookmark, Eye, Filter, Sparkles, Users } from 'lucide-react'
import { CardGrid, InfoCard, InfoPage } from '@/components/site/info-kit'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'For companies', description: 'Search verified candidates and review trusted profiles.' }

export default function ForCompaniesPage() {
  return (
    <InfoPage eyebrow="For companies" title="Hire from profiles that were checked" subtitle="Search students who verified their documents, rank them for a role, and review each record in one place.">
      <CardGrid cols={3}>
        <InfoCard icon={<Filter />} title="Talent search">
          Filter by ATS score, verified police certificate, Aadhaar and degree, minimum CGPA, course and graduation year. Sort by ATS, name or trust score.
        </InfoCard>
        <InfoCard icon={<Sparkles />} title="AI job matching">
          Paste a job description and AI ranks candidates by how well their profile fits it.
        </InfoCard>
        <InfoCard icon={<Users />} title="Applicants">
          See who applied to your company, their trust score and how many documents they verified, and update each application status.
        </InfoCard>
        <InfoCard icon={<Bookmark />} title="Saved candidates">
          Bookmark the people you want to come back to and keep them in one list.
        </InfoCard>
        <InfoCard icon={<BarChart3 />} title="Analytics">
          Understand your talent pool with charts built from real verification data.
        </InfoCard>
        <InfoCard icon={<Eye />} title="Only public profiles">
          You only see students who chose to make their profile public. Nothing is shown without their say.
        </InfoCard>
      </CardGrid>

      <div className="mt-14 flex flex-wrap justify-center gap-3">
        <Button href="/register" variant="primary">
          Register your company
        </Button>
        <Button href="/login/company" variant="default">
          Company sign in
        </Button>
      </div>
    </InfoPage>
  )
}

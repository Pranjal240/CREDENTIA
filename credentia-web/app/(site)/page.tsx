import { LandingHero } from '@/components/site/landing/hero'
import { DocumentsSection, HowItWorksSection, LiveNumbersSection, LivePanelsSection, PortalsSection, ResumeToolsSection, TeamSection, TrustSection } from '@/components/site/landing/sections'

// The page is the same for everyone, so it is built once and served from the edge. The live numbers
// load in the browser from /api/public-stats. Signed in visitors see a Dashboard button in the header
// instead of being redirected. The closing call to action lives in the footer.
export default function Home() {
  return (
    <>
      <LandingHero />
      <DocumentsSection />
      <ResumeToolsSection />
      <LivePanelsSection />
      <HowItWorksSection />
      <PortalsSection />
      <LiveNumbersSection />
      <TrustSection />
      <TeamSection />
    </>
  )
}

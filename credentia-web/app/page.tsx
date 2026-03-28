import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Stats from '@/components/landing/Stats'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import Team from '@/components/landing/Team'
import CTABanner from '@/components/landing/CTABanner'
import Footer from '@/components/landing/Footer'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Team />
        <CTABanner />
      </main>
      <Footer />
    </>
  )
}

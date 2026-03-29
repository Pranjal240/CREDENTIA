import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Stats from '@/components/landing/Stats'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import ForCompanies from '@/components/landing/ForCompanies'
import Team from '@/components/landing/Team'
import CTA from '@/components/landing/CTA'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <main className="gradient-bg min-h-screen">
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <ForCompanies />
      <Team />
      <CTA />
      <Footer />
    </main>
  )
}

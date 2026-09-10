import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import ScrollProgress from '@/components/landing/ScrollProgress'
import CustomCursor from '@/components/landing/CustomCursor'
import TrustedInstitutions from '@/components/landing/TrustedInstitutions'
import ThreePortals from '@/components/landing/ThreePortals'
import RealTimeAnalytics from '@/components/landing/RealTimeAnalytics'
import AIVerificationEngine from '@/components/landing/AIVerificationEngine'
import VerificationPipeline from '@/components/landing/VerificationPipeline'
import FullStack from '@/components/landing/FullStack'
import Team from '@/components/landing/Team'
import CTA from '@/components/landing/CTA'
import Footer from '@/components/landing/Footer'

const ROLE_REDIRECT: Record<string, string> = {
  student    : '/dashboard/student',
  university : '/dashboard/university',
  company    : '/dashboard/company',
  admin      : '/dashboard/admin',
}

function LandingContent() {
  return (
    <main className="gradient-bg min-h-screen">
      <ScrollProgress />
      <CustomCursor />
      <Navbar />
      <Hero />
      <TrustedInstitutions />
      <ThreePortals />
      <RealTimeAnalytics />
      <AIVerificationEngine />
      <VerificationPipeline />
      <FullStack />
      <Team />
      <CTA />
      <Footer />
    </main>
  )
}

export default async function Home({
  searchParams
}: {
  searchParams: { error?: string }
}) {
  // CRITICAL: If there is an error param,
  // NEVER auto-redirect. Show landing page.
  if (searchParams.error) return <LandingContent />

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user?.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (profile?.role && ROLE_REDIRECT[profile.role]) {
        redirect(ROLE_REDIRECT[profile.role])
      }
    }
  } catch {
    // show landing
  }

  return <LandingContent />
}

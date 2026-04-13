import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Stats from '@/components/landing/Stats'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import ForCompanies from '@/components/landing/ForCompanies'
import Team from '@/components/landing/Team'
import CTA from '@/components/landing/CTA'
import Footer from '@/components/landing/Footer'

const ROLE_REDIRECT: Record<string, string> = {
  student    : '/dashboard/student',
  university : '/dashboard/university',
  company    : '/dashboard/company',
  admin      : '/dashboard/admin',
}

export default async function Home({
  searchParams
}: {
  searchParams: { error?: string }
}) {
  // CRITICAL: If there is an error param,
  // NEVER auto-redirect. Show landing page.
  // This breaks the session loop.
  if (searchParams.error) {
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
    const { data: { session } } =
      await supabase.auth.getSession()

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

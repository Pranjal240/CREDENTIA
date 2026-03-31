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

export default async function Home() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
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
    // Session check failed — show landing page
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

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import Stats from '@/components/landing/Stats'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import ForCompanies from '@/components/landing/ForCompanies'
import Team from '@/components/landing/Team'
import CTA from '@/components/landing/CTA'
import Footer from '@/components/landing/Footer'

// Lightweight session check — if user is already logged in, silently redirect
// them to their dashboard. This runs client-side so it doesn't break SSG/SSR
// of any of the landing page sections.
//
// The middleware ALSO performs this check server-side on the / route, so this
// acts as a belt-AND-suspenders approach to ensure returning users never see
// the landing page when already authenticated.
function SessionRedirect() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile?.role) {
            router.replace(`/dashboard/${profile.role}`)
          }
        })
    })
  }, [router])

  return null
}

export default function Home() {
  return (
    <main className="gradient-bg min-h-screen">
      {/* Silent session check — redirects to dashboard if already logged in */}
      <SessionRedirect />
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

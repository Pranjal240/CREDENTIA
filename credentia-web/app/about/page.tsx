'use client'

import { Target, Eye, Heart, Users, Rocket, Shield } from 'lucide-react'
import InfoPageLayout from '@/components/landing/InfoPageLayout'
import Link from 'next/link'

const values = [
  {
    icon: Shield,
    title: 'Trust First',
    description: 'Every feature we build starts with a question: does this increase trust? We believe credential verification should be bulletproof and accessible to everyone.',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Rocket,
    title: 'Innovation Driven',
    description: 'We leverage cutting-edge AI from Google Gemini to make verification faster, smarter, and more reliable than any manual process.',
    color: 'from-purple-500 to-pink-400',
  },
  {
    icon: Heart,
    title: 'Student-Centric',
    description: 'Students are at the heart of everything. We ensure that every graduate in India has access to free, AI-powered credential verification.',
    color: 'from-red-500 to-rose-400',
  },
  {
    icon: Users,
    title: 'Inclusive by Design',
    description: 'From tier-1 cities to rural India, our platform works for everyone. Multi-language support and accessible design ensure no one is left behind.',
    color: 'from-emerald-500 to-teal-400',
  },
]

export default function AboutPage() {
  return (
    <InfoPageLayout
      title="About Credentia"
      subtitle="India's most trusted AI-powered credential verification platform. We're on a mission to make credential fraud a thing of the past."
    >
      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="card p-6 sm:p-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center mb-4">
            <Target size={24} className="text-cyan-400" />
          </div>
          <h2 className="font-heading text-xl font-bold text-[rgb(var(--text-primary))] mb-3">Our Mission</h2>
          <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
            To democratize credential verification in India by providing free, AI-powered tools that enable every student, company, and university to verify documents instantly — eliminating fraud, reducing hiring time, and building trust in the professional ecosystem.
          </p>
        </div>
        <div className="card p-6 sm:p-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-400/20 flex items-center justify-center mb-4">
            <Eye size={24} className="text-purple-400" />
          </div>
          <h2 className="font-heading text-xl font-bold text-[rgb(var(--text-primary))] mb-3">Our Vision</h2>
          <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
            A world where every credential is verifiable, every certificate is tamper-proof, and every professional is trusted. We envision Credentia as the universal standard for credential verification across India and beyond.
          </p>
        </div>
      </div>

      {/* The Story */}
      <div className="card p-6 sm:p-8 mb-12">
        <h2 className="font-heading text-2xl font-bold text-[rgb(var(--text-primary))] mb-4">Our Story</h2>
        <div className="space-y-4 text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
          <p>
            Credentia was born from a simple frustration: why does it take weeks to verify a candidate&apos;s credentials when we have AI that can do it in minutes? In India, where millions of graduates enter the workforce each year, credential fraud and slow verification processes waste time for everyone — students, companies, and universities alike.
          </p>
          <p>
            We built Credentia to solve this problem. Using Google&apos;s Gemini AI, we analyze resumes for ATS compatibility, verify police certificates against government databases, authenticate Aadhaar identities, and generate tamper-proof digital certificates — all in under two minutes.
          </p>
          <p>
            Today, Credentia serves students, companies, and universities across India with a platform that&apos;s free for students, instant for companies, and comprehensive for academic institutions.
          </p>
        </div>
      </div>

      {/* Values */}
      <h2 className="font-heading text-2xl font-bold text-[rgb(var(--text-primary))] text-center mb-8">Our Values</h2>
      <div className="grid sm:grid-cols-2 gap-6 mb-12">
        {values.map((value, i) => (
          <div key={i} className="card p-6 group hover:border-[rgb(var(--accent))]/30">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <value.icon size={24} className="text-white" />
            </div>
            <h3 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))] mb-2">{value.title}</h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">{value.description}</p>
          </div>
        ))}
      </div>

      {/* Team link */}
      <div className="text-center">
        <div className="card p-8 sm:p-12 max-w-2xl mx-auto border-[rgb(var(--accent))]/20">
          <h2 className="font-heading text-2xl font-bold text-[rgb(var(--text-primary))] mb-3">Meet Our Team</h2>
          <p className="text-[rgb(var(--text-secondary))] mb-6">
            The passionate people building the future of credential verification.
          </p>
          <Link href="/#team" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm">
            View Our Team →
          </Link>
        </div>
      </div>
    </InfoPageLayout>
  )
}

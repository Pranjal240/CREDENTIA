'use client'

import { Building2, ShieldCheck, Users, BarChart3, Zap, Globe, Clock, FileCheck } from 'lucide-react'
import InfoPageLayout from '@/components/landing/InfoPageLayout'

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Verified Applicant Profiles',
    description: 'Every applicant who shares their Credentia link has already been verified. See AI-analyzed resumes, verified police certificates, and authenticated Aadhaar — all in one place.',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    icon: Zap,
    title: 'Instant Background Checks',
    description: 'What used to take weeks now takes seconds. Click an applicant\'s verification link and instantly see their complete credential status — no back-and-forth emails.',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: BarChart3,
    title: 'ATS Compatibility Scoring',
    description: 'See how each applicant\'s resume scores against ATS systems. Our AI provides keyword analysis, formatting scores, and compatibility ratings to help you filter better candidates.',
    color: 'from-purple-500 to-pink-400',
  },
  {
    icon: Users,
    title: 'Bulk Applicant Management',
    description: 'Manage hundreds of applicants from your dedicated company dashboard. Filter by verification status, credential type, or verification score.',
    color: 'from-orange-500 to-amber-400',
  },
  {
    icon: Clock,
    title: 'Real-Time Status Updates',
    description: 'Get notified when an applicant\'s verification status changes. Our real-time system ensures you always have the latest credential information.',
    color: 'from-red-500 to-rose-400',
  },
  {
    icon: Globe,
    title: 'Pan-India Coverage',
    description: 'Whether your applicants are from Delhi, Mumbai, Bangalore, or any tier-2 city — Credentia\'s verification works nationwide with government database integration.',
    color: 'from-indigo-500 to-violet-400',
  },
]

const stats = [
  { value: '10x', label: 'Faster Verification' },
  { value: '99.2%', label: 'Accuracy Rate' },
  { value: '₹0', label: 'Cost for Basic Checks' },
  { value: '< 2min', label: 'Average Verification Time' },
]

export default function ForCompaniesPage() {
  return (
    <InfoPageLayout
      title="For Companies"
      subtitle="Stop wasting weeks on manual background checks. Verify every applicant's credentials instantly with AI-powered verification."
    >
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="card p-4 text-center">
            <div className="font-heading text-2xl sm:text-3xl font-black gradient-text-hero">{stat.value}</div>
            <div className="text-xs text-[rgb(var(--text-muted))] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Benefits grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, i) => (
          <div key={i} className="card p-6 group hover:border-[rgb(var(--accent))]/30">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <benefit.icon size={24} className="text-white" />
            </div>
            <h3 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))] mb-2">
              {benefit.title}
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>

      {/* How it works for companies */}
      <div className="mt-16">
        <h2 className="font-heading text-2xl font-bold text-[rgb(var(--text-primary))] text-center mb-8">
          How Companies Use Credentia
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { step: '1', icon: Building2, title: 'Register Your Company', desc: 'Create a free company account and set up your organization profile.' },
            { step: '2', icon: FileCheck, title: 'Receive Applicant Links', desc: 'Applicants share their Credentia verification link during their application.' },
            { step: '3', icon: ShieldCheck, title: 'Verify Instantly', desc: 'Click to see verified credentials, AI analysis, and credential scores.' },
          ].map((item, i) => (
            <div key={i} className="card p-6 text-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-heading font-bold text-sm">
                {item.step}
              </div>
              <div className="mt-4 mb-3">
                <item.icon size={32} className="text-[rgb(var(--accent))] mx-auto" />
              </div>
              <h3 className="font-heading font-bold text-[rgb(var(--text-primary))] mb-1">{item.title}</h3>
              <p className="text-sm text-[rgb(var(--text-secondary))]">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <div className="card p-8 sm:p-12 max-w-2xl mx-auto border-[rgb(var(--accent))]/20">
          <h2 className="font-heading text-2xl font-bold text-[rgb(var(--text-primary))] mb-3">
            Start verifying applicants today
          </h2>
          <p className="text-[rgb(var(--text-secondary))] mb-6">
            Free for companies. No credit card required.
          </p>
          <a href="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm">
            Register Your Company →
          </a>
        </div>
      </div>
    </InfoPageLayout>
  )
}

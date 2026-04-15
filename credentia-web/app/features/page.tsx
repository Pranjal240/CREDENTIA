'use client'

import { Shield, Brain, FileCheck, Link2, Fingerprint, Globe, Lock, Zap } from 'lucide-react'
import InfoPageLayout from '@/components/landing/InfoPageLayout'

const features = [
  {
    icon: Brain,
    title: 'Gemini AI Document Analysis',
    description: 'Our advanced AI engine powered by Google Gemini analyzes every document you upload — resumes, certificates, transcripts — extracting key information and verifying authenticity in seconds, not days.',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Shield,
    title: 'Government-Grade KYC Verification',
    description: 'Integrated with government databases for Aadhaar verification and police certificate validation. Every identity check meets the highest compliance standards.',
    color: 'from-purple-500 to-pink-400',
  },
  {
    icon: FileCheck,
    title: 'Fraud-Proof Credential Certificates',
    description: 'Each verified credential generates a tamper-proof digital certificate with a unique hash. Any modification is instantly detectable, making credential fraud impossible.',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    icon: Link2,
    title: 'One Link, Every Company',
    description: 'Share a single verification link with every employer. They can instantly verify all your credentials — resume, education, police clearance, and identity — without you re-uploading anything.',
    color: 'from-orange-500 to-amber-400',
  },
  {
    icon: Fingerprint,
    title: 'Biometric-Level Security',
    description: 'End-to-end encryption, secure file storage via Supabase, and role-based access control ensure your sensitive documents are protected at every step.',
    color: 'from-red-500 to-rose-400',
  },
  {
    icon: Globe,
    title: 'Multi-Portal Architecture',
    description: 'Dedicated dashboards for Students, Companies, Universities, and Admins. Each portal is tailored with role-specific features, analytics, and workflows.',
    color: 'from-indigo-500 to-violet-400',
  },
  {
    icon: Zap,
    title: 'Instant ATS Resume Scoring',
    description: 'Get your resume scored against ATS systems with actionable feedback. Know exactly how your resume performs before applying, with keyword analysis and formatting suggestions.',
    color: 'from-yellow-500 to-orange-400',
  },
  {
    icon: Lock,
    title: 'Enterprise-Ready Compliance',
    description: 'Built for scale with SOC 2 aligned practices, GDPR-ready data handling, and audit trails. Perfect for companies processing thousands of applicant verifications.',
    color: 'from-cyan-500 to-blue-400',
  },
]

export default function FeaturesPage() {
  return (
    <InfoPageLayout
      title="Platform Features"
      subtitle="Everything you need to verify credentials with confidence. AI-powered, government-grade, and built for the modern workforce."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature, i) => (
          <div
            key={i}
            className="card p-6 group hover:border-[rgb(var(--accent))]/30"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <feature.icon size={24} className="text-white" />
            </div>
            <h3 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))] mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 text-center">
        <div className="card p-8 sm:p-12 max-w-2xl mx-auto border-[rgb(var(--accent))]/20">
          <h2 className="font-heading text-2xl font-bold text-[rgb(var(--text-primary))] mb-3">
            Ready to experience these features?
          </h2>
          <p className="text-[rgb(var(--text-secondary))] mb-6">
            Start verifying your credentials for free — no credit card required.
          </p>
          <a href="/register" className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm">
            Start Verifying Free →
          </a>
        </div>
      </div>
    </InfoPageLayout>
  )
}

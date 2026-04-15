'use client'

import { Upload, Brain, ShieldCheck, Link2, CheckCircle2, Building2 } from 'lucide-react'
import InfoPageLayout from '@/components/landing/InfoPageLayout'

const steps = [
  {
    step: '01',
    icon: Upload,
    title: 'Upload Your Documents',
    description: 'Upload your resume, police certificate, Aadhaar card, or educational certificates. We support PDF, images, and common document formats. Simply drag and drop or browse to upload.',
    details: [
      'Drag & drop or click to browse',
      'Supports PDF, JPG, PNG formats',
      'Encrypted upload — your files are safe',
      'Upload multiple documents simultaneously',
    ],
    color: 'from-blue-500 to-cyan-400',
  },
  {
    step: '02',
    icon: Brain,
    title: 'AI Verification & Analysis',
    description: 'Our Gemini AI engine analyzes your documents in real-time. It extracts key information, cross-references against databases, and generates a comprehensive verification report.',
    details: [
      'Powered by Google Gemini AI',
      'Extracts text, dates, and key fields',
      'Cross-verifies against government databases',
      'Resume ATS scoring with keyword analysis',
    ],
    color: 'from-purple-500 to-pink-400',
  },
  {
    step: '03',
    icon: ShieldCheck,
    title: 'Get Verified & Certified',
    description: 'Once analysis is complete, each document receives a verification status and a tamper-proof digital certificate. Your verification score reflects the overall credibility of your credentials.',
    details: [
      'Tamper-proof digital certificates',
      'Unique verification hash per document',
      'Overall credibility score calculated',
      'Instant re-verification if documents change',
    ],
    color: 'from-emerald-500 to-teal-400',
  },
  {
    step: '04',
    icon: Link2,
    title: 'Share Your Verification Link',
    description: 'Get a single shareable link that companies can use to instantly verify all your credentials. No more re-uploading documents for every job application.',
    details: [
      'One link for all your credentials',
      'Companies get instant verification results',
      'Controlled access — you decide what to share',
      'Real-time status updates for applicants',
    ],
    color: 'from-orange-500 to-amber-400',
  },
]

const forCompanies = [
  {
    icon: Building2,
    title: 'Receive Applicant Link',
    description: 'Applicants share their Credentia verification link during the application process.',
  },
  {
    icon: CheckCircle2,
    title: 'Instant Verification',
    description: 'Click the link to see all verified credentials, scores, and certificates — no waiting, no manual checks.',
  },
]

export default function HowItWorksPage() {
  return (
    <InfoPageLayout
      title="How It Works"
      subtitle="From upload to verified in minutes. Here's our simple 4-step process that's transforming credential verification in India."
    >
      {/* Steps */}
      <div className="space-y-8">
        {steps.map((step, i) => (
          <div key={i} className="card p-6 sm:p-8 flex flex-col md:flex-row gap-6 group hover:border-[rgb(var(--accent))]/30">
            {/* Step number & icon */}
            <div className="flex-shrink-0 flex flex-col items-center md:items-start gap-3">
              <span className="font-heading text-4xl font-black text-[rgb(var(--text-muted))]/30">
                {step.step}
              </span>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <step.icon size={28} className="text-white" />
              </div>
            </div>
            {/* Content */}
            <div className="flex-1">
              <h3 className="font-heading text-xl font-bold text-[rgb(var(--text-primary))] mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed mb-4">
                {step.description}
              </p>
              <ul className="grid sm:grid-cols-2 gap-2">
                {step.details.map((detail, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]">
                    <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* For Companies mini-section */}
      <div className="mt-16">
        <h2 className="font-heading text-2xl font-bold text-[rgb(var(--text-primary))] text-center mb-8">
          For Companies — It&apos;s Even Simpler
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {forCompanies.map((item, i) => (
            <div key={i} className="card p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center mx-auto mb-4">
                <item.icon size={24} className="text-cyan-400" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))] mb-2">{item.title}</h3>
              <p className="text-sm text-[rgb(var(--text-secondary))]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </InfoPageLayout>
  )
}

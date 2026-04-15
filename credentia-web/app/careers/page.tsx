'use client'

import { Briefcase, MapPin, Heart, Rocket, Code, Palette } from 'lucide-react'
import InfoPageLayout from '@/components/landing/InfoPageLayout'

const perks = [
  { icon: Rocket, title: 'Build What Matters', description: 'Work on AI-powered products that impact millions of students and companies across India.' },
  { icon: Code, title: 'Modern Tech Stack', description: 'Next.js, React, Supabase, Google Gemini AI, TypeScript — we use the best tools for the job.' },
  { icon: Heart, title: 'Remote First', description: 'Work from anywhere in India. We believe great work happens when you\'re comfortable.' },
  { icon: Palette, title: 'Creative Freedom', description: 'We value initiative. Bring your ideas, experiment with new approaches, and ship with confidence.' },
]

export default function CareersPage() {
  return (
    <InfoPageLayout
      title="Join Our Team"
      subtitle="Help us build the future of credential verification in India. We're always looking for passionate people."
    >
      {/* Perks */}
      <div className="grid sm:grid-cols-2 gap-6 mb-12">
        {perks.map((perk, i) => (
          <div key={i} className="card p-6 group hover:border-[rgb(var(--accent))]/30">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <perk.icon size={20} className="text-cyan-400" />
            </div>
            <h3 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))] mb-1">{perk.title}</h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">{perk.description}</p>
          </div>
        ))}
      </div>

      {/* Current Openings */}
      <h2 className="font-heading text-2xl font-bold text-[rgb(var(--text-primary))] text-center mb-8">Current Openings</h2>

      <div className="max-w-3xl mx-auto space-y-4 mb-12">
        {[
          { role: 'Full Stack Developer', type: 'Full-time · Remote', desc: 'Build and scale our Next.js/Supabase platform. Experience with React, TypeScript, and APIs required.' },
          { role: 'AI/ML Engineer', type: 'Full-time · Remote', desc: 'Work on Gemini AI integration for document analysis, NLP, and fraud detection systems.' },
          { role: 'UI/UX Designer', type: 'Part-time · Remote', desc: 'Design beautiful, accessible interfaces for our multi-portal platform. Figma expertise preferred.' },
        ].map((job, i) => (
          <div key={i} className="card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[rgb(var(--accent))]/30">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Briefcase size={16} className="text-[rgb(var(--accent))]" />
                <h3 className="font-heading font-bold text-[rgb(var(--text-primary))]">{job.role}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-muted))] mb-2">
                <MapPin size={12} /> {job.type}
              </div>
              <p className="text-sm text-[rgb(var(--text-secondary))]">{job.desc}</p>
            </div>
            <a href="/contact" className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap flex-shrink-0">Apply Now</a>
          </div>
        ))}
      </div>

      {/* Open application */}
      <div className="text-center">
        <div className="card p-8 sm:p-12 max-w-2xl mx-auto border-[rgb(var(--accent))]/20">
          <h2 className="font-heading text-xl font-bold text-[rgb(var(--text-primary))] mb-3">Don&apos;t see your role?</h2>
          <p className="text-[rgb(var(--text-secondary))] mb-6 text-sm">
            We&apos;re always looking for talented people. Send us your resume and tell us how you can contribute.
          </p>
          <a href="/contact" className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-sm">
            Get in Touch →
          </a>
        </div>
      </div>
    </InfoPageLayout>
  )
}

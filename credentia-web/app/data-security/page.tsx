'use client'

import { Shield, Lock, Server, Eye, Key, RefreshCw, FileCheck, Globe } from 'lucide-react'
import InfoPageLayout from '@/components/landing/InfoPageLayout'

const securityFeatures = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'All document uploads and data transmissions are encrypted using TLS 1.3. Your files are encrypted at rest using AES-256 encryption on Supabase Storage.',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Server,
    title: 'Secure Infrastructure',
    description: 'Our platform runs on Vercel\'s edge network and Supabase\'s managed infrastructure, both built on AWS with enterprise-grade security, redundancy, and uptime guarantees.',
    color: 'from-purple-500 to-pink-400',
  },
  {
    icon: Key,
    title: 'Authentication & Access Control',
    description: 'We use Supabase Auth with JWT tokens, Row Level Security (RLS) policies, and role-based access control. Every API request is authenticated and authorized before processing.',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    icon: Eye,
    title: 'Privacy by Design',
    description: 'We follow privacy-by-design principles. Only necessary data is collected, processed, and stored. Sensitive fields like Aadhaar numbers are never stored in plain text.',
    color: 'from-orange-500 to-amber-400',
  },
  {
    icon: Shield,
    title: 'AI Processing Security',
    description: 'Documents sent to Google Gemini AI for analysis are processed in-memory and not retained by Google for training. We use Google\'s enterprise API tier with data processing agreements.',
    color: 'from-red-500 to-rose-400',
  },
  {
    icon: RefreshCw,
    title: 'Regular Security Audits',
    description: 'We conduct regular security reviews of our codebase, dependencies, and infrastructure. Vulnerabilities are patched promptly following responsible disclosure practices.',
    color: 'from-indigo-500 to-violet-400',
  },
  {
    icon: FileCheck,
    title: 'Data Integrity',
    description: 'Every verified credential generates a unique tamper-proof hash. Any modification to the original document is instantly detectable, ensuring the integrity of all verification results.',
    color: 'from-cyan-500 to-blue-400',
  },
  {
    icon: Globe,
    title: 'Compliance Standards',
    description: 'Our platform is designed to align with IT Act 2000 (India), GDPR principles for data protection, and industry best practices for handling sensitive identity documents.',
    color: 'from-yellow-500 to-orange-400',
  },
]

export default function DataSecurityPage() {
  return (
    <InfoPageLayout
      title="Data Security"
      subtitle="Your credentials are sensitive. Here's how we protect them with enterprise-grade security at every layer."
    >
      {/* Security overview */}
      <div className="card p-6 sm:p-8 mb-8 border-[rgb(var(--accent))]/20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-400/20 flex items-center justify-center mx-auto mb-4">
          <Shield size={32} className="text-emerald-400" />
        </div>
        <h2 className="font-heading text-xl font-bold text-[rgb(var(--text-primary))] mb-2">Security is Our Foundation</h2>
        <p className="text-sm text-[rgb(var(--text-secondary))] max-w-2xl mx-auto leading-relaxed">
          Credentia handles sensitive identity documents — resumes, Aadhaar cards, police certificates, and educational records. We&apos;ve built our entire platform with security as the foundation, not an afterthought.
        </p>
      </div>

      {/* Security features grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {securityFeatures.map((feature, i) => (
          <div key={i} className="card p-6 group hover:border-[rgb(var(--accent))]/30">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <feature.icon size={24} className="text-white" />
            </div>
            <h3 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))] mb-2">{feature.title}</h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Data lifecycle */}
      <div className="card p-6 sm:p-8 mb-8">
        <h2 className="font-heading text-xl font-bold text-[rgb(var(--text-primary))] mb-4">Data Lifecycle</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: '1', title: 'Upload', desc: 'Encrypted TLS 1.3 transfer' },
            { step: '2', title: 'Process', desc: 'In-memory AI analysis' },
            { step: '3', title: 'Store', desc: 'AES-256 encrypted at rest' },
            { step: '4', title: 'Share', desc: 'Permission-based access only' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto mb-2 text-white font-heading font-bold text-sm">
                {item.step}
              </div>
              <h4 className="font-heading font-bold text-[rgb(var(--text-primary))] text-sm">{item.title}</h4>
              <p className="text-xs text-[rgb(var(--text-muted))] mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Report vulnerability */}
      <div className="text-center">
        <div className="card p-8 sm:p-12 max-w-2xl mx-auto border-[rgb(var(--accent))]/20">
          <h2 className="font-heading text-xl font-bold text-[rgb(var(--text-primary))] mb-3">Report a Vulnerability</h2>
          <p className="text-[rgb(var(--text-secondary))] mb-6 text-sm">
            Found a security issue? We take responsible disclosure seriously. Contact us immediately.
          </p>
          <a href="mailto:contact@credentiaonline.in" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
            Report Security Issue →
          </a>
        </div>
      </div>
    </InfoPageLayout>
  )
}

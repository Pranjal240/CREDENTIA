'use client'

import { FileText, Clock, Tag } from 'lucide-react'
import InfoPageLayout from '@/components/landing/InfoPageLayout'

const articles = [
  {
    title: 'How AI is Transforming Credential Verification in India',
    excerpt: 'A deep dive into how artificial intelligence is replacing manual background checks and making credential verification faster, more accurate, and accessible for millions.',
    date: 'Coming Soon',
    category: 'AI & Technology',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    title: 'The Rise of Resume Fraud: Why ATS Scoring Matters',
    excerpt: 'Resume fraud affects 40% of applications in India. Learn how AI-powered ATS scoring helps companies filter genuine candidates and why students should care about their scores.',
    date: 'Coming Soon',
    category: 'Industry Insights',
    color: 'from-purple-500 to-pink-400',
  },
  {
    title: 'Building a Tamper-Proof Credential System with Blockchain',
    excerpt: 'Exploring how digital hashing and secure certificate generation make credential tampering virtually impossible — and what this means for the future of hiring.',
    date: 'Coming Soon',
    category: 'Security',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    title: 'From Upload to Verified: Inside Credentia\'s AI Pipeline',
    excerpt: 'A technical walkthrough of how Credentia processes documents — from PDF parsing to Gemini AI analysis, government database checks, and certificate generation.',
    date: 'Coming Soon',
    category: 'Product',
    color: 'from-orange-500 to-amber-400',
  },
  {
    title: 'Why Every Student in India Needs a Verification Link',
    excerpt: 'The job market is competitive. Learn how a single verification link can give you an edge over thousands of other applicants and build instant trust with employers.',
    date: 'Coming Soon',
    category: 'Career Tips',
    color: 'from-red-500 to-rose-400',
  },
  {
    title: 'The Future of University ERPs: Integrated Verification',
    excerpt: 'How universities can integrate Credentia\'s verification system into their existing ERP infrastructure for seamless student credential management.',
    date: 'Coming Soon',
    category: 'Universities',
    color: 'from-indigo-500 to-violet-400',
  },
]

export default function BlogPage() {
  return (
    <InfoPageLayout
      title="Our Blog"
      subtitle="Insights, updates, and deep dives into credential verification, AI technology, and the future of hiring in India."
    >
      {/* Coming soon banner */}
      <div className="card p-6 mb-8 border-[rgb(var(--accent))]/20 text-center">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center mx-auto mb-3">
          <FileText size={24} className="text-cyan-400" />
        </div>
        <h2 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))] mb-2">Blog Coming Soon</h2>
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          We&apos;re preparing in-depth articles on AI verification, security, and career tips. Stay tuned!
        </p>
      </div>

      {/* Article previews */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, i) => (
          <div key={i} className="card p-6 group hover:border-[rgb(var(--accent))]/30 opacity-80 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={12} className="text-[rgb(var(--accent))]" />
              <span className="text-xs font-semibold text-[rgb(var(--accent))]">{article.category}</span>
            </div>
            <h3 className="font-heading text-base font-bold text-[rgb(var(--text-primary))] mb-2 leading-snug">
              {article.title}
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed mb-4 line-clamp-3">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
              <Clock size={12} />
              {article.date}
            </div>
          </div>
        ))}
      </div>

      {/* Newsletter CTA */}
      <div className="mt-16 text-center">
        <div className="card p-8 sm:p-12 max-w-2xl mx-auto border-[rgb(var(--accent))]/20">
          <h2 className="font-heading text-xl font-bold text-[rgb(var(--text-primary))] mb-3">Get Notified</h2>
          <p className="text-[rgb(var(--text-secondary))] mb-6 text-sm">
            Follow us on social media to be the first to know when we publish new articles.
          </p>
          <a href="/contact" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
            Follow Us →
          </a>
        </div>
      </div>
    </InfoPageLayout>
  )
}

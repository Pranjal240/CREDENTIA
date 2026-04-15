'use client'

import InfoPageLayout from '@/components/landing/InfoPageLayout'

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: [
      'By accessing or using the CREDENTIA platform, you agree to be bound by these Terms of Service.',
      'If you do not agree to these terms, you must not use our platform.',
      'We reserve the right to update these terms at any time. Continued use after changes constitutes acceptance.',
    ],
  },
  {
    title: '2. Account Registration',
    content: [
      'You must provide accurate and complete information when creating an account.',
      'You are responsible for maintaining the confidentiality of your login credentials.',
      'You must be at least 18 years old to create an account.',
      'One person may only maintain one account per role (student, company, or university).',
    ],
  },
  {
    title: '3. Acceptable Use',
    content: [
      'You may only upload documents that belong to you or that you have authorization to verify.',
      'You must not upload fraudulent, forged, or misleading documents.',
      'You must not attempt to reverse-engineer, hack, or disrupt our AI verification systems.',
      'You must not use the platform for any illegal or unauthorized purpose.',
      'You must not scrape, crawl, or automated-access any part of the platform without permission.',
    ],
  },
  {
    title: '4. Document Verification',
    content: [
      'Our AI-powered verification provides analysis and scoring based on the documents you upload.',
      'Verification results are AI-generated assessments and should be used as supplementary information, not as legally binding certifications.',
      'We strive for accuracy but do not guarantee 100% accuracy of AI analysis.',
      'Verification status may change if documents are re-analyzed or if discrepancies are detected.',
    ],
  },
  {
    title: '5. Verification Links',
    content: [
      'When you share your verification link, you consent to companies viewing your verified credential status.',
      'You can revoke access to your verification link at any time from your dashboard.',
      'Companies accessing your verification link agree to use the information solely for employment or verification purposes.',
    ],
  },
  {
    title: '6. Intellectual Property',
    content: [
      'All content, features, and functionality of the CREDENTIA platform are owned by us and protected by intellectual property laws.',
      'Your uploaded documents remain your property. We only use them for verification purposes.',
      'You grant us a limited license to process your documents through our AI system for verification purposes.',
    ],
  },
  {
    title: '7. Limitation of Liability',
    content: [
      'CREDENTIA is provided "as is" without warranties of any kind, express or implied.',
      'We are not liable for any decisions made based on our verification results.',
      'Our total liability shall not exceed the amount you paid us in the 12 months prior to the claim.',
      'We are not responsible for delays or failures due to third-party service outages (Supabase, Google AI, etc.).',
    ],
  },
  {
    title: '8. Termination',
    content: [
      'We may suspend or terminate your account if you violate these terms.',
      'You may delete your account at any time by contacting support.',
      'Upon termination, your data will be handled according to our Privacy Policy.',
    ],
  },
  {
    title: '9. Governing Law',
    content: [
      'These terms are governed by the laws of India.',
      'Any disputes will be resolved in the courts of India.',
      'If any provision is found unenforceable, the remaining provisions remain in effect.',
    ],
  },
  {
    title: '10. Contact',
    content: [
      'For questions about these Terms, contact us at **contact@credentiaonline.in**.',
    ],
  },
]

export default function TermsPage() {
  return (
    <InfoPageLayout
      title="Terms of Service"
      subtitle="Last updated: April 2026. Please read these terms carefully before using our platform."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card p-6 sm:p-8 border-[rgb(var(--accent))]/20">
          <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of the CREDENTIA credential verification platform operated by CREDENTIA (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By accessing or using our platform, you agree to be bound by these Terms.
          </p>
        </div>

        {sections.map((section, i) => (
          <div key={i} className="card p-6 sm:p-8">
            <h2 className="font-heading text-lg font-bold text-[rgb(var(--text-primary))] mb-4">{section.title}</h2>
            <ul className="space-y-3">
              {section.content.map((item, j) => (
                <li key={j} className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed pl-4 border-l-2 border-[rgb(var(--border-default))]"
                  dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[rgb(var(--text-primary))]">$1</strong>') }}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </InfoPageLayout>
  )
}

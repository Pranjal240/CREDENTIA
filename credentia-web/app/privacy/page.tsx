'use client'

import InfoPageLayout from '@/components/landing/InfoPageLayout'

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      '**Personal Information**: When you register, we collect your name, email address, and role (student, company, or university).',
      '**Identity Documents**: Documents you upload for verification including resumes, police certificates, Aadhaar cards, and educational certificates.',
      '**Usage Data**: We automatically collect information about how you interact with our platform, including pages visited, features used, and timestamps.',
      '**Device Information**: Browser type, operating system, IP address, and device identifiers for security and analytics purposes.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    content: [
      '**Credential Verification**: Your documents are processed by our AI system (Google Gemini) to extract, analyze, and verify credential information.',
      '**Account Management**: We use your email and profile data to manage your account, provide support, and send important notifications.',
      '**Platform Improvement**: Usage data helps us improve our platform, fix bugs, and develop new features.',
      '**Security & Fraud Prevention**: We use data to detect and prevent unauthorized access, fraud, and abuse of our services.',
    ],
  },
  {
    title: '3. Document Storage & Security',
    content: [
      'All uploaded documents are stored securely on **Supabase Storage** with end-to-end encryption.',
      'Documents are processed by our AI system but are never shared with third parties for advertising or marketing.',
      'You can delete your uploaded documents at any time from your dashboard. Deleted documents are permanently removed within 30 days.',
      'We do not store raw Aadhaar numbers — only the verification status is retained.',
    ],
  },
  {
    title: '4. Data Sharing',
    content: [
      '**With Your Consent**: When you share your verification link, companies can view your verified credential status.',
      '**Service Providers**: We use Google Gemini AI for document analysis and Supabase for infrastructure. These providers are bound by their own privacy policies.',
      '**Legal Requirements**: We may disclose information if required by law, court order, or governmental authorities.',
      '**We Never Sell**: We do not sell, rent, or trade your personal data to any third party.',
    ],
  },
  {
    title: '5. Your Rights',
    content: [
      '**Access**: You can view all your data from your dashboard at any time.',
      '**Correction**: You can update your profile information and re-upload documents for re-verification.',
      '**Deletion**: You can delete your account and all associated data by contacting us.',
      '**Portability**: You can export your verification certificates and reports.',
    ],
  },
  {
    title: '6. Children\'s Privacy',
    content: [
      'Credentia is not intended for users under 18 years of age. We do not knowingly collect data from minors.',
      'If you believe a minor has provided us with personal data, please contact us immediately for removal.',
    ],
  },
  {
    title: '7. Changes to This Policy',
    content: [
      'We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.',
      'Continued use of our platform after changes constitutes acceptance of the revised policy.',
    ],
  },
  {
    title: '8. Contact Us',
    content: [
      'If you have questions about this Privacy Policy, please contact us at **contact@credentiaonline.in**.',
      'You can also reach us through our social media channels listed on our Contact page.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <InfoPageLayout
      title="Privacy Policy"
      subtitle="Last updated: April 2026. We take your privacy seriously. Here's how we collect, use, and protect your data."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Introduction */}
        <div className="card p-6 sm:p-8 border-[rgb(var(--accent))]/20">
          <p className="text-sm text-[rgb(var(--text-secondary))] leading-relaxed">
            CREDENTIA (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the credential verification platform at credentiaonline.in. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. By using Credentia, you agree to the terms outlined in this policy.
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

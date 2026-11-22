import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/site/legal-page'
import { CONTACT_EMAIL } from '@/lib/site-config'

export const metadata: Metadata = { title: 'Privacy Policy' }

const sections: LegalSection[] = [
  {
    title: '1. Information we collect',
    items: [
      '**Personal information**: When you register, we collect your name, email address, and role (student, company, or university).',
      '**Identity documents**: Documents you upload for verification, including resumes, police certificates, Aadhaar cards, and educational certificates.',
      '**Usage data**: We automatically collect information about how you interact with our platform, including pages visited, features used, and timestamps.',
      '**Device information**: Browser type, operating system, IP address, and device identifiers for security and analytics purposes.',
    ],
  },
  {
    title: '2. How we use your information',
    items: [
      '**Credential verification**: Your documents are processed by AI systems (Google Gemini, with Groq as a fallback) to extract, analyze, and verify credential information.',
      '**Account management**: We use your email and profile data to manage your account, provide support, and send important notifications.',
      '**Platform improvement**: Usage data helps us improve our platform, fix bugs, and develop new features.',
      '**Security and fraud prevention**: We use data to detect and prevent unauthorized access, fraud, and abuse of our services.',
    ],
  },
  {
    title: '3. Document storage and security',
    items: [
      'Uploaded documents are stored in Cloudflare R2 object storage. Account and verification data is stored in our Supabase database.',
      'Documents are processed by our AI providers to read them, and are never shared with third parties for advertising or marketing.',
      'You can delete your uploaded documents at any time from your dashboard. Deleted documents are permanently removed within 30 days.',
      'We do not store full Aadhaar numbers. Only the last four digits and the details shown in your dashboard are kept.',
    ],
  },
  {
    title: '4. Data sharing',
    items: [
      '**With your consent**: When you share your verification link, companies can view your verified credential status.',
      '**Service providers**: We use Google Gemini and Groq for document analysis, Supabase for authentication and database services, and Cloudflare for file storage. These providers are bound by their own privacy policies.',
      '**Legal requirements**: We may disclose information if required by law, court order, or governmental authorities.',
      '**We never sell**: We do not sell, rent, or trade your personal data to any third party.',
    ],
  },
  {
    title: '5. Your rights',
    items: [
      '**Access**: You can view all your data from your dashboard at any time.',
      '**Correction**: You can update your profile information and re-upload documents for re-verification.',
      '**Deletion**: You can delete your account and all associated data by contacting us.',
      '**Portability**: You can export your verification results from your dashboard.',
    ],
  },
  {
    title: "6. Children's privacy",
    items: [
      'Credentia is not intended for users under 18 years of age. We do not knowingly collect data from minors.',
      'If you believe a minor has provided us with personal data, please contact us immediately for removal.',
    ],
  },
  {
    title: '7. Changes to this policy',
    items: [
      'We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.',
      'Continued use of our platform after changes constitutes acceptance of the revised policy.',
    ],
  },
  {
    title: '8. Contact us',
    items: [
      `If you have questions about this Privacy Policy, please contact us at **${CONTACT_EMAIL}**.`,
      'You can also reach us through the channels listed on our Contact page.',
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="Last updated: April 2026. How we collect, use, and protect your data."
      intro='Credentia ("we", "our", or "us") operates the credential verification platform at credentiaonline.in. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. By using Credentia, you agree to the terms outlined in this policy.'
      sections={sections}
    />
  )
}

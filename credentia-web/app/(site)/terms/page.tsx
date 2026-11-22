import type { Metadata } from 'next'
import { LegalPage, type LegalSection } from '@/components/site/legal-page'
import { CONTACT_EMAIL } from '@/lib/site-config'

export const metadata: Metadata = { title: 'Terms of Service' }

const sections: LegalSection[] = [
  {
    title: '1. Acceptance of terms',
    items: [
      'By accessing or using the Credentia platform, you agree to be bound by these Terms of Service.',
      'If you do not agree to these terms, you must not use our platform.',
      'We reserve the right to update these terms at any time. Continued use after changes constitutes acceptance.',
    ],
  },
  {
    title: '2. Account registration',
    items: [
      'You must provide accurate and complete information when creating an account.',
      'You are responsible for maintaining the confidentiality of your login credentials.',
      'You must be at least 18 years old to create an account.',
      'One person may only maintain one account per role (student, company, or university).',
    ],
  },
  {
    title: '3. Acceptable use',
    items: [
      'You may only upload documents that belong to you or that you have authorization to verify.',
      'You must not upload fraudulent, forged, or misleading documents.',
      'You must not attempt to reverse engineer, hack, or disrupt our AI verification systems.',
      'You must not use the platform for any illegal or unauthorized purpose.',
      'You must not scrape, crawl, or automatically access any part of the platform without permission.',
    ],
  },
  {
    title: '4. Document verification',
    items: [
      'Our AI-powered verification provides analysis and scoring based on the documents you upload.',
      'Verification results are AI-generated assessments and should be used as supplementary information, not as legally binding certifications.',
      'We strive for accuracy but do not guarantee 100% accuracy of AI analysis.',
      'Verification status may change if documents are re-analyzed or if discrepancies are detected.',
    ],
  },
  {
    title: '5. Verification links',
    items: [
      'When you share your verification link, you consent to others viewing your verified credential status.',
      'You can revoke access to your verification link at any time from your dashboard.',
      'Companies accessing your verification link agree to use the information solely for employment or verification purposes.',
    ],
  },
  {
    title: '6. Intellectual property',
    items: [
      'All content, features, and functionality of the Credentia platform are owned by us and protected by intellectual property laws.',
      'Your uploaded documents remain your property. We only use them for verification purposes.',
      'You grant us a limited license to process your documents through our AI systems for verification purposes.',
    ],
  },
  {
    title: '7. Limitation of liability',
    items: [
      'Credentia is provided "as is" without warranties of any kind, express or implied.',
      'We are not liable for any decisions made based on our verification results.',
      'Our total liability shall not exceed the amount you paid us in the 12 months prior to the claim.',
      'We are not responsible for delays or failures due to third-party service outages (Supabase, Google AI, and similar providers).',
    ],
  },
  {
    title: '8. Termination',
    items: [
      'We may suspend or terminate your account if you violate these terms.',
      'You may delete your account at any time by contacting support.',
      'Upon termination, your data will be handled according to our Privacy Policy.',
    ],
  },
  {
    title: '9. Governing law',
    items: [
      'These terms are governed by the laws of India.',
      'Any disputes will be resolved in the courts of India.',
      'If any provision is found unenforceable, the remaining provisions remain in effect.',
    ],
  },
  {
    title: '10. Contact',
    items: [`For questions about these Terms, contact us at **${CONTACT_EMAIL}**.`],
  },
]

export default function TermsPage() {
  return <LegalPage title="Terms of Service" subtitle="Last updated: April 2026. Please read these terms carefully before using our platform." sections={sections} />
}

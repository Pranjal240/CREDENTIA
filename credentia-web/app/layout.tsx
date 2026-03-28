import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import Providers from '@/components/Providers'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-heading',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CREDENTIA — Verify Once, Trusted Forever',
  description:
    "India's AI-powered credential verification platform. Upload your resume, police certificate, Aadhaar and get verified in minutes. Share one link with every employer.",
  keywords:
    'credential verification, AI verification, police certificate verification, resume verification, India, student verification',
  openGraph: {
    title: 'CREDENTIA — Verify Once, Trusted Forever',
    description:
      "India's #1 AI credential verification platform for students",
    url: 'https://credentiaonline.in',
    siteName: 'CREDENTIA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CREDENTIA — Verify Once, Trusted Forever',
    description: "India's AI-powered credential verification platform",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${syne.variable} ${dmSans.variable}`}>
      <body className={`${dmSans.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

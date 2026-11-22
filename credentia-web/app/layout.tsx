import type { Metadata, Viewport } from 'next'
import { Manrope, JetBrains_Mono } from 'next/font/google'
import { AppBackground } from '@/components/shell/app-background'
import { SmoothScroll } from '@/components/shell/smooth-scroll'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://credentiaonline.in'),
  title: {
    default: 'Credentia: AI credential verification for India',
    template: '%s | Credentia',
  },
  description:
    'Verify a resume, Aadhaar, degree and police certificate once with AI, then share one trusted link with companies and universities.',
  keywords:
    'credential verification, India, student verification, police certificate, Aadhaar, resume ATS, university registry',
  openGraph: {
    title: 'Credentia',
    description: 'Verify once. Trusted everywhere.',
    url: 'https://credentiaonline.in',
    siteName: 'Credentia',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${manrope.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="bg-transparent font-sans text-foreground antialiased">
        <AppBackground />
        <SmoothScroll />
        {children}
      </body>
    </html>
  )
}

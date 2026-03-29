import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CREDENTIA — India\'s #1 Credential Verification Platform',
  description: 'AI-powered credential verification for students, companies, and universities. Verify once. Trusted forever.',
  keywords: 'credential verification, India, student verification, police certificate, Aadhaar, resume ATS, university ERP',
  openGraph: {
    title: 'CREDENTIA',
    description: 'Verify Once. Trusted Forever.',
    url: 'https://credentiaonline.in',
    siteName: 'CREDENTIA',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

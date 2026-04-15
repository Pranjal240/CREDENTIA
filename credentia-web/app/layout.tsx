import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CREDENTIA — India\'s #1 Credential Verification Platform',
  description: 'AI-powered credential verification for students, companies, and universities. Verify once. Trusted forever.',
  keywords: 'credential verification, India, student verification, police certificate, Aadhaar, resume ATS, university ERP',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/favicon.png',
  },
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

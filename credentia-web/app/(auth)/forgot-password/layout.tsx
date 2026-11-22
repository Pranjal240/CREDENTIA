import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reset your password',
  description: 'Get an email with a link to choose a new Credentia password.',
  robots: { index: false },
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}

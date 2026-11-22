import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Choose a new password',
  description: 'Set a new password for your Credentia account.',
  robots: { index: false },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'Create a free Credentia account as a student, a company or a university.',
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}

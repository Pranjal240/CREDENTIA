import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verified Profile | CREDENTIA',
  description: 'View verified credentials for this profile on CREDENTIA.',
}

import VerifyPage from './VerifyClient'

export default function Page({ params }: { params: { token: string } }) {
  return <VerifyPage token={params.token} />
}

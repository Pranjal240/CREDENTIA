'use client'

import * as React from 'react'
import { useAuthRole } from '@/hooks/use-auth-role'
import { PeonProvider } from './peon-provider'

/** Peon for the public pages. Visitors get platform help, signed in people get answers about their own data. */
export function SitePeon({ children }: { children: React.ReactNode }) {
  const { role } = useAuthRole()
  return (
    <PeonProvider signedIn={role !== null} role={role}>
      {children}
    </PeonProvider>
  )
}

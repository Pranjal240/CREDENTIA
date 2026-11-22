'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type AuthRole = 'student' | 'company' | 'university' | 'admin'

export interface AuthRoleState {
  /** True until the first session check finishes. */
  loading: boolean
  /** The signed in role, or null for a visitor. */
  role: AuthRole | null
}

/**
 * Reads the visitor's role from the database profile. The role in the JWT is
 * not trusted, so this asks the profiles table, the same way the dashboard does.
 * Used by the public header to swap "Log in" for "Dashboard".
 */
export function useAuthRole(): AuthRoleState {
  const [state, setState] = useState<AuthRoleState>({ loading: true, role: null })

  useEffect(() => {
    let alive = true
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!alive) return
        if (!session?.user) {
          setState({ loading: false, role: null })
          return
        }
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        if (!alive) return
        setState({ loading: false, role: (profile?.role as AuthRole) ?? null })
      })
      .catch(() => {
        if (alive) setState({ loading: false, role: null })
      })
    return () => {
      alive = false
    }
  }, [])

  return state
}

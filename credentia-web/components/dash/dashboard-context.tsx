'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { roleFromPath, roleHome, type DashRole } from '@/lib/dashboard-nav'

export interface DashProfile {
  id: string
  full_name?: string | null
  email?: string | null
  avatar_url?: string | null
  role?: DashRole | null
  display_name?: string | null
  [key: string]: unknown
}

export interface DashState {
  loading: boolean
  userId: string | null
  email: string | null
  profile: DashProfile | null
  /** The role the session belongs to. Falls back to the role in the URL while loading. */
  role: DashRole
  /** Company, university or student name, falling back to the profile name. */
  displayName: string
  setAvatar: (url: string) => void
  signOut: () => Promise<void>
}

const DashContext = React.createContext<DashState | null>(null)

export function useDash(): DashState {
  const ctx = React.useContext(DashContext)
  if (!ctx) throw new Error('useDash must be used inside DashboardProvider')
  return ctx
}

/** Table and name column that hold the display name for each role. */
const ENTITY: Record<DashRole, { table: string; field: string } | null> = {
  student: { table: 'students', field: 'name' },
  company: { table: 'companies', field: 'company_name' },
  university: { table: 'universities', field: 'university_name' },
  admin: null,
}

interface DashboardProviderProps {
  children: React.ReactNode
  /** Development harness only: skips the session check and uses this state as is. */
  fixture?: Pick<DashState, 'userId' | 'email' | 'profile' | 'role' | 'displayName'>
}

/**
 * Loads the signed in user once for every dashboard page: session, profile, the
 * entity name for the role, and live updates when either changes. A missing
 * profile is created through the same safety net the old layout used. A user
 * who opens another role's dashboard is sent to their own.
 */
export function DashboardProvider({ children, fixture }: DashboardProviderProps) {
  const router = useRouter()
  const pathname = usePathname() ?? ''
  const urlRole = roleFromPath(pathname)

  const [loading, setLoading] = React.useState(!fixture)
  const [userId, setUserId] = React.useState<string | null>(fixture?.userId ?? null)
  const [email, setEmail] = React.useState<string | null>(fixture?.email ?? null)
  const [profile, setProfile] = React.useState<DashProfile | null>(fixture?.profile ?? null)
  const [role, setRole] = React.useState<DashRole>(fixture?.role ?? urlRole)

  React.useEffect(() => {
    if (fixture) return
    let alive = true

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          router.replace(`/login/${urlRole}`)
          return
        }
        if (!alive) return
        const authUser = session.user
        setUserId(authUser.id)
        setEmail(authUser.email ?? null)

        // A profile failure must not log the user out. They are authenticated.
        try {
          // The profile and the name row for the role in the address are asked for together, which saves a
          // full round trip. If the profile turns out to belong to another role, that one is fetched after.
          const entityRow = (target: DashRole) => {
            const entity = ENTITY[target]
            return entity ? supabase.from(entity.table).select(entity.field).eq('id', authUser.id).single() : Promise.resolve({ data: null })
          }
          const [{ data: prof, error }, guessed] = await Promise.all([supabase.from('profiles').select('*').eq('id', authUser.id).single(), entityRow(urlRole)])
          if (!alive) return

          if (prof && !error) {
            const entity = ENTITY[prof.role as DashRole]
            let row = guessed.data as unknown as Record<string, string> | null
            if (entity && prof.role !== urlRole) {
              const { data } = await entityRow(prof.role as DashRole)
              row = data as unknown as Record<string, string> | null
            }
            const entityName = entity ? (row?.[entity.field] ?? null) : null
            if (!alive) return
            setProfile({ ...prof, display_name: entityName || prof.full_name })
            setRole(prof.role as DashRole)
          } else {
            // Profile missing: create it. Covers email and password users who skipped the callback.
            try {
              const res = await fetch('/api/ensure-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: authUser.id, portal: urlRole }),
              })
              const data = await res.json()
              if (data.profile && alive) {
                setProfile({ ...data.profile, display_name: data.profile.full_name })
                setRole((data.profile.role as DashRole) || urlRole)
              } else {
                setRole(urlRole)
              }
            } catch {
              if (alive) setRole(urlRole)
            }
          }
        } catch {
          if (alive) setRole(urlRole)
        }
      } catch (err) {
        console.error('[dashboard] auth init failed', err)
        if (alive) setRole(urlRole)
      } finally {
        if (alive) setLoading(false)
      }
    }

    init()
    return () => {
      alive = false
    }
    // The session is loaded once per dashboard visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Live updates for avatar and display name.
  React.useEffect(() => {
    if (fixture || !userId) return
    const entity = ENTITY[role]
    const profileChannel = supabase
      .channel(`dash_profile_${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload: { new?: Record<string, unknown> }) => {
          if (payload.new) {
            setProfile((prev) => (prev ? { ...prev, ...payload.new, display_name: prev.display_name || (payload.new?.full_name as string) } : (payload.new as DashProfile)))
          }
        },
      )
      .subscribe()

    const entityChannel = entity
      ? supabase
          .channel(`dash_entity_${userId}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: entity.table, filter: `id=eq.${userId}` },
            (payload: { new?: Record<string, unknown> }) => {
              const name = payload.new?.[entity.field] as string | undefined
              if (name) setProfile((prev) => (prev ? { ...prev, display_name: name } : prev))
            },
          )
          .subscribe()
      : null

    return () => {
      supabase.removeChannel(profileChannel)
      if (entityChannel) supabase.removeChannel(entityChannel)
    }
  }, [fixture, userId, role])

  // A signed in user belongs on their own role's dashboard.
  React.useEffect(() => {
    if (fixture || loading || !profile?.role) return
    if (profile.role !== urlRole) router.replace(roleHome(profile.role))
  }, [fixture, loading, profile?.role, urlRole, router])

  const setAvatar = React.useCallback((url: string) => {
    setProfile((prev) => (prev ? { ...prev, avatar_url: url } : prev))
  }, [])

  const signOut = React.useCallback(async () => {
    if (fixture) return
    await supabase.auth.signOut()
    router.push(`/login/${role}`)
    router.refresh()
  }, [fixture, role, router])

  const displayName =
    (profile?.display_name as string) || (profile?.full_name as string) || email?.split('@')[0] || 'Account'

  const value = React.useMemo<DashState>(
    () => ({ loading, userId, email, profile, role, displayName, setAvatar, signOut }),
    [loading, userId, email, profile, role, displayName, setAvatar, signOut],
  )

  return <DashContext.Provider value={value}>{children}</DashContext.Provider>
}

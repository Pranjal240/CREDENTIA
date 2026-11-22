import { NextResponse } from 'next/server'
import { getPublicStats } from '@/lib/public-stats'

// Read at request time. Without this the route is prerendered during the build, when it cannot reach the database.
export const dynamic = 'force-dynamic'

/** Public aggregate counts. Safe to cache at the edge for a minute. */
export async function GET() {
  const stats = await getPublicStats()
  if (!stats) return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}

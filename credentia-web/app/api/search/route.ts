import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { aiAvailable } from '@/lib/ai-text'
import { rateLimit } from '@/lib/rate-limit'
import { runSearch, type SearchFilters } from '@/lib/search/engine'
import { describeFilters, interpretQuery } from '@/lib/search/ai'
import { SEARCH_LABELS, SEARCH_TYPES, type SearchResponse, type SearchType } from '@/lib/search/types'
import type { DashRole } from '@/lib/dashboard-nav'

export const dynamic = 'force-dynamic'

// Keystrokes repeat the same request, so recent answers are kept for a few seconds.
const recent = new Map<string, { at: number; value: SearchResponse }>()
const RECENT_MS = 15_000

/**
 * The search behind every palette. The caller is identified from the session
 * cookie, never from the request, and the role decides which tables are
 * searched and how far. Short requests are plain database matches. Longer
 * questions are read by AI into filters, and the filters are validated before
 * they touch a query, so the model never writes SQL.
 */
export async function GET(request: Request) {
  const started = Date.now()
  const url = new URL(request.url)
  const query = (url.searchParams.get('q') ?? '').trim().slice(0, 200)

  const supabase = createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (query.length < 2) return NextResponse.json<SearchResponse>({ query, ai: null, groups: [], tookMs: 0 })

  const { data: profile } = await supabaseAdmin.from('profiles').select('role, is_active').eq('id', user.id).single()
  const role = profile?.role as DashRole | undefined
  if (!role || !(role in SEARCH_TYPES) || profile?.is_active === false) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // A university that has not been approved yet has no registry to search.
  if (role === 'university') {
    const { data: university } = await supabaseAdmin.from('universities').select('is_verified').eq('id', user.id).maybeSingle()
    if (university?.is_verified !== true) return NextResponse.json<SearchResponse>({ query, ai: null, groups: [], tookMs: Date.now() - started })
  }

  const allowed = SEARCH_TYPES[role]
  const requested = (url.searchParams.get('types') ?? '')
    .split(',')
    .map((type) => type.trim())
    .filter((type): type is SearchType => (allowed as string[]).includes(type))
  const types = requested.length ? requested : allowed
  const wantsAI = url.searchParams.get('ai') === '1'

  const cacheKey = `${user.id}|${types.join(',')}|${wantsAI ? 1 : 0}|${query.toLowerCase()}`
  const cached = recent.get(cacheKey)
  if (cached && Date.now() - cached.at < RECENT_MS) return NextResponse.json({ ...cached.value, tookMs: Date.now() - started })

  let text = query
  let filters: SearchFilters = {}
  let interpreted = false
  if (wantsAI && aiAvailable() && rateLimit(`search-ai:${user.id}`, 20, 60_000)) {
    try {
      const reading = await interpretQuery(query, role)
      text = reading.text
      filters = reading.filters
      interpreted = true
    } catch {
      // The AI is slow or down, so the request is searched as plain words instead.
    }
  }

  const limit = types.length === 1 ? 12 : 5
  const results = await runSearch({ userId: user.id, role }, types, text, filters, limit)

  const total = results.reduce((sum, group) => sum + group.hits.length, 0)
  const phrases = interpreted ? describeFilters(filters, text) : []
  const response: SearchResponse = {
    query,
    ai:
      phrases.length > 0
        ? { summary: `${total} ${total === 1 ? 'match' : 'matches'} for ${phrases.join(', ')}.` }
        : null,
    groups: results.filter((group) => group.hits.length > 0).map((group) => ({ type: group.type, label: SEARCH_LABELS[group.type], hits: group.hits })),
    tookMs: Date.now() - started,
  }

  recent.set(cacheKey, { at: Date.now(), value: response })
  if (recent.size > 400) recent.delete(recent.keys().next().value as string)

  return NextResponse.json(response)
}

import { NextResponse } from 'next/server'
import { clientAddress, getCaller } from '@/lib/api-auth'
import { rateLimit } from '@/lib/rate-limit'
import { aiAvailable } from '@/lib/ai-text'
import { runPeon } from '@/lib/peon/agent'
import type { ChatTurn, PeonEvent } from '@/lib/peon/events'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const MAX_TURNS = 16
const MAX_CHARS = 2000

/** Keeps only well formed turns, trims them, and makes sure the last one is from the person. */
function cleanHistory(input: unknown): ChatTurn[] {
  if (!Array.isArray(input)) return []
  const turns = input
    .filter((turn): turn is { role: 'user' | 'assistant'; content: string } => !!turn && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string')
    .map((turn) => ({ role: turn.role, content: turn.content.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, MAX_CHARS) }))
    .filter((turn) => turn.content.length > 0)
    .slice(-MAX_TURNS)
  while (turns.length && turns[turns.length - 1].role !== 'user') turns.pop()
  return turns
}

/**
 * Peon. Streams one answer as newline separated JSON events: reasoning, tool
 * calls and their results, answer text, citations, and a final done or error.
 * Signed in people get tools scoped to their own role. Visitors get the
 * platform help topics only. Nothing is stored on the server.
 */
export async function POST(request: Request) {
  if (!aiAvailable()) return NextResponse.json({ error: 'Peon is not configured on this server.' }, { status: 503 })

  const caller = await getCaller()
  const key = caller ? `peon:${caller.userId}` : `peon:ip:${clientAddress(request)}`
  if (!rateLimit(key, caller ? 20 : 8, 60_000)) {
    return NextResponse.json({ error: 'Too many messages in a short time. Wait a moment and try again.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const history = cleanHistory(body?.messages)
  if (history.length === 0) return NextResponse.json({ error: 'Send a message to begin.' }, { status: 400 })
  const page = typeof body?.page === 'string' ? body.page.slice(0, 120) : ''

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: PeonEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
        } catch {
          // The reader has gone away.
        }
      }
      try {
        for await (const event of runPeon({ caller, history, page, signal: request.signal })) send(event)
      } catch (error) {
        console.error('[peon] unexpected failure:', (error as Error).message)
        send({ type: 'error', message: 'Peon hit a problem. Please try again.' })
      } finally {
        try {
          controller.close()
        } catch {
          // already closed
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}

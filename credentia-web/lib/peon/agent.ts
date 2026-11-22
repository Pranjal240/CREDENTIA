import { GEMINI_FAST_MODELS, GROQ_TEXT_MODEL, groqExtras } from '@/lib/ai-config'
import type { Caller } from '@/lib/api-auth'
import { TOOLS, toolSchemas, type ToolContext } from './tools'
import type { ChatTurn, PeonEvent, PeonSource } from './events'

type Json = Record<string, any>

const MAX_ROUNDS = 4
const RESULT_LIMIT = 6000

const ROLE_BRIEF: Record<string, string> = {
  guest: 'A visitor who is not signed in. Explain the platform. You cannot see anyone\'s data. For anything personal, suggest signing in or creating an account.',
  student: 'A student. They upload documents, follow verification results, share a verified profile and apply to companies.',
  company: 'A hiring company. They search verified students, save candidates and review applicants.',
  university: 'A university. They see their linked students and how far each one has got with verification.',
  admin: 'A platform admin. They review documents, approve universities and companies, read audit logs and answer support.',
}

function systemPrompt(caller: Caller | null, page: string): string {
  const role = caller?.role ?? 'guest'
  const firstName = caller?.name?.trim().split(/\s+/)[0]
  return `You are Peon, the assistant inside Credentia, an AI credential verification platform for India. Be warm, direct and brief. Use plain sentences. Short lists only when they really help. No headings, no tables, no bold markers.

Rules:
- Never use em dashes, en dashes or double hyphens. Use commas and full stops instead.
- You only help with Credentia and with the signed in person's own data. You cannot see anyone else's private information and you must not guess it.
- Answer from tool results. Never invent numbers, statuses, names or features. If the tools do not give the answer, say so plainly and offer to send the conversation to the support team with request_human_support.
- You can only read and explain. You cannot change anything. To fix something, point to the page and the action that does it.
- When a tool result carries a marker such as [2], put that marker right after the sentence it supports.
- Say that AI results are assessments, not legal certifications, only when someone asks whether a result is official.
- Keep answers under about 120 words unless the person asks for detail.

Who you are talking to: ${ROLE_BRIEF[role]}${firstName ? ` Their first name is ${firstName}.` : ''}
Page they are on: ${page || 'unknown'}
Today: ${new Date().toDateString()}`
}

/** Hands out citation numbers while an answer is built. */
class SourceBook {
  items: PeonSource[] = []
  cite = (title: string, url?: string): number => {
    const found = this.items.find((item) => item.title === title && item.url === url)
    if (found) return found.index
    const index = this.items.length + 1
    this.items.push({ id: `s${index}`, index, title, url })
    return index
  }
}

interface PendingCall {
  id: string
  name: string
  args: string
}

type GroqPart =
  | { kind: 'reasoning'; text: string }
  | { kind: 'content'; text: string }
  | { kind: 'end'; calls: PendingCall[]; finish: string | null }

/** One streamed completion from Groq. Reasoning and answer text arrive as they are produced. */
async function* streamGroq(messages: Json[], tools: Json[], signal: AbortSignal): AsyncGenerator<GroqPart> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('Groq is not configured')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_TEXT_MODEL,
      stream: true,
      temperature: 0.3,
      max_tokens: 1400,
      messages,
      ...(tools.length ? { tools, tool_choice: 'auto' } : {}),
      ...groqExtras(GROQ_TEXT_MODEL),
    }),
    signal: AbortSignal.any([signal, AbortSignal.timeout(40_000)]),
  })
  if (!res.ok || !res.body) throw new Error(`Groq returned ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  const calls = new Map<number, PendingCall>()
  let buffer = ''
  let finish: string | null = null

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let newline: number
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim()
      buffer = buffer.slice(newline + 1)
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (!payload || payload === '[DONE]') continue

      let json: Json
      try {
        json = JSON.parse(payload)
      } catch {
        continue
      }
      if (json.error) throw new Error(json.error.message || 'The model returned an error')

      const choice = json.choices?.[0]
      const delta = choice?.delta ?? {}
      if (typeof delta.reasoning === 'string' && delta.reasoning) yield { kind: 'reasoning', text: delta.reasoning }
      if (typeof delta.content === 'string' && delta.content) yield { kind: 'content', text: delta.content }
      for (const call of delta.tool_calls ?? []) {
        const index = call.index ?? 0
        const current = calls.get(index) ?? { id: '', name: '', args: '' }
        if (call.id) current.id = call.id
        if (call.function?.name) current.name = call.function.name
        if (call.function?.arguments) current.args += call.function.arguments
        calls.set(index, current)
      }
      if (choice?.finish_reason) finish = choice.finish_reason
    }
  }

  yield { kind: 'end', calls: Array.from(calls.values()), finish }
}

async function runTool(call: PendingCall, ctx: ToolContext) {
  const tool = TOOLS.find((candidate) => candidate.name === call.name)
  const allowed = tool?.roles.includes(ctx.caller?.role ?? 'guest')
  if (!tool || !allowed) return { ok: false as const, summary: 'Not available', data: { error: 'That tool is not available to this person.' } }

  let args: Json = {}
  try {
    args = JSON.parse(call.args || '{}')
  } catch {
    // A malformed argument string is treated as no arguments.
  }

  try {
    const outcome = await tool.run(args, ctx)
    return { ok: true as const, summary: outcome.summary, data: outcome.data, handoff: outcome.handoff, args }
  } catch (error) {
    console.error(`[peon] ${call.name} failed:`, (error as Error).message)
    return { ok: false as const, summary: 'The lookup failed', data: { error: 'The lookup failed. Say so and offer human support.' }, args }
  }
}

const preview = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2).slice(0, 1500)
  } catch {
    return undefined
  }
}

/**
 * Backup when Groq cannot start an answer. The read only tools that answer most
 * questions are run first, shown as real tool calls, and Gemini writes the reply
 * from their results. It does not call tools by itself.
 */
async function* fallbackGemini(caller: Caller | null, history: ChatTurn[], page: string, ctx: ToolContext, signal: AbortSignal): AsyncGenerator<PeonEvent> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Gemini is not configured')

  const question = [...history].reverse().find((turn) => turn.role === 'user')?.content ?? ''
  const plan: Array<{ name: string; args: Json }> = []
  if (caller) {
    plan.push({ name: 'get_account_summary', args: {} })
    if (caller.role === 'student') plan.push({ name: 'list_documents', args: {} })
    if (caller.role === 'admin') plan.push({ name: 'get_platform_stats', args: {} })
  }
  plan.push({ name: 'get_help_topic', args: { question } })

  const gathered: string[] = []
  for (const [i, step] of plan.entries()) {
    const id = `fallback-${i}`
    yield { type: 'tool_call', id, name: step.name, args: step.args }
    const result = await runTool({ id, name: step.name, args: JSON.stringify(step.args) }, ctx)
    yield { type: 'tool_result', id, status: result.ok ? 'success' : 'error', summary: result.summary, result: preview(result.data) }
    gathered.push(`${step.name}: ${JSON.stringify(result.data).slice(0, RESULT_LIMIT)}`)
  }

  const contents = history.map((turn) => ({ role: turn.role === 'assistant' ? 'model' : 'user', parts: [{ text: turn.content }] }))
  let failure = 'Gemini is unavailable'

  for (const model of GEMINI_FAST_MODELS) {
    for (const withThinking of [true, false]) {
      const generationConfig: Json = { temperature: 0.3, maxOutputTokens: 900 }
      if (withThinking) generationConfig.thinkingConfig = { thinkingLevel: 'minimal' }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: `${systemPrompt(caller, page)}\n\nLookups already done for this question:\n${gathered.join('\n')}` }] },
          contents,
          generationConfig,
        }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(25_000)]),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        failure = `Gemini ${model} returned ${res.status}`
        if (res.status === 400 && withThinking && /thinking/i.test(detail)) continue
        break
      }

      const data = (await res.json()) as Json
      const answer: string = data?.candidates?.[0]?.content?.parts?.find((part: Json) => typeof part.text === 'string' && !part.thought)?.text ?? ''
      if (!answer.trim()) {
        failure = `Gemini ${model} returned nothing`
        break
      }
      yield { type: 'token', text: answer.trim() }
      return
    }
  }
  throw new Error(failure)
}

export interface RunOptions {
  caller: Caller | null
  history: ChatTurn[]
  page: string
  signal: AbortSignal
}

/** Runs one answer: Groq with tools, streaming, and Gemini as the backup. */
export async function* runPeon({ caller, history, page, signal }: RunOptions): AsyncGenerator<PeonEvent> {
  const started = Date.now()
  const role = caller?.role ?? 'guest'
  const book = new SourceBook()
  const ctx: ToolContext = { caller, cite: book.cite }
  const tools = toolSchemas(role)
  const messages: Json[] = [{ role: 'system', content: systemPrompt(caller, page) }, ...history]
  let spoke = false
  let provider = 'groq'

  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      let content = ''
      let calls: PendingCall[] = []

      for await (const part of streamGroq(messages, tools, signal)) {
        if (part.kind === 'reasoning') {
          spoke = true
          yield { type: 'reasoning', text: part.text }
        } else if (part.kind === 'content') {
          spoke = true
          content += part.text
          yield { type: 'token', text: part.text }
        } else {
          calls = part.calls.filter((call) => call.name)
        }
      }

      if (calls.length === 0) break

      // Text spoken before a lookup stays apart from the answer that follows it.
      if (content) yield { type: 'token', text: '\n\n' }

      messages.push({
        role: 'assistant',
        content: content || null,
        tool_calls: calls.map((call) => ({ id: call.id, type: 'function', function: { name: call.name, arguments: call.args || '{}' } })),
      })

      for (const call of calls) {
        let args: unknown = {}
        try {
          args = JSON.parse(call.args || '{}')
        } catch {
          // shown as empty arguments
        }
        yield { type: 'tool_call', id: call.id, name: call.name, args }
      }

      const results = await Promise.all(calls.map((call) => runTool(call, ctx)))
      for (const [i, call] of calls.entries()) {
        const result = results[i]
        yield { type: 'tool_result', id: call.id, status: result.ok ? 'success' : 'error', summary: result.summary, result: preview(result.data) }
        if (result.ok && result.handoff) yield { type: 'handoff', subject: result.handoff.subject, summary: result.handoff.summary }
        messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result.data).slice(0, RESULT_LIMIT) })
      }
    }
  } catch (error) {
    if (signal.aborted) return
    console.error('[peon] Groq failed:', (error as Error).message)

    // Once words have reached the screen a second provider would repeat itself, so stop there.
    if (spoke) {
      yield { type: 'error', message: 'Peon stopped before finishing. Ask again and it will start over.' }
      return
    }
    try {
      provider = 'gemini'
      yield* fallbackGemini(caller, history, page, ctx, signal)
    } catch (fallbackError) {
      console.error('[peon] Gemini failed:', (fallbackError as Error).message)
      yield { type: 'error', message: 'Peon cannot answer right now. You can still send your question to the support team.' }
      return
    }
  }

  if (book.items.length) yield { type: 'citations', items: book.items }
  yield { type: 'done', provider, ms: Date.now() - started }
}

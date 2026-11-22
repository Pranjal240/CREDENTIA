/**
 * Plain text and JSON generation for features that are not document analysis,
 * such as understanding a search request. Groq answers first because it is
 * fast enough to feel instant, and Gemini is the backup. Document analysis
 * works the other way round, see lib/groq.ts.
 *
 * Keys are read from the server environment and never logged. Error messages
 * carry only a status code.
 */

import { GEMINI_FAST_MODELS, GROQ_TEXT_MODEL, groqExtras } from '@/lib/ai-config'

export type AIProvider = 'gemini' | 'groq'

export const aiAvailable = () => Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY)

export interface JSONRequest {
  system: string
  user: string
  maxTokens?: number
  timeoutMs?: number
  /** Which provider to ask first. Defaults to Groq, the faster one. */
  prefer?: AIProvider
}

function parseJSON(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('The model did not return JSON')
  }
}

async function geminiJSON({ system, user, maxTokens = 400, timeoutMs = 4000 }: JSONRequest): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Gemini is not configured')

  let failure = 'Gemini is unavailable'
  for (const model of GEMINI_FAST_MODELS) {
    for (const withThinking of [true, false]) {
      const generationConfig: Record<string, unknown> = { temperature: 0, maxOutputTokens: maxTokens, responseMimeType: 'application/json' }
      if (withThinking) generationConfig.thinkingConfig = { thinkingLevel: 'minimal' }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      })

      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        failure = `Gemini ${model} returned ${res.status}`
        // A thinking level the model does not accept is asked again without it.
        if (res.status === 400 && withThinking && /thinking/i.test(detail)) continue
        break
      }

      const data = await res.json()
      const text: string = data?.candidates?.[0]?.content?.parts?.find((part: { text?: string; thought?: boolean }) => typeof part.text === 'string' && !part.thought)?.text ?? ''
      if (!text.trim()) {
        failure = `Gemini ${model} returned nothing`
        break
      }
      return parseJSON(text)
    }
  }
  throw new Error(failure)
}

async function groqJSON({ system, user, maxTokens = 400, timeoutMs = 4000 }: JSONRequest): Promise<unknown> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('Groq is not configured')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_TEXT_MODEL,
      temperature: 0,
      // Reasoning models count their thinking against this limit.
      max_tokens: maxTokens + 600,
      response_format: { type: 'json_object' },
      ...groqExtras(GROQ_TEXT_MODEL),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) throw new Error(`Groq returned ${res.status}`)

  const data = await res.json()
  const text: string = data?.choices?.[0]?.message?.content ?? ''
  if (!text.trim()) throw new Error('Groq returned nothing')
  return parseJSON(text)
}

/** Asks for a JSON object. Tries the preferred provider, then the other. Throws when neither answers in time. */
export async function generateJSON<T = unknown>(request: JSONRequest): Promise<{ data: T; provider: AIProvider }> {
  const order: AIProvider[] = request.prefer === 'gemini' ? ['gemini', 'groq'] : ['groq', 'gemini']
  const failures: string[] = []

  for (const provider of order) {
    if (provider === 'gemini' && !process.env.GEMINI_API_KEY) continue
    if (provider === 'groq' && !process.env.GROQ_API_KEY) continue
    try {
      const data = provider === 'gemini' ? await geminiJSON(request) : await groqJSON(request)
      return { data: data as T, provider }
    } catch (error) {
      failures.push((error as Error).message)
    }
  }
  throw new Error(failures.join('; ') || 'No AI provider is configured')
}

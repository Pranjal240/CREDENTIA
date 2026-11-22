/**
 * Model names for every AI call. Providers retire models without much notice,
 * so each list can be replaced from the environment without a code change.
 *
 * Checked against the live model lists on 20 Nov 2026: gemini-2.0-flash,
 * gemini-2.5-flash and llama-3.3-70b-versatile no longer answer.
 */

const list = (value: string | undefined, fallback: string) =>
  (value || fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

/** Document reading and anything that needs an image. Tried in order. */
export const GEMINI_MODELS = list(process.env.GEMINI_MODELS, 'gemini-3.5-flash,gemini-3.1-flash-lite')

/** Short text tasks such as understanding a search request. Tried in order. */
export const GEMINI_FAST_MODELS = list(process.env.GEMINI_FAST_MODELS, 'gemini-3.1-flash-lite,gemini-3.5-flash')

/** Text only, and very fast. Used for search, chat and as the backup for documents that are text. */
export const GROQ_TEXT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'

/** Groq has no image model at the moment. Set this to use one when it returns. */
export const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || ''

/** gpt-oss models spend tokens thinking. A low effort keeps answers fast and leaves room for the JSON. */
export const groqExtras = (model: string): Record<string, unknown> => (model.includes('gpt-oss') ? { reasoning_effort: 'low' } : {})

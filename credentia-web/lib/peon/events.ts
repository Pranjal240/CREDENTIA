/** What the Peon endpoint streams, one JSON object per line. Shared by the server and the chat panel. */

export interface PeonSource {
  id: string
  /** The number used in the answer as [n]. */
  index: number
  title: string
  url?: string
}

export type PeonEvent =
  | { type: 'reasoning'; text: string }
  | { type: 'tool_call'; id: string; name: string; args: unknown }
  | { type: 'tool_result'; id: string; status: 'success' | 'error'; summary: string; result?: string }
  | { type: 'token'; text: string }
  | { type: 'citations'; items: PeonSource[] }
  | { type: 'handoff'; subject: string; summary: string }
  | { type: 'done'; provider: string; ms: number }
  | { type: 'error'; message: string }

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

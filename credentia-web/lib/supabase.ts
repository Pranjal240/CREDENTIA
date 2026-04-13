import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Browser client — uses @supabase/ssr (PKCE flow, cookies for storage).
// The code_verifier for PKCE is stored in cookies automatically.
export const supabase = url && anon
  ? createBrowserClient(url, anon)
  : createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false },
    })

// Server-side admin supabase — uses service role key, no session persistence
export const supabaseAdmin = url && service
  ? createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (fetchUrl, options) => fetch(fetchUrl, { ...options, cache: 'no-store' }),
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false },
    })

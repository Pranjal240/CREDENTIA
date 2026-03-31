import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Browser client — uses @supabase/ssr with IMPLICIT flow.
// We switched from PKCE to implicit because the PKCE code_verifier cookie
// was not surviving the redirect cycle in production (Vercel + Next.js).
// Implicit flow puts the token in the URL hash — no server-side exchange needed.
export const supabase = url && anon
  ? createBrowserClient(url, anon, {
      auth: {
        flowType: 'implicit',
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false },
    })

// Server-side admin supabase — uses service role key, no session persistence
export const supabaseAdmin = url && service
  ? createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false },
    })

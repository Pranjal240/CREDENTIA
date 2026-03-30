import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Browser client — uses @supabase/ssr so PKCE code verifier + session are
// stored in COOKIES (not localStorage). This is critical: the server-side
// auth callback reads cookies to find the PKCE verifier during code exchange.
export const supabase = url && anon
  ? createBrowserClient(url, anon)
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

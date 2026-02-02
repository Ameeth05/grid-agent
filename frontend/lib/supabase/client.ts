import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Local development mode - bypass Supabase
const LOCAL_DEV = process.env.NEXT_PUBLIC_LOCAL_DEV === 'true'

export function createClient(): SupabaseClient | null {
  // LOCAL_DEV: Return null, callers should check for this
  if (LOCAL_DEV) {
    return null as unknown as SupabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not set')
    return null as unknown as SupabaseClient
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

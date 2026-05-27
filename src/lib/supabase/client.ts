import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/../types/supabase'
import { clientEnv } from '@/lib/env/client'

export function createClient() {
  const url = clientEnv.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase client env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local'
    )
  }
  return createBrowserClient<Database>(url, anonKey)
}

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/../types/supabase'
import { clientEnv } from '@/lib/env/client'

export function createClient() {
  if (!clientEnv) throw new Error('Client env not initialized')
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

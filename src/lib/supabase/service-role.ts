import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/../types/supabase'
import { clientEnv } from '@/lib/env/client'
import { serverEnv } from '@/lib/env/server'

export async function createServiceRoleClient() {
  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op for service role - no cookies needed
        },
      },
    }
  )
}
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/../types/supabase'

export async function createServiceRoleClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
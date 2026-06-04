import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function createAdminClient() {
  return createServiceRoleClient()
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { replayDeadLetterNotification } from '@/lib/notifications/admin'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'

export async function replayDeadLetterAction(dlqId: string) {
  const supabase = await createClient()

  const access = await requireCurrentOrganization(['owner', 'admin'])
  if (!access.success) throw new Error(access.error)

  const serviceRole = await createServiceRoleClient()
  return replayDeadLetterNotification(serviceRole, dlqId)
}

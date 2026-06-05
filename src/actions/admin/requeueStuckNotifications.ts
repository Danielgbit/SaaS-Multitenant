'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { requeueStuckNotification } from '@/lib/notifications/admin'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'

export async function requeueStuckNotificationAction(queueItemId: string) {
  const supabase = await createClient()

  const access = await requireCurrentOrganization(['owner', 'admin'])
  if (!access.success) throw new Error(access.error)

  const serviceRole = await createServiceRoleClient()
  return requeueStuckNotification(serviceRole, queueItemId)
}

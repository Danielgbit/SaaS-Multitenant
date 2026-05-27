'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { replayDeadLetterNotification } from '@/lib/notifications/admin'

export async function replayDeadLetterAction(dlqId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember || !['owner', 'admin'].includes(orgMember.role)) {
    throw new Error('Not authorized')
  }

  const serviceRole = await createServiceRoleClient()
  return replayDeadLetterNotification(serviceRole, dlqId)
}

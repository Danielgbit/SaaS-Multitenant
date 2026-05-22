'use server'

import { createClient } from '@/lib/supabase/server'

export async function isV2EnabledForOrg(organizationId: string): Promise<boolean> {
  const supabase = await createClient()

  try {
    const { data } = await (supabase as any)
      .from('booking_settings')
      .select('use_notification_v2')
      .eq('organization_id', organizationId)
      .single()

    return data?.use_notification_v2 === true
  } catch {
    return false
  }
}

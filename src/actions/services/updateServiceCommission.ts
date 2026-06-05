'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'

export async function updateServiceCommission(
  serviceId: string,
  hasCommission: boolean
): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const access = await requireCurrentOrganization()
  if (!access.success) return access

  const { error } = await supabase
    .from('services')
    .update({ has_commission: hasCommission })
    .eq('id', serviceId)
    .eq('organization_id', access.context.organizationId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/services')

  return { success: true }
}

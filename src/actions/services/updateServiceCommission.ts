'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateServiceCommission(
  serviceId: string,
  hasCommission: boolean
): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) {
    return { success: false, error: 'No se encontró organización' }
  }

  const { error } = await (supabase as any)
    .from('services')
    .update({ has_commission: hasCommission })
    .eq('id', serviceId)
    .eq('organization_id', orgMember.organization_id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/services')

  return { success: true }
}

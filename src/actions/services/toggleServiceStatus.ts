'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'

export async function toggleServiceStatus(serviceId: string, newState: boolean) {
  try {
    const supabase = await createClient()

    // 1. Obtener usuario actual
    const access = await requireCurrentOrganization()
    if (!access.success) return { error: access.error }

    const { error: updateError } = await supabase
      .from('services')
      .update({ active: newState })
      .eq('id', serviceId)
      .eq('organization_id', access.context.organizationId)

    if (updateError) {
      console.error('Error toggling service status:', updateError)
      return { error: 'Ocurrió un error al cambiar el estado del servicio.' }
    }

    revalidatePath('/services')
    revalidatePath('/calendar')

    return { error: null }
  } catch (error) {
    console.error('Action error:', error)
    return { error: 'Error interno del servidor.' }
  }
}

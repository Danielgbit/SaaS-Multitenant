'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleServiceStatus(serviceId: string, newState: boolean) {
  try {
    const supabase = await createClient()

    // 1. Obtener usuario actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'No autorizado. Inicia sesión nuevamente.' }
    }

    // 2. Obtener organización
    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !orgMember) {
      return { error: 'No se encontró tu organización.' }
    }

    // 3. Actualizar estado
    const { error: updateError } = await supabase
      .from('services')
      .update({ active: newState })
      .eq('id', serviceId)
      .eq('organization_id', orgMember.organization_id)

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

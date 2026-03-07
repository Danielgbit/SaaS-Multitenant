'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { UpdateServiceInput } from '@/types/services'

export async function updateService(input: UpdateServiceInput) {
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

    // 2. Obtener organización del usuario
    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !orgMember) {
      return { error: 'No se encontró tu organización.' }
    }

    // 3. Actualizar asegurando que el servicio pertenece a la organización
    const { error: updateError } = await supabase
      .from('services')
      .update({
        name: input.name.trim(),
        duration: input.duration,
        price: input.price,
      })
      .eq('id', input.id)
      .eq('organization_id', orgMember.organization_id) // Seguridad RLS reforzada

    if (updateError) {
      console.error('Error updating service:', updateError)
      return { error: 'Ocurrió un error al actualizar el servicio.' }
    }

    // 4. Revalidar
    revalidatePath('/services')

    return { error: null }
  } catch (error) {
    console.error('Action error:', error)
    return { error: 'Error interno del servidor.' }
  }
}

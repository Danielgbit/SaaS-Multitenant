'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateServiceInput } from '@/types/services'

export async function createService(input: CreateServiceInput) {
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

    // 2. Obtener la organización del usuario
    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !orgMember) {
      return { error: 'No se encontró tu organización.' }
    }

    // 3. Insertar el nuevo servicio
    const { error: insertError } = await supabase.from('services').insert({
      organization_id: orgMember.organization_id,
      name: input.name.trim(),
      duration: input.duration,
      price: input.price,
      active: true,
    })

    if (insertError) {
      console.error('Error creating service:', insertError)
      return { error: 'Ocurrió un error al crear el servicio.' }
    }

    // 4. Revalidar UI (incluye services y calendar)
    revalidatePath('/services')
    revalidatePath('/calendar')

    return { error: null }
  } catch (error) {
    console.error('Action error:', error)
    return { error: 'Error interno del servidor.' }
  }
}

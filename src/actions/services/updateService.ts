'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { UpdateServiceSchema } from '@/schemas/services/service.schema'

export async function updateService(input: { id: string; name: string; duration: number; price: number }) {
  try {
    const parsed = UpdateServiceSchema.safeParse(input)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'No autorizado. Inicia sesión nuevamente.' }
    }

    const { data: orgMember, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (orgError || !orgMember) {
      return { error: 'No se encontró tu organización.' }
    }

    const { error: updateError } = await supabase
      .from('services')
      .update({
        name: parsed.data.name,
        duration: parsed.data.duration,
        price: parsed.data.price,
      })
      .eq('id', parsed.data.id)
      .eq('organization_id', orgMember.organization_id)

    if (updateError) {
      return { error: 'Ocurrió un error al actualizar el servicio.' }
    }

    revalidatePath('/services')

    return { error: null }
  } catch (error) {
    console.error('Action error:', error)
    return { error: 'Error interno del servidor.' }
  }
}

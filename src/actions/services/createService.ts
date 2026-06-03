'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { CreateServiceSchema } from '@/schemas/services/service.schema'

export async function createService(input: { name: string; duration: number; price: number }) {
  try {
    const parsed = CreateServiceSchema.safeParse(input)
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

    const { data: newService, error: insertError } = await supabase.from('services').insert({
      organization_id: orgMember.organization_id,
      name: parsed.data.name,
      duration: parsed.data.duration,
      price: parsed.data.price,
      active: true,
    }).select('id').single()

    if (insertError) {
      return { error: 'Ocurrió un error al crear el servicio.' }
    }

    revalidatePath('/services')
    revalidatePath('/calendar')

    return { error: null, serviceId: newService?.id }
  } catch (error) {
    console.error('Action error:', error)
    return { error: 'Error interno del servidor.' }
  }
}

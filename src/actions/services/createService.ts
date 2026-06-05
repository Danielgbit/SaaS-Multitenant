'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { CreateServiceSchema } from '@/schemas/services/service.schema'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'

export async function createService(input: { name: string; duration: number; price: number }) {
  try {
    const parsed = CreateServiceSchema.safeParse(input)
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
    }

    const supabase = await createClient()

    const access = await requireCurrentOrganization()
    if (!access.success) return { error: access.error }

    const { data: newService, error: insertError } = await supabase.from('services').insert({
      organization_id: access.context.organizationId,
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

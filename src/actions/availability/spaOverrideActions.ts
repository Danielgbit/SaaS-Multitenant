'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

const SpaOverrideInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_day_off: z.boolean(),
  start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable(),
  end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).nullable(),
  reason: z.string().max(255).nullable(),
})

export async function createSpaOverride(
  organizationId: string,
  input: z.infer<typeof SpaOverrideInputSchema>
): Promise<{ success: boolean; error?: string; data?: any }> {
  const supabase = await createClient()

  const access = await requireOrgAccess(organizationId, ['owner', 'admin', 'assistant'])
  if (!access.success) return access

  const validation = SpaOverrideInputSchema.safeParse(input)
  if (!validation.success) {
    return { success: false, error: 'Datos inválidos' }
  }

  const { data, error } = await supabase
    .from('spa_availability_overrides')
    .insert({
      organization_id: organizationId,
      ...validation.data,
      created_by: access.context.userId,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un override para esta fecha' }
    }
    console.error('Error creating spa override:', error.message)
    return { success: false, error: 'No se pudo crear el override' }
  }

  revalidatePath('/horarios')
  revalidatePath('/calendar')

  return { success: true, data }
}

export async function deleteSpaOverride(overrideId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: override } = await supabase
    .from('spa_availability_overrides')
    .select('organization_id')
    .eq('id', overrideId)
    .single()

  if (!override) return { success: false, error: 'Override no encontrado' }

  const access = await requireOrgAccess(override.organization_id, ['owner', 'admin', 'assistant'])
  if (!access.success) return access

  const { error } = await supabase
    .from('spa_availability_overrides')
    .delete()
    .eq('id', overrideId)

  if (error) {
    return { success: false, error: 'No se pudo eliminar el override' }
  }

  revalidatePath('/horarios')
  revalidatePath('/calendar')

  return { success: true }
}
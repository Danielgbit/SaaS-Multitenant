'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateEmployeeServiceSchema = z.object({
  employeeId: z.string().uuid(),
  serviceId: z.string().uuid(),
  enabled: z.boolean(),
  durationOverride: z.number().min(0).optional(),
  priceOverride: z.number().min(0).optional(),
})

export async function updateEmployeeService(
  input: z.infer<typeof UpdateEmployeeServiceSchema>
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const validation = UpdateEmployeeServiceSchema.safeParse(input)
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message }
  }

  const { employeeId, serviceId, enabled, durationOverride, priceOverride } = validation.data

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No se encontró organización.' }
  }

  if (enabled) {
    const { data: existing } = await supabase
      .from('employee_services')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('service_id', serviceId)
      .single()

    if (existing) {
      const { error: updateError } = await supabase
        .from('employee_services')
        .update({
          duration_override: durationOverride || null,
          price_override: priceOverride || null,
        })
        .eq('employee_id', employeeId)
        .eq('service_id', serviceId)

      if (updateError) {
        return { error: 'No se pudo actualizar el servicio.' }
      }
    } else {
      const { error: insertError } = await supabase
        .from('employee_services')
        .insert({
          employee_id: employeeId,
          service_id: serviceId,
          duration_override: durationOverride || null,
          price_override: priceOverride || null,
        })

      if (insertError) {
        return { error: 'No se pudo agregar el servicio.' }
      }
    }
  } else {
    const { error: deleteError } = await supabase
      .from('employee_services')
      .delete()
      .eq('employee_id', employeeId)
      .eq('service_id', serviceId)

    if (deleteError) {
      return { error: 'No se pudo eliminar el servicio.' }
    }
  }

  revalidatePath('/employees')
  return { success: true }
}

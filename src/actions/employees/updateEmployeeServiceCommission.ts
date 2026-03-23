'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UpdateEmployeeServiceInput } from '@/types/services'

export async function updateEmployeeServiceCommission(
  input: UpdateEmployeeServiceInput
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

  const updateData: Record<string, any> = {}

  if (input.duration_override !== undefined) {
    updateData.duration_override = input.duration_override
  }
  if (input.price_override !== undefined) {
    updateData.price_override = input.price_override
  }
  if (input.commission_rate !== undefined) {
    updateData.commission_rate = input.commission_rate
  }

  const { data: existing } = await (supabase as any)
    .from('employee_services')
    .select('id')
    .eq('employee_id', input.employee_id)
    .eq('service_id', input.service_id)
    .single()

  if (existing) {
    const { error } = await (supabase as any)
      .from('employee_services')
      .update(updateData)
      .eq('employee_id', input.employee_id)
      .eq('service_id', input.service_id)

    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    const { error } = await (supabase as any)
      .from('employee_services')
      .insert({
        employee_id: input.employee_id,
        service_id: input.service_id,
        ...updateData,
      })

    if (error) {
      return { success: false, error: error.message }
    }
  }

  revalidatePath('/employees')
  revalidatePath(`/employees/${input.employee_id}`)
  revalidatePath('/payroll')

  return { success: true }
}

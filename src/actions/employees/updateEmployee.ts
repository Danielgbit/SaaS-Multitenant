'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { UpdateEmployeeInput } from '@/types/employees'

/**
 * Server Action: Actualiza nombre y teléfono de un empleado.
 * Verifica que el empleado pertenezca a la organización del usuario autenticado.
 */
export async function updateEmployee(
  input: UpdateEmployeeInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

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

  const name = input.name?.trim()
  if (!name) {
    return { error: 'El nombre es requerido.' }
  }

  // Actualizar solo si el empleado pertenece a la misma organización
  const { error: updateError } = await supabase
    .from('employees')
    .update({
      name,
      phone: input.phone?.trim() || null,
    })
    .eq('id', input.id)
    .eq('organization_id', orgMember.organization_id)

  if (updateError) {
    console.error('Error al actualizar empleado:', updateError.message)
    return { error: 'No se pudo actualizar el empleado.' }
  }

  revalidatePath('/employees')
  return {}
}

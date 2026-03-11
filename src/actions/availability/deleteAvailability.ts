'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Action: Elimina un registro de disponibilidad de un empleado.
 */
export async function deleteAvailability(
  availabilityId: string,
  employeeId: string
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  // 1. Verificar usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  // 2. Verificar que el empleado pertenece a la organización del usuario
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No se encontró organización para este usuario.' }
  }

  // Verificar que el empleado pertenece a la organización
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, organization_id')
    .eq('id', employeeId)
    .eq('organization_id', orgMember.organization_id)
    .single()

  if (empError || !employee) {
    return { error: 'El empleado no pertenece a tu organización.' }
  }

  // 3. Eliminar el registro de disponibilidad
  const { error: deleteError } = await supabase
    .from('employee_availability')
    .delete()
    .eq('id', availabilityId)
    .eq('employee_id', employeeId)

  if (deleteError) {
    console.error('Error al eliminar disponibilidad:', deleteError.message)
    return { error: 'No se pudo eliminar la disponibilidad. Intenta de nuevo.' }
  }

  revalidatePath(`/employees/${employeeId}/availability`)
  return { success: true }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Action: Activa o desactiva un empleado.
 * Los empleados nunca se borran — solo se desactivan (active = false).
 */
export async function toggleEmployeeStatus(
  employeeId: string,
  active: boolean
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

  const { error: updateError } = await supabase
    .from('employees')
    .update({ active })
    .eq('id', employeeId)
    .eq('organization_id', orgMember.organization_id)

  if (updateError) {
    console.error('Error al cambiar estado del empleado:', updateError.message)
    return { error: 'No se pudo cambiar el estado del empleado.' }
  }

  revalidatePath('/employees')
  return {}
}

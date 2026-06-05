'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'

/**
 * Server Action: Activa o desactiva un empleado.
 * Los empleados nunca se borran — solo se desactivan (active = false).
 */
export async function toggleEmployeeStatus(
  employeeId: string,
  active: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const access = await requireCurrentOrganization()
  if (!access.success) return { error: access.error }

  const { error: updateError } = await supabase
    .from('employees')
    .update({ active })
    .eq('id', employeeId)
    .eq('organization_id', access.context.organizationId)

  if (updateError) {
    console.error('Error al cambiar estado del empleado:', updateError.message)
    return { error: 'No se pudo cambiar el estado del empleado.' }
  }

  revalidatePath('/employees')
  return {}
}

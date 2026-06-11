'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'

export async function deleteAvailability(availabilityId: string, employeeId: string) {
  const supabase = await createClient()

  const access = await requireCurrentOrganization()
  if (!access.success) return { error: access.error }

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, organization_id')
    .eq('id', employeeId)
    .eq('organization_id', access.context.organizationId)
    .single()

  if (empError || !employee) {
    return { error: 'El empleado no pertenece a tu organización.' }
  }

  const { error: deleteError } = await supabase
    .from('employee_availability')
    .delete()
    .eq('id', availabilityId)
    .eq('employee_id', employeeId)

  if (deleteError) {
    console.error('Error deleting availability:', deleteError)
    return { error: 'Error al eliminar la disponibilidad.' }
  }

  revalidatePath('/horarios')
  return { success: true }
}

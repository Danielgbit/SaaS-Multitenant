'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'

const DeleteAvailabilitySchema = z.object({
  employeeId: z.string().uuid(),
})

export async function deleteAvailability(formData: FormData) {
  const supabase = await createClient()

  const employeeId = formData.get('employeeId')

  const parsed = DeleteAvailabilitySchema.safeParse({ employeeId })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const access = await requireCurrentOrganization()
  if (!access.success) return { error: access.error }

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, organization_id')
    .eq('id', parsed.data.employeeId)
    .eq('organization_id', access.context.organizationId)
    .single()

  if (empError || !employee) {
    return { error: 'El empleado no pertenece a tu organización.' }
  }

  const { error: deleteError } = await supabase
    .from('employee_availability')
    .delete()
    .eq('employee_id', parsed.data.employeeId)

  if (deleteError) {
    console.error('Error deleting availability:', deleteError)
    return { error: 'Error al eliminar la disponibilidad.' }
  }

  revalidatePath('/horarios')
  return { success: true }
}

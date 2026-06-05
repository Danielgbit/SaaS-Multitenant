'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'

const ReactivateEmployeeSchema = z.object({
  employeeId: z.string().uuid(),
})

export async function reactivateEmployee(
  employeeId: string
): Promise<{ error?: string; success?: boolean }> {
  const parsed = ReactivateEmployeeSchema.safeParse({ employeeId })
  if (!parsed.success) {
    return { error: 'Datos inválidos.' }
  }

  const supabase = await createClient()

  const access = await requireCurrentOrganization(['owner', 'admin'])
  if (!access.success) return { error: access.error }

  const { data: employee, error: fetchError } = await supabase
    .from('employees')
    .select('id, name, organization_id, active')
    .eq('id', employeeId)
    .eq('organization_id', access.context.organizationId)
    .single()

  if (fetchError || !employee) {
    return { error: 'Empleado no encontrado.' }
  }

  if (employee.active) {
    return { error: 'Este empleado ya está activo.' }
  }

  const { error: updateError } = await supabase
    .from('employees')
    .update({
      active: true,
    })
    .eq('id', employeeId)

  if (updateError) {
    console.error('Error al reactivar empleado:', updateError.message)
    return { error: 'No se pudo reactivar al empleado.' }
  }

  revalidatePath('/employees')
  revalidatePath(`/employees/${employeeId}`)

  return { success: true }
}

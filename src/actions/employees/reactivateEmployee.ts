'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No se encontró organización.' }
  }

  if (!['owner', 'admin'].includes(orgMember.role)) {
    return { error: 'Solo owners y admins pueden reactivar empleados.' }
  }

  const { data: employee, error: fetchError } = await supabase
    .from('employees')
    .select('id, name, organization_id, active')
    .eq('id', employeeId)
    .eq('organization_id', orgMember.organization_id)
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
      archived_at: null,
      archived_by: null,
      archived_reason: null,
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

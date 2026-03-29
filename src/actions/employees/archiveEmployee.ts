'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const ArchiveEmployeeSchema = z.object({
  employeeId: z.string().uuid(),
  reason: z.string().min(1).max(500).optional(),
})

export async function archiveEmployee(
  employeeId: string,
  reason?: string
): Promise<{ error?: string; success?: boolean }> {
  const parsed = ArchiveEmployeeSchema.safeParse({ employeeId, reason })
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
    return { error: 'Solo owners y admins pueden archivar empleados.' }
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

  if (!employee.active) {
    return { error: 'Este empleado ya está archivado.' }
  }

  const { error: updateError } = await supabase
    .from('employees')
    .update({
      active: false,
      archived_at: new Date().toISOString(),
      archived_by: user.id,
      archived_reason: reason ?? null,
    })
    .eq('id', employeeId)

  if (updateError) {
    console.error('Error al archivar empleado:', updateError.message)
    return { error: 'No se pudo archivar al empleado.' }
  }

  revalidatePath('/employees')
  revalidatePath(`/employees/${employeeId}`)

  return { success: true }
}

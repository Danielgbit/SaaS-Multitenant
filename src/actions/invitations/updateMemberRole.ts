'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'

const UpdateMemberRoleSchema = z.object({
  employeeId: z.string().uuid('ID de empleado inválido'),
  role: z.enum(['staff', 'admin', 'empleado']),
})

export async function updateMemberRole(
  input: z.infer<typeof UpdateMemberRoleSchema>
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const validation = UpdateMemberRoleSchema.safeParse(input)
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message }
  }

  const { employeeId, role } = validation.data

  const access = await requireCurrentOrganization(['owner'])
  if (!access.success) return { error: access.error }

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, name, user_id, organization_id')
    .eq('id', employeeId)
    .eq('organization_id', access.context.organizationId)
    .single()

  if (employeeError || !employee) {
    return { error: 'Empleado no encontrado.' }
  }

  if (!employee.user_id) {
    return { error: 'Este empleado no tiene acceso al sistema.' }
  }

  const { data: memberToUpdate, error: memberError } = await supabase
    .from('organization_members')
    .select('id, role')
    .eq('organization_id', access.context.organizationId)
    .eq('user_id', employee.user_id)
    .single()

  if (memberError || !memberToUpdate) {
    return { error: 'No se encontró el miembro de la organización.' }
  }

  if (memberToUpdate.role === 'owner') {
    return { error: 'No puedes cambiar el rol del owner.' }
  }

  const { error: updateError } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('id', memberToUpdate.id)

  if (updateError) {
    console.error('Error updating role:', updateError.message)
    return { error: 'No se pudo actualizar el rol.' }
  }

  revalidatePath('/employees')
  return { success: true }
}

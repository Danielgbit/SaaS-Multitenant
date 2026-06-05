'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCurrentOrganization } from '@/lib/auth/require-org-access'
import { UpdateEmployeeSchema } from '@/schemas/employees/employee.schema'
import { normalizePhone } from '@/lib/validators/phone'

export async function updateEmployee(
  input: { id: string; name: string; phone?: string | null }
): Promise<{ error?: string }> {
  const parsed = UpdateEmployeeSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Datos inválidos' }
  }

  const supabase = await createClient()

  const access = await requireCurrentOrganization()
  if (!access.success) return { error: access.error }

  const { error: updateError } = await supabase
    .from('employees')
    .update({
      name: parsed.data.name,
      phone: normalizePhone(parsed.data.phone ?? '') || null,
    })
    .eq('id', parsed.data.id)
    .eq('organization_id', access.context.organizationId)

  if (updateError) {
    return { error: 'No se pudo actualizar el empleado.' }
  }

  revalidatePath('/employees')
  return {}
}

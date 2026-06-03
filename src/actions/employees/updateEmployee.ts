'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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
    .update({
      name: parsed.data.name,
      phone: normalizePhone(parsed.data.phone ?? '') || null,
    })
    .eq('id', parsed.data.id)
    .eq('organization_id', orgMember.organization_id)

  if (updateError) {
    return { error: 'No se pudo actualizar el empleado.' }
  }

  revalidatePath('/employees')
  return {}
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { CreateEmployeeSchema } from '@/schemas/employees/employee.schema'
import { normalizePhone } from '@/lib/validators/phone'
import { findByPhone } from '@/services/employees/findByPhone'
import type { Employee } from '@/types/employees'

interface CreateEmployeeResult {
  success: boolean
  error?: string
  employee?: Employee
  duplicateEmployee?: Employee
}

export async function createEmployee(
  input: { name: string; phone?: string | null; email?: string | null }
): Promise<CreateEmployeeResult> {
  const supabase = await createClient()

  const parsed = CreateEmployeeSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Datos inválidos',
    }
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    return { success: false, error: 'No se encontró organización para este usuario' }
  }

  if (parsed.data.phone) {
    const { employee: existingEmployee, error: findError } = await findByPhone({
      phone: parsed.data.phone,
      organizationId: orgMember.organization_id,
    })

    if (findError) {
      return { success: false, error: findError }
    }

    if (existingEmployee) {
      return {
        success: false,
        error: `Este número ya está registrado para ${existingEmployee.name}`,
        duplicateEmployee: existingEmployee,
      }
    }
  }

  const normalizedPhone = normalizePhone(parsed.data.phone ?? '')
  const email = parsed.data.email?.trim().toLowerCase() || null

  const { data: newEmployee, error: insertError } = await supabase
    .from('employees')
    .insert({
      name: parsed.data.name,
      phone: normalizedPhone || null,
      email: email || null,
      organization_id: orgMember.organization_id,
      active: true,
    })
    .select()
    .single()

  if (insertError) {
    return {
      success: false,
      error: 'No se pudo crear el empleado. Intenta de nuevo.',
    }
  }

  revalidatePath('/employees')

  return { success: true, employee: newEmployee as Employee }
}

export async function createEmployeeWithEmail(
  input: { name: string; email?: string; phone?: string | null }
): Promise<CreateEmployeeResult> {
  return createEmployee(input)
}

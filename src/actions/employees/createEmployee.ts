'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createEmployeeSchema } from '@/schemas/employees/createEmployee.schema'
import { findByPhone } from '@/services/employees/findByPhone'
import type { Employee } from '@/types/employees'

interface CreateEmployeeResult {
  success: boolean
  error?: string
  employee?: Employee
  duplicateEmployee?: Employee
}

export async function createEmployee(
  input: { name: string; phone?: string | null }
): Promise<CreateEmployeeResult> {
  const supabase = await createClient()

  // 1. Validar input con Zod
  const parsed = createEmployeeSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || 'Datos inválidos',
    }
  }

  // 2. Verificar autenticación
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'No autorizado' }
  }

  // 3. Obtener organización del usuario
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    return { success: false, error: 'No se encontró organización para este usuario' }
  }

  // 4. Si hay teléfono, verificar si ya existe
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

  // 5. Insertar empleado
  const { data: newEmployee, error: insertError } = await supabase
    .from('employees')
    .insert({
      name: parsed.data.name,
      phone: parsed.data.phone?.trim() || null,
      organization_id: orgMember.organization_id,
      active: true,
    })
    .select()
    .single()

  if (insertError) {
    console.error('Error al crear empleado:', insertError.message)
    return {
      success: false,
      error: 'No se pudo crear el empleado. Intenta de nuevo.',
    }
  }

  // 6. Revalidar lista de empleados
  revalidatePath('/employees')

  return { success: true, employee: newEmployee as Employee }
}

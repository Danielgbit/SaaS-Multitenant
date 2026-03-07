'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateEmployeeInput } from '@/types/employees'

/**
 * Server Action: Crea un nuevo empleado para la organización del usuario autenticado.
 * El organization_id se resuelve en el servidor — nunca viene del formulario.
 */
export async function createEmployee(
  input: CreateEmployeeInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // 1. Resolver usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  // 2. Resolver organización del usuario
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No se encontró organización para este usuario.' }
  }

  // 3. Validación de campos
  const name = input.name?.trim()
  if (!name) {
    return { error: 'El nombre del empleado es requerido.' }
  }

  // 4. Insertar empleado
  const { error: insertError } = await supabase.from('employees').insert({
    name,
    phone: input.phone?.trim() || null,
    organization_id: orgMember.organization_id,
    active: true,
  })

  if (insertError) {
    console.error('Error al crear empleado:', insertError.message)
    return { error: 'No se pudo crear el empleado. Intenta de nuevo.' }
  }

  revalidatePath('/employees')
  return {}
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { CreateAvailabilityInput } from '@/types/availability'

/**
 * Server Action: Crea o actualiza la disponibilidad de un empleado.
 * Usa UPSERT para manejar el caso de UNIQUE constraint.
 */
export async function setAvailability(
  input: CreateAvailabilityInput
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  // 1. Verificar usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  // 2. Verificar que el empleado pertenece a la organización del usuario
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No se encontró organización para este usuario.' }
  }

  // Verificar que el empleado pertenece a la organización
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, organization_id')
    .eq('id', input.employee_id)
    .eq('organization_id', orgMember.organization_id)
    .single()

  if (empError || !employee) {
    return { error: 'El empleado no pertenece a tu organización.' }
  }

  // 3. Validar datos
  const { day_of_week, start_time, end_time } = input

  if (day_of_week < 0 || day_of_week > 6) {
    return { error: 'El día de la semana debe estar entre 0 (domingo) y 6 (sábado).' }
  }

  if (!start_time || !end_time) {
    return { error: 'La hora de inicio y fin son requeridas.' }
  }

  // Validar formato HH:MM
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
    return { error: 'El formato de hora debe ser HH:MM (ejemplo: 09:00).' }
  }

  // Validar que start_time < end_time
  if (start_time >= end_time) {
    return { error: 'La hora de inicio debe ser menor que la hora de fin.' }
  }

  // 4. Insertar o actualizar (UPSERT)
  const { error: upsertError } = await supabase
    .from('employee_availability')
    .upsert(
      {
        employee_id: input.employee_id,
        day_of_week,
        start_time,
        end_time,
      },
      {
        onConflict: 'employee_id,day_of_week',
      }
    )

  if (upsertError) {
    console.error('Error al guardar disponibilidad:', upsertError.message)
    return { error: 'No se pudo guardar la disponibilidad. Intenta de nuevo.' }
  }

  revalidatePath(`/employees/${input.employee_id}/availability`)
  return { success: true }
}

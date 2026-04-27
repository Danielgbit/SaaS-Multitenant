'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export interface CreateOverrideInput {
  employee_id: string
  date: string // YYYY-MM-DD
  start_time?: string // HH:MM
  end_time?: string // HH:MM
  is_day_off?: boolean
  reason?: string
}

export interface UpdateOverrideInput {
  id: string
  start_time?: string
  end_time?: string
  is_day_off?: boolean
  reason?: string
}

/**
 * Server Action: Crea o actualiza un override de disponibilidad para una fecha específica.
 * Usa UPSERT para manejar el caso de UNIQUE constraint.
 */
export async function createOverride(
  input: CreateOverrideInput
): Promise<{ error?: string; success?: boolean; data?: unknown }> {
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
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No se encontró organización para este usuario.' }
  }

  // 3. Verificar permisos (owner, admin, assistant)
  if (!['owner', 'admin', 'assistant'].includes(orgMember.role)) {
    return { error: 'No tienes permisos para crear overrides.' }
  }

  // 4. Verificar que el empleado pertenece a la organización
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, organization_id')
    .eq('id', input.employee_id)
    .eq('organization_id', orgMember.organization_id)
    .single()

  if (empError || !employee) {
    return { error: 'El empleado no pertenece a tu organización.' }
  }

  // 5. Validaciones
  const { date, start_time, end_time, is_day_off, reason } = input

  // Validar fecha
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return { error: 'El formato de fecha debe ser YYYY-MM-DD.' }
  }

  // Si no es día libre, validar horarios
  if (!is_day_off) {
    if (!start_time && !end_time) {
      return { error: 'Debes proporcionar start_time o end_time, o marcar como día libre.' }
    }

    if (start_time && end_time) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
        return { error: 'El formato de hora debe ser HH:MM (ejemplo: 09:00).' }
      }
      if (start_time >= end_time) {
        return { error: 'La hora de inicio debe ser menor que la hora de fin.' }
      }
    }
  }

  // 6. Insertar o actualizar (UPSERT)
  const { data, error: upsertError } = await supabase
    .from('employee_availability_overrides')
    .upsert(
      {
        employee_id: input.employee_id,
        date: input.date,
        start_time: input.start_time || null,
        end_time: input.end_time || null,
        is_day_off: input.is_day_off || false,
        reason: input.reason || null,
        created_by: user.id,
      },
      {
        onConflict: 'employee_id,date',
      }
    )
    .select()
    .single()

  if (upsertError) {
    console.error('Error al crear override:', upsertError.message)
    return { error: 'No se pudo crear el override. Intenta de nuevo.' }
  }

  revalidatePath(`/employees/${input.employee_id}/availability`)
  return { success: true, data }
}

/**
 * Server Action: Elimina un override de disponibilidad.
 */
export async function deleteOverride(
  overrideId: string
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

  // 2. Verificar que el override existe y el usuario tiene permisos
  const { data: override, error: fetchError } = await supabase
    .from('employee_availability_overrides')
    .select('*, employees(organization_id)')
    .eq('id', overrideId)
    .single()

  if (fetchError || !override) {
    return { error: 'Override no encontrado.' }
  }

  // 3. Verificar organización del usuario
  const { data: orgMember, error: orgError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No se encontró organización para este usuario.' }
  }

  // 4. Verificar que el override es de la misma organización
  const employeeOrgId = (override as { employees?: { organization_id: string } }).employees?.organization_id
  if (employeeOrgId !== orgMember.organization_id) {
    return { error: 'No tienes permisos para eliminar este override.' }
  }

  // 5. Verificar permisos
  if (!['owner', 'admin', 'assistant'].includes(orgMember.role)) {
    return { error: 'No tienes permisos para eliminar overrides.' }
  }

  // 6. Eliminar
  const { error: deleteError } = await supabase
    .from('employee_availability_overrides')
    .delete()
    .eq('id', overrideId)

  if (deleteError) {
    console.error('Error al eliminar override:', deleteError.message)
    return { error: 'No se pudo eliminar el override. Intenta de nuevo.' }
  }

  revalidatePath(`/employees/${override.employee_id}/availability`)
  return { success: true }
}

/**
 * Server Action: Obtiene overrides de un empleado.
 */
export async function getOverridesForEmployee(
  employeeId: string,
  startDate?: string, // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
): Promise<{ error?: string; data?: unknown }> {
  const supabase = await createClient()

  // 1. Verificar usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'No autorizado.' }
  }

  // 2. Construir query
  let query = supabase
    .from('employee_availability_overrides')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: true })

  // Filtrar por rango de fechas si se proporciona
  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error al obtener overrides:', error.message)
    return { error: 'No se pudieron obtener los overrides.' }
  }

  return { data }
}

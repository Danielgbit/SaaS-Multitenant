'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { HHMM_REGEX, timeToMinutes, isValidDateString } from '@/schemas/common'

const CreateOverrideSchema = z.object({
  employee_id: z.string().uuid(),
  date: z.string().refine(isValidDateString, 'Fecha inválida'),
  start_time: z.string().regex(HHMM_REGEX).optional(),
  end_time: z.string().regex(HHMM_REGEX).optional(),
  is_day_off: z.boolean().optional(),
  reason: z.string().max(500).optional(),
  break_start: z.string().regex(HHMM_REGEX).optional(),
  break_end: z.string().regex(HHMM_REGEX).optional(),
}).superRefine((d, ctx) => {
  if (d.is_day_off) {
    if (d.start_time || d.end_time) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['start_time'], message: 'Día libre no debe tener horario' })
    }
    return
  }
  if (!d.start_time || !d.end_time) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['start_time'], message: 'Horario requerido' })
    return
  }
  if (timeToMinutes(d.start_time) >= timeToMinutes(d.end_time)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end_time'], message: 'Inicio debe ser menor que fin' })
  }
  if (d.break_start || d.break_end) {
    if (!d.break_start || !d.break_end) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['break_end'], message: 'Ambos campos de descanso requeridos' })
      return
    }
    if (timeToMinutes(d.break_start) >= timeToMinutes(d.break_end)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['break_end'], message: 'Inicio de descanso debe ser menor que fin' })
    }
  }
})

/**
 * Server Action: Crea o actualiza un override de disponibilidad para una fecha específica.
 * Usa UPSERT para manejar el caso de UNIQUE constraint.
 */
export async function createOverride(
  input: { employee_id: string; date: string; start_time?: string; end_time?: string; is_day_off?: boolean; reason?: string; break_start?: string; break_end?: string }
): Promise<{ error?: string; success?: boolean; data?: unknown }> {
  const parsed = CreateOverrideSchema.safeParse(input)
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
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (orgError || !orgMember) {
    return { error: 'No se encontró organización para este usuario.' }
  }

  if (!['owner', 'admin', 'assistant'].includes(orgMember.role)) {
    return { error: 'No tienes permisos para crear overrides.' }
  }

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, organization_id')
    .eq('id', parsed.data.employee_id)
    .eq('organization_id', orgMember.organization_id)
    .single()

  if (empError || !employee) {
    return { error: 'El empleado no pertenece a tu organización.' }
  }

  const { employee_id, date, start_time, end_time, is_day_off, reason, break_start, break_end } = parsed.data

  // 6. Insertar o actualizar (UPSERT)
  const { data, error: upsertError } = await supabase
    .from('employee_availability_overrides')
    .upsert(
      {
        employee_id,
        date,
        start_time: start_time || null,
        end_time: end_time || null,
        is_day_off: is_day_off || false,
        reason: reason || null,
        break_start: break_start || null,
        break_end: break_end || null,
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

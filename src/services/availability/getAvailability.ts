import { createClient } from '@/lib/supabase/server'
import type { EmployeeAvailability } from '@/types/availability'

/**
 * Obtiene la disponibilidad de un empleado específico.
 * Solo debe llamarse desde Server Components o Server Actions.
 */
export async function getAvailability(employeeId: string): Promise<EmployeeAvailability[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employee_availability')
    .select('*')
    .eq('employee_id', employeeId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error al obtener disponibilidad:', error.message)
    throw new Error('No se pudo obtener la disponibilidad del empleado.')
  }

  return data ?? []
}

/**
 * Obtiene la disponibilidad de múltiples empleados.
 * Útil para el calendario cuando se cargan varios empleados.
 */
export async function getAvailabilityForEmployees(
  employeeIds: string[]
): Promise<EmployeeAvailability[]> {
  if (employeeIds.length === 0) {
    return []
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employee_availability')
    .select('*')
    .in('employee_id', employeeIds)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) {
    console.error('Error al obtener disponibilidad:', error.message)
    throw new Error('No se pudo obtener la disponibilidad de los empleados.')
  }

  return data ?? []
}

/**
 * Tipo para disponibilidad agrupada por empleado
 */
export type AvailabilitySummary = {
  employee_id: string
  count: number
  days: number[]
  day_labels: string[]
  is_complete: boolean
}

/**
 * Obtiene un resumen de disponibilidad para múltiples empleados.
 * Ideal para mostrar en listas de empleados.
 */
export async function getAvailabilitySummaryForEmployees(
  employeeIds: string[]
): Promise<AvailabilitySummary[]> {
  if (employeeIds.length === 0) {
    return []
  }

  const availability = await getAvailabilityForEmployees(employeeIds)
  
  // Agrupar por employee_id
  const grouped = new Map<string, EmployeeAvailability[]>()
  
  for (const item of availability) {
    const existing = grouped.get(item.employee_id) || []
    existing.push(item)
    grouped.set(item.employee_id, existing)
  }

  // Convertir a resumen
  const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  
  const summaries: AvailabilitySummary[] = employeeIds.map(id => {
    const empAvailability = grouped.get(id) || []
    const days = [...new Set(empAvailability.map(a => a.day_of_week))].sort()
    const day_labels = days.map(d => DAY_LABELS[d])
    
    return {
      employee_id: id,
      count: days.length,
      days,
      day_labels,
      is_complete: days.length === 7
    }
  })

  return summaries
}

import { createClient } from '@/lib/supabase/server'

interface Override {
  id: string
  employee_id: string
  date: string
  start_time: string | null
  end_time: string | null
  is_day_off: boolean
  reason: string | null
  created_at: string
  created_by: string | null
  updated_at: string
}

/**
 * Obtiene los overrides de disponibilidad de un empleado.
 */
export async function getOverridesForEmployee(
  employeeId: string
): Promise<Override[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employee_availability_overrides')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching overrides:', error.message)
    return []
  }

  return (data ?? []).map(d => ({
    id: d.id,
    employee_id: d.employee_id,
    date: d.date,
    start_time: d.start_time ?? '',
    end_time: d.end_time ?? '',
    is_day_off: d.is_day_off ?? false,
    reason: d.reason ?? null,
    created_at: d.created_at ?? '',
    created_by: d.created_by ?? null,
    updated_at: d.updated_at ?? '',
  }))
}

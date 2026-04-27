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

  return data ?? []
}

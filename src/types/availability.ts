import type { Database } from '@/../types/supabase'

export type EmployeeAvailability = Database['public']['Tables']['employee_availability']['Row']

export type CreateAvailabilityInput = {
  employee_id: string
  day_of_week: number // 0-6, donde 0 = domingo
  start_time: string // HH:MM formato 24 horas
  end_time: string // HH:MM formato 24 horas
}

export type UpdateAvailabilityInput = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export const WEEKDAYS: { value: number; label: string; short: string }[] = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
]

export const WORKING_WEEKDAYS = WEEKDAYS.filter((d) => d.value >= 1 && d.value <= 5)

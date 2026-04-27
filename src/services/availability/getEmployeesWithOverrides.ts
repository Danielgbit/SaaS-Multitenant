'use server'

import { createClient } from '@/lib/supabase/server'
import type { EmployeeWithSchedules } from '@/types/availability'

export async function getEmployeesWithOverrides(
  organizationId: string
): Promise<EmployeeWithSchedules[]> {
  const supabase = await createClient()

  const { data: employees, error: employeesError } = await supabase
    .from('employees')
    .select(`
      id,
      name,
      phone,
      active,
      employee_availability(id, day_of_week, start_time, end_time),
      employee_availability_overrides(id, date, start_time, end_time, is_day_off, reason, created_at)
    `)
    .eq('organization_id', organizationId)
    .eq('active', true)
    .order('name', { ascending: true })

  if (employeesError) {
    console.error('Error fetching employees:', employeesError.message)
    return []
  }

  return (employees || []).map((emp: any) => ({
    id: emp.id,
    name: emp.name,
    phone: emp.phone,
    active: emp.active,
    availability: emp.employee_availability || [],
    overrides: (emp.employee_availability_overrides || []).filter(
      (o: any) => new Date(o.date) >= new Date(new Date().toISOString().split('T')[0])
    ),
  }))
}
import { createClient } from '@/lib/supabase/server'

export interface EmployeeService {
  id: string
  employee_id: string
  service_id: string
  duration_override: number | null
  price_override: number | null
  service?: {
    id: string
    name: string
    duration: number
    price: number
  }
}

export async function getEmployeeServices(employeeId: string): Promise<EmployeeService[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employee_services')
    .select('*')
    .eq('employee_id', employeeId)

  if (error || !data) {
    return []
  }

  return data as EmployeeService[]
}

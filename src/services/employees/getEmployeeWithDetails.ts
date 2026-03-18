import { createClient } from '@/lib/supabase/server'
import type { Employee } from '@/types/employees'

export async function getEmployeeWithDetails(
  employeeId: string,
  organizationId: string
): Promise<Employee | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .eq('organization_id', organizationId)
    .single()

  if (error || !data) {
    return null
  }

  return data as Employee
}

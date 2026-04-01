import { createClient } from '@/lib/supabase/server'

export type EmployeeServiceInfo = {
  id: string
  name: string
  duration: number
  price: number
}

export type EmployeeServicesMap = Record<string, EmployeeServiceInfo[]>

export async function getEmployeeServicesForOrganization(
  employeeIds: string[],
  organizationId: string
): Promise<EmployeeServicesMap> {
  if (employeeIds.length === 0) {
    return {}
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('employee_services')
    .select(`
      employee_id,
      service_id,
      duration_override,
      price_override,
      services (
        id,
        name,
        duration,
        price
      )
    `)
    .in('employee_id', employeeIds)

  if (error || !data) {
    console.error('Error fetching employee services:', error)
    return {}
  }

  const result: EmployeeServicesMap = {}

  for (const item of data) {
    const employeeId = item.employee_id
    if (!item.services) continue

    if (!result[employeeId]) {
      result[employeeId] = []
    }

    result[employeeId].push({
      id: (item.services as any).id,
      name: (item.services as any).name,
      duration: item.duration_override ?? (item.services as any).duration,
      price: item.price_override ?? (item.services as any).price,
    })
  }

  return result
}
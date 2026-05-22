import type { AppointmentWithDetails, Employee, Client, Service } from '@/types/calendar'

export function buildEmployeeMap(employees: Employee[]): Map<string, Employee> {
  const map = new Map<string, Employee>()
  employees.forEach(e => map.set(e.id, e))
  return map
}

export function buildClientMap(clients: Client[]): Map<string, Client> {
  const map = new Map<string, Client>()
  clients.forEach(c => map.set(c.id, c))
  return map
}

export function buildServiceMap(services: Service[]): Map<string, Service> {
  const map = new Map<string, Service>()
  services.forEach(s => map.set(s.id, s))
  return map
}

export function enrichAppointmentsWithDetails(
  appointments: any[],
  employeeMap: Map<string, Employee>,
  clientMap: Map<string, Client>,
  serviceMap: Map<string, Service>
): AppointmentWithDetails[] {
  return (appointments ?? []).map(apt => ({
    ...apt,
    employee: employeeMap.get(apt.employee_id),
    client: clientMap.get(apt.client_id),
    service: apt.service_id ? serviceMap.get(apt.service_id) : undefined,
  }))
}

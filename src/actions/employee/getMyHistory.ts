'use server'

import { createClient } from '@/lib/supabase/server'
import type { ServiceHistory } from '@/types/employee-metrics'
import { appLog } from '@/lib/app-logger'
import { setRequestContext } from '@/lib/request-context'

export async function getMyHistory(): Promise<{
  success: boolean
  data?: ServiceHistory[]
  error?: string
}> {
  setRequestContext({ flow: 'employee.dashboard' })
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'Not authenticated' }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) return { success: false, error: 'Not a member' }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .eq('organization_id', orgMember.organization_id)
    .single()

  if (!employee) return { success: false, error: 'Employee not found' }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      status,
      clients(name),
      appointment_services(
        services(name, price)
      )
    `)
    .eq('employee_id', employee.id)
    .gte('start_time', thirtyDaysAgo)
    .order('start_time', { ascending: false })
    .limit(50)

  if (error) return { success: false, error: error.message }

  const history: ServiceHistory[] = []

  for (const apt of data ?? []) {
    const row = apt as {
      id: string
      start_time: string
      status: string
      clients: { name: string } | null
      appointment_services: Array<{
        services: { name: string; price: number | null } | null
      } | null> | null
    }

    const services = row.appointment_services ?? []
    const clientName = row.clients?.name ?? 'Cliente'

    if (services.length === 0) {
      history.push({
        id: `${row.id}-noservice`,
        date: row.start_time,
        clientName,
        serviceName: 'Sin servicio',
        servicePrice: 0,
        status: row.status as ServiceHistory['status'],
        appointmentId: row.id,
      })
    } else {
      for (const svc of services) {
        history.push({
          id: `${row.id}-${svc?.services?.name ?? Math.random().toString(36).slice(2, 8)}`,
          date: row.start_time,
          clientName,
          serviceName: svc?.services?.name ?? 'Servicio',
          servicePrice: svc?.services?.price ?? 0,
          status: row.status as ServiceHistory['status'],
          appointmentId: row.id,
        })
      }
    }
  }

  appLog('info', 'employee history loaded', {
    flow: 'employee_dashboard',
    operation: 'get_history',
    employeeId: employee.id,
    count: history.length,
  })

  return { success: true, data: history }
}

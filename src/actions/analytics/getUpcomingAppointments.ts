'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay } from 'date-fns'

export async function getUpcomingAppointments(
  organizationId: string,
  limit: number = 5
): Promise<{
  success: boolean
  data?: Array<{
    id: string
    start_time: string
    status: string
    client_name: string
    client_phone: string | null
    service_name: string | null
    employee_name: string | null
    employee_id: string | null
  }>
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const today = new Date()
  const dayStart = startOfDay(today)
  const dayEnd = endOfDay(today)

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      status,
      client_id,
      employee_id,
      appointment_services!inner(
        service_id,
        services!inner(name)
      )
    `)
    .eq('organization_id', organizationId)
    .gte('start_time', dayStart.toISOString())
    .lte('start_time', dayEnd.toISOString())
    .order('start_time', { ascending: true })
    .limit(limit)

  if (error) {
    return { success: false, error: error.message }
  }

  // Fetch client and employee names
  const clientIds = [...new Set((data || []).map(a => a.client_id).filter(Boolean))]
  const employeeIds = [...new Set((data || []).map(a => a.employee_id).filter(Boolean))]

  const [{ data: clients }, { data: employees }] = await Promise.all([
    clientIds.length > 0 
      ? supabase.from('clients').select('id, name, phone').in('id', clientIds)
      : { data: null },
    employeeIds.length > 0
      ? supabase.from('employees').select('id, name').in('id', employeeIds)
      : { data: null }
  ])

  const clientsMap = new Map((clients || []).map(c => [c.id, c]))
  const employeesMap = new Map((employees || []).map(e => [e.id, e]))

  const appointments = (data || []).map(apt => {
    const client = clientsMap.get(apt.client_id)
    const employee = employeesMap.get(apt.employee_id)
    const service = (apt.appointment_services as any[])?.[0]?.services

    return {
      id: apt.id,
      start_time: apt.start_time,
      status: apt.status,
      client_name: client?.name || 'Cliente',
      client_phone: client?.phone || null,
      service_name: service?.name || null,
      employee_name: employee?.name || null,
      employee_id: apt.employee_id,
    }
  })

  return {
    success: true,
    data: appointments
  }
}

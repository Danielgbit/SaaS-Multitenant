'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const CountRecordsSchema = z.object({
  employeeId: z.string().uuid(),
})

export type EmployeeRecordCounts = {
  appointments: number
  confirmations: number
  availability: number
  services: number
  loans: number
  receipts: number
  hasActiveAppointments: boolean
}

export async function countEmployeeRecords(employeeId: string): Promise<EmployeeRecordCounts> {
  const validated = CountRecordsSchema.safeParse({ employeeId })
  if (!validated.success) {
    return {
      appointments: 0,
      confirmations: 0,
      availability: 0,
      services: 0,
      loans: 0,
      receipts: 0,
      hasActiveAppointments: false,
    }
  }

  const supabase = await createClient()

  const [
    appointmentsResult,
    confirmationsResult,
    availabilityResult,
    servicesResult,
    loansResult,
    receiptsResult,
    activeAppointmentsResult,
  ] = await Promise.all([
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId),
    supabase.from('appointment_confirmations').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId),
    supabase.from('employee_availability').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId),
    supabase.from('employee_services').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId),
    (supabase as any).from('employee_loans').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId),
    (supabase as any).from('payroll_receipts').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .neq('status', 'cancelled')
      .neq('status', 'completed')
      .gte('start_time', new Date().toISOString()),
  ])

  return {
    appointments: appointmentsResult.count ?? 0,
    confirmations: confirmationsResult.count ?? 0,
    availability: availabilityResult.count ?? 0,
    services: servicesResult.count ?? 0,
    loans: loansResult.count ?? 0,
    receipts: receiptsResult.count ?? 0,
    hasActiveAppointments: (activeAppointmentsResult.count ?? 0) > 0,
  }
}

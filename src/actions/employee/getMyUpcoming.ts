'use server'

import { createClient } from '@/lib/supabase/server'
import type { UpcomingAppointment } from '@/types/employee-metrics'
import { appLog } from '@/lib/app-logger'

export async function getMyUpcoming(): Promise<{
  success: boolean
  data?: UpcomingAppointment[]
  error?: string
}> {
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

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const endOfWeek = new Date(startOfToday)
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  const { data, error } = await supabase
    .from('appointments')
    .select('id, start_time, end_time, status, clients(name)')
    .eq('employee_id', employee.id)
    .not('status', 'in', '("cancelled","no_show")')
    .gte('start_time', startOfToday.toISOString())
    .lt('start_time', endOfWeek.toISOString())
    .order('start_time')

  if (error) return { success: false, error: error.message }

  const appointments: UpcomingAppointment[] = (data ?? []).map((apt) => {
    const row = apt as {
      id: string
      start_time: string
      end_time: string
      status: string
      clients: { name: string } | null
    }
    return {
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      status: row.status as UpcomingAppointment['status'],
      clientName: row.clients?.name ?? null,
    }
  })

  appLog('info', 'employee upcoming loaded', {
    flow: 'employee_dashboard',
    operation: 'get_upcoming',
    employeeId: employee.id,
    count: appointments.length,
  })

  return { success: true, data: appointments }
}

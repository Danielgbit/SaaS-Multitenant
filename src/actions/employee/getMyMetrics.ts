'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/../types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EmployeeMetrics } from '@/types/employee-metrics'
import { appLog } from '@/lib/app-logger'

type AppointmentDateRow = {
  start_time: string
}

type RevenueRow = {
  appointment_services: Array<{
    services: { price: number | null } | null
  } | null> | null
}

export async function getMyMetrics(): Promise<{
  success: boolean
  data?: EmployeeMetrics
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

  const employeeId = employee.id
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [appointmentsResult, revenueResult, loansResult] = await Promise.all([
    supabase
      .from('appointments')
      .select('status')
      .eq('employee_id', employeeId)
      .gte('start_time', thirtyDaysAgo),

    supabase
      .from('appointments')
      .select(`
        appointment_services(
          services(price)
        )
      `)
      .eq('employee_id', employeeId)
      .eq('status', 'completed')
      .gte('start_time', thirtyDaysAgo),

    supabase
      .from('employee_loans')
      .select('remaining_amount')
      .eq('employee_id', employeeId)
      .in('status', ['pending', 'partial']),
  ])

  const appointments = appointmentsResult.data ?? []
  const total = appointments.length
  const completed = appointments.filter(a => a.status === 'completed').length
  const cancelled = appointments.filter(a => a.status === 'cancelled').length
  const noShow = appointments.filter(a => a.status === 'no_show').length

  const revenueData = (revenueResult.data ?? []) as RevenueRow[]
  const revenueThisMonth = revenueData.reduce((sum, apt) => {
    const services = apt.appointment_services ?? []
    return sum + services.reduce((s, as) => s + (as?.services?.price ?? 0), 0)
  }, 0)

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0

  const streak = await calculateStreak(supabase, employeeId)

  const loansData = loansResult.data ?? []
  const pendingLoans = loansData.reduce((sum, l) => sum + (l.remaining_amount ?? 0), 0)

  appLog('info', 'employee metrics loaded', {
    flow: 'employee_dashboard',
    operation: 'get_metrics',
    employeeId,
  })

  return {
    success: true,
    data: {
      completedThisMonth: completed,
      revenueThisMonth,
      completionRate,
      streak,
      noShowRate,
      pendingLoans,
      cancelledThisMonth: cancelled,
    },
  }
}

async function calculateStreak(
  supabase: SupabaseClient<Database>,
  employeeId: string
): Promise<number> {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const { data } = await supabase
    .from('appointments')
    .select('start_time')
    .eq('employee_id', employeeId)
    .eq('status', 'completed')
    .gte('start_time', sixtyDaysAgo)
    .lte('start_time', today.toISOString())
    .order('start_time', { ascending: false })

  if (!data || data.length === 0) return 0

  const completedDates = new Set<string>()
  for (const apt of data as unknown as AppointmentDateRow[]) {
    const dateKey = apt.start_time.substring(0, 10)
    completedDates.add(dateKey)
  }

  // Last-active streak: find the most recent date with completed work
  const sortedDates = [...completedDates].sort().reverse()
  if (sortedDates.length === 0) return 0

  const lastDate = new Date(sortedDates[0])
  lastDate.setHours(0, 0, 0, 0)

  let streak = 0
  const cursor = new Date(lastDate)

  while (true) {
    const key = cursor.toISOString().substring(0, 10)
    if (completedDates.has(key)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

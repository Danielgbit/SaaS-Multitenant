'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns'
import { z } from 'zod'

const PeriodSchema = z.enum(['today', 'week', 'month', 'year', 'last7days', 'last30days'])
type Period = z.infer<typeof PeriodSchema>

function getDateRange(period: Period): { start: Date; end: Date } {
  const now = new Date()
  switch (period) {
    case 'today': return { start: startOfDay(now), end: endOfDay(now) }
    case 'week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'month': return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'year': return { start: startOfYear(now), end: endOfYear(now) }
    case 'last7days': return { start: subDays(now, 7), end: now }
    case 'last30days': return { start: subDays(now, 30), end: now }
    default: return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

interface EmployeePerformance {
  employee_id: string
  employee_name: string
  appointments: number
  revenue: number
  completed: number
}

export async function getEmployeePerformance(
  organizationId: string,
  period: Period = 'month'
): Promise<{
  success: boolean
  data?: EmployeePerformance[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { start, end } = getDateRange(period)

  // Get appointments with employee and revenue data
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      status,
      employee_id,
      appointment_services!inner(
        services!inner(price)
      )
    `)
    .eq('organization_id', organizationId)
    .gte('start_time', start.toISOString())
    .lte('start_time', end.toISOString())

  if (error) {
    return { success: false, error: error.message }
  }

  // Get employee names
  const employeeIds = [...new Set((appointments || []).map(a => a.employee_id).filter(Boolean))]
  const { data: employees } = employeeIds.length > 0
    ? await supabase.from('employees').select('id, name').in('id', employeeIds)
    : { data: [] }

  const employeesMap = new Map((employees || []).map(e => [e.id, e.name]))

  // Aggregate by employee
  const employeeStats = new Map<string, { appointments: number; revenue: number; completed: number }>()

  ;(appointments || []).forEach(apt => {
    const empId = apt.employee_id
    if (!empId) return

    const stats = employeeStats.get(empId) || { appointments: 0, revenue: 0, completed: 0 }
    stats.appointments++
    
    if (apt.status === 'completed') {
      stats.completed++
      const services = apt.appointment_services as Array<{ services: { price: number } }>
      const revenue = services?.reduce((sum, s) => sum + (s.services?.price || 0), 0) || 0
      stats.revenue += revenue
    }

    employeeStats.set(empId, stats)
  })

  // Convert to array and sort by revenue
  const result: EmployeePerformance[] = Array.from(employeeStats.entries())
    .map(([employee_id, stats]) => ({
      employee_id,
      employee_name: employeesMap.get(employee_id) || 'Empleado',
      ...stats
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5) // Top 5

  return {
    success: true,
    data: result
  }
}

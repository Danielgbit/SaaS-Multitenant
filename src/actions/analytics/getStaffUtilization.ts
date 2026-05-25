'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfToday } from 'date-fns'
import type { StaffUtilizationSummary } from '@/types/analytics'
import { THRESHOLDS } from '@/lib/operational-intelligence'

function calculateAvailableMinutes(
  availability: Array<{ start_time: string; end_time: string; break_start?: string | null; break_end?: string | null }>
): number {
  if (!availability || availability.length === 0) return 0

  let totalMinutes = 0

  for (const slot of availability) {
    const startParts = slot.start_time.split(':').map(Number)
    const endParts = slot.end_time.split(':').map(Number)
    let minutes = (endParts[0] * 60 + endParts[1]) - (startParts[0] * 60 + startParts[1])

    if (slot.break_start && slot.break_end) {
      const breakStartParts = slot.break_start.split(':').map(Number)
      const breakEndParts = slot.break_end.split(':').map(Number)
      const breakMinutes = (breakEndParts[0] * 60 + breakEndParts[1]) - (breakStartParts[0] * 60 + breakStartParts[1])
      minutes -= breakMinutes
    }

    totalMinutes += Math.max(0, minutes)
  }

  return totalMinutes
}

function getEmployeeAvailabilityForDay(
  employee: {
    availability: Array<{ day_of_week: number; start_time: string; end_time: string; break_start?: string | null; break_end?: string | null }>
    overrides: Array<{ date: string; start_time?: string | null; end_time?: string | null; is_day_off: boolean; break_start?: string | null; break_end?: string | null }>
  },
  dayOfWeek: number
): Array<{ start_time: string; end_time: string; break_start?: string | null; break_end?: string | null }> {
  const today = startOfToday().toISOString().split('T')[0]

  const todayOverride = employee.overrides.find(o => o.date === today)

  if (todayOverride) {
    if (todayOverride.is_day_off) return []
    if (todayOverride.start_time && todayOverride.end_time) {
      return [{
        start_time: todayOverride.start_time,
        end_time: todayOverride.end_time,
        break_start: todayOverride.break_start,
        break_end: todayOverride.break_end,
      }]
    }
  }

  return employee.availability.filter(a => a.day_of_week === dayOfWeek)
}

export async function getStaffUtilization(
  organizationId: string
): Promise<{
  success: boolean
  data?: StaffUtilizationSummary
  error?: string
}> {
  const label = '[analytics] getStaffUtilization()'
  console.time(label)

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.timeEnd(label)
    return { success: false, error: 'No autorizado' }
  }

  const today = startOfToday()
  const dayOfWeek = today.getDay()
  const startOfDayISO = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endOfDayISO = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const [employeesResult, todayAppointmentsResult] = await Promise.all([
    supabase
      .from('employees')
      .select(`
        id,
        name,
        employee_availability(id, day_of_week, start_time, end_time, break_start, break_end),
        employee_availability_overrides(id, date, start_time, end_time, is_day_off, break_start, break_end)
      `)
      .eq('organization_id', organizationId)
      .eq('active', true)
      .order('name', { ascending: true }),

    supabase
      .from('appointments')
      .select(`
        id,
        employee_id,
        status,
        start_time,
        appointment_services!inner(
          duration_minutes
        )
      `)
      .eq('organization_id', organizationId)
      .in('status', ['confirmed', 'completed'])
      .gte('start_time', startOfDayISO)
      .lte('start_time', endOfDayISO),
  ])

  if (employeesResult.error) {
    console.timeEnd(label)
    return { success: false, error: employeesResult.error.message }
  }

  const employeesData = employeesResult.data || []

  const staffUtilizationMap = new Map<string, {
      employee_id: string
      employee_name: string
      availableMinutes: number
      bookedMinutes: number
      utilizationPercent: number
      revenue: number
    }>()

  for (const emp of employeesData) {
    const empId = emp.id as string
    const empName = emp.name as string

    const availability = getEmployeeAvailabilityForDay({
      availability: emp.employee_availability || [],
      overrides: (emp.employee_availability_overrides || []).filter(
        (o: any) => new Date(o.date) >= new Date(new Date().toISOString().split('T')[0])
      ).map((o: any) => ({
        ...o,
        is_day_off: o.is_day_off ?? false,
      })),
    }, dayOfWeek)

    const availableMinutes = calculateAvailableMinutes(availability)

    const empAppointments = (todayAppointmentsResult.data || [])
      .filter(apt => apt.employee_id === empId)

    const bookedMinutes = empAppointments.reduce((sum: number, apt: any) => {
      const services = apt.appointment_services as Array<{ duration_minutes: number | null }>
      const duration = services?.reduce((s, svc) => s + (svc.duration_minutes || 0), 0) || 0
      return sum + duration
    }, 0)

    const utilizationPercent = availableMinutes > 0
      ? Math.min(100, Math.round((bookedMinutes / availableMinutes) * 100))
      : 0

    staffUtilizationMap.set(empId, {
      employee_id: empId,
      employee_name: empName,
      availableMinutes,
      bookedMinutes,
      utilizationPercent,
      revenue: 0,
    })
  }

  const staff = Array.from(staffUtilizationMap.values())
    .sort((a, b) => a.employee_name.localeCompare(b.employee_name))

  const totalAvailable = staff.reduce((sum, s) => sum + s.availableMinutes, 0)
  const totalBooked = staff.reduce((sum, s) => sum + s.bookedMinutes, 0)
  const overallUtilization = totalAvailable > 0
    ? Math.round((totalBooked / totalAvailable) * 100)
    : 0

  const result: StaffUtilizationSummary = {
    overallUtilization,
    underutilizedCount: staff.filter(s => s.utilizationPercent > 0 && s.utilizationPercent <= THRESHOLDS.UNDERUTILIZATION_PERCENT).length,
    overloadedCount: staff.filter(s => s.utilizationPercent >= THRESHOLDS.OVERLOAD_PERCENT).length,
    staff,
  }

  console.timeEnd(label)
  console.log(`[analytics] getStaffUtilization() → staff: ${staff.length}, overall: ${overallUtilization}%, underutilized: ${result.underutilizedCount}, overloaded: ${result.overloadedCount}`)

  return { success: true, data: result }
}
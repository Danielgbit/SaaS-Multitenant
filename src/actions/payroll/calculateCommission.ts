'use server'

import { createClient } from '@/lib/supabase/server'
import type { CommissionBreakdown, CommissionSummary } from '@/types/payroll'

export type DayGroup = {
  date: string
  dateLabel: string
  dayOfWeek: string
  services: CommissionBreakdown[]
  dailyTotal: number
  dailyCommission: number
}

export type CommissionWithDayGroups = CommissionSummary & {
  dayGroups: DayGroup[]
}

export async function calculateCommission(
  employeeId: string,
  periodStart: string,
  periodEnd: string
): Promise<{
  success: boolean
  data?: CommissionWithDayGroups
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: employee } = await (supabase as any)
    .from('employees')
    .select(
      'id, name, default_commission_rate, payment_type, fixed_salary'
    )
    .eq('id', employeeId)
    .single()

  if (!employee) {
    return { success: false, error: 'Empleado no encontrado' }
  }

  const startDate = new Date(periodStart)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(periodEnd)
  endDate.setHours(23, 59, 59, 999)

  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select(`
      id,
      start_time,
      status,
      is_commissionable,
      appointment_services (
        service_id
      )
    `)
    .eq('employee_id', employeeId)
    .eq('status', 'completed')
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: true })

  const breakdown: CommissionBreakdown[] = []
  let totalServices = 0
  let totalCommissionable = 0
  let totalCommission = 0

  for (const apt of appointments || []) {
    if (!apt.is_commissionable) continue

    const serviceIds = (apt.appointment_services || []).map(
      (as: any) => as.service_id
    )

    if (serviceIds.length === 0) continue

    const { data: services } = await (supabase as any)
      .from('services')
      .select('id, name, price, has_commission')
      .in('id', serviceIds)

    for (const service of services || []) {
      if (!service.has_commission) continue

      const { data: employeeService } = await (supabase as any)
        .from('employee_services')
        .select('commission_rate, price_override')
        .eq('employee_id', employeeId)
        .eq('service_id', service.id)
        .single()

      const price = employeeService?.price_override || service.price
      const rate = employeeService?.commission_rate || employee.default_commission_rate
      const commission = Number((price * (rate / 100)).toFixed(2))

      breakdown.push({
        appointment_id: apt.id,
        date: apt.start_time,
        service_name: service.name,
        service_price: price,
        commission_rate: rate,
        commission_amount: commission,
      })

      totalServices += price
      totalCommissionable += price
      totalCommission += commission
    }
  }

  const dayGroupsMap = new Map<string, DayGroup>()
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  for (const item of breakdown) {
    const date = new Date(item.date)
    const dateKey = date.toISOString().split('T')[0]
    
    if (!dayGroupsMap.has(dateKey)) {
      dayGroupsMap.set(dateKey, {
        date: dateKey,
        dateLabel: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        dayOfWeek: dayNames[date.getDay()],
        services: [],
        dailyTotal: 0,
        dailyCommission: 0,
      })
    }
    
    const group = dayGroupsMap.get(dateKey)!
    group.services.push(item)
    group.dailyTotal += item.service_price
    group.dailyCommission += item.commission_amount
  }

  const dayGroups = Array.from(dayGroupsMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return {
    success: true,
    data: {
      employee_id: employeeId,
      period_start: periodStart,
      period_end: periodEnd,
      services: breakdown,
      total_services: Number(totalServices.toFixed(2)),
      total_commissionable: Number(totalCommissionable.toFixed(2)),
      total_commission: Number(totalCommission.toFixed(2)),
      default_rate: employee.default_commission_rate,
      payment_type: employee.payment_type,
      fixed_salary: employee.fixed_salary,
      dayGroups,
    },
  }
}

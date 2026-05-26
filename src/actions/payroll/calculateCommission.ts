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
  const label = `[payroll] calculateCommission`
  console.time(label)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.timeEnd(label)
    return { success: false, error: 'No autorizado' }
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single()

  if (!employee) {
    console.timeEnd(label)
    return { success: false, error: 'Empleado no encontrado' }
  }

  const emp = employee as unknown as {
    default_commission_rate: number | null
    payment_type: string | null
    fixed_salary: number | null
    base_salary: number | null
  }

  const startDate = new Date(periodStart)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(periodEnd)
  endDate.setHours(23, 59, 59, 999)

  const { data: appointments } = await supabase
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

  // Collect all unique service_ids for batch lookup
  const allServiceIds = new Set<string>()
  for (const apt of appointments || []) {
    for (const as of apt.appointment_services || []) {
      allServiceIds.add(as.service_id)
    }
  }

  // Batch fetch all services in ONE query
  const { data: allServices } = await supabase
    .from('services')
    .select('id, name, price, has_commission')
    .in('id', [...allServiceIds])

  const serviceMap = new Map(
    (allServices || []).map((s: any) => [s.id, s])
  )

  // Batch fetch all employee_services for this employee in ONE query
  const { data: allEmpServices } = await supabase
    .from('employee_services')
    .select('service_id, commission_rate, price_override')
    .eq('employee_id', employeeId)
    .in('service_id', [...allServiceIds])

  const empServiceMap = new Map(
    (allEmpServices || []).map((es: any) => [es.service_id, es])
  )

  // Now compute commissions with O(1) lookups instead of N+1 queries
  const breakdown: CommissionBreakdown[] = []
  let totalServices = 0
  let totalCommissionable = 0
  let totalCommission = 0

  for (const apt of appointments || []) {
    if (!apt.is_commissionable) continue

    for (const as of apt.appointment_services || []) {
      const service = serviceMap.get(as.service_id)
      if (!service || !(service as any).has_commission) continue

      const empService = empServiceMap.get(as.service_id)
      const price = (empService as any)?.price_override || (service as any).price
      const rate = (empService as any)?.commission_rate || emp.default_commission_rate
      const commission = Number((price * (rate / 100)).toFixed(2))

      breakdown.push({
        appointment_id: apt.id,
        date: apt.start_time,
        service_name: (service as any).name,
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

  console.timeEnd(label)
  console.log(`${label} → appointments: ${(appointments || []).length}, services: ${allServiceIds.size}, queries: 4 (batched)`)

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
      default_rate: emp.default_commission_rate ?? 0,
      payment_type: emp.payment_type as any,
      base_salary: emp.base_salary || emp.fixed_salary,
      dayGroups,
    },
  }
}

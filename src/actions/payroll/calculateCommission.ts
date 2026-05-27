'use server'

import { createClient } from '@/lib/supabase/server'
import { appLog } from '@/lib/app-logger'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CommissionBreakdown, CommissionSummary } from '@/types/payroll'
import type { PaymentType } from '@/types/employees'
import type { Database } from '@/../types/supabase'

type SClient = SupabaseClient<Database>

type EmployeeRow = Database['public']['Tables']['employees']['Row']
type ServiceRow = Database['public']['Tables']['services']['Row']

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

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function buildDayGroups(breakdown: CommissionBreakdown[]): DayGroup[] {
  const map = new Map<string, DayGroup>()

  for (const item of breakdown) {
    const date = new Date(item.date)
    const dateKey = date.toISOString().split('T')[0]

    if (!map.has(dateKey)) {
      map.set(dateKey, {
        date: dateKey,
        dateLabel: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
        dayOfWeek: DAY_NAMES[date.getDay()],
        services: [],
        dailyTotal: 0,
        dailyCommission: 0,
      })
    }

    const group = map.get(dateKey)!
    group.services.push(item)
    group.dailyTotal += item.service_price
    group.dailyCommission += item.commission_amount
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

async function getCommissionsFromEvents(
  supabase: SClient,
  employeeId: string,
  appointmentIds: string[],
  startDate: Date,
  endDate: Date
): Promise<{ breakdown: CommissionBreakdown[]; totalCommission: number } | null> {
  const { data: events, error } = await supabase
    .from('financial_events')
    .select('source_id, entity_id, amount, metadata, occurred_at')
    .eq('event_type', 'commission_accrued')
    .eq('entity_type', 'appointment')
    .in('entity_id', appointmentIds)
    .lt('amount', 0)
    .gte('occurred_at', startDate.toISOString())
    .lte('occurred_at', endDate.toISOString())
    .order('occurred_at', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    appLog('error', '[getCommissionsFromEvents] query failed', {
      employeeId,
      appointmentCount: appointmentIds.length,
      error,
    })
    return null
  }

  if (!events || events.length === 0) return null

  const sourceIds = events.map(e => e.source_id).filter(Boolean) as string[]
  const aptIds = [...new Set(events.map(e => e.entity_id).filter(Boolean) as string[])]

  const { data: apptServices } = await supabase
    .from('appointment_services')
    .select('id, service_id')
    .in('id', sourceIds)

  const serviceIdToApsId = new Map(
    (apptServices || []).map(a => [a.service_id, a.id])
  )
  const serviceIds = [...serviceIdToApsId.keys()]

  const { data: services } = await supabase
    .from('services')
    .select('id, name, price')
    .in('id', serviceIds)

  const serviceMap = new Map(
    (services || []).map(s => [s.id, s])
  )

  const { data: aptMap } = await supabase
    .from('appointments')
    .select('id, start_time')
    .in('id', aptIds)

  const appointmentTimeMap = new Map(
    (aptMap || []).map(a => [a.id, a.start_time])
  )

  const breakdown: CommissionBreakdown[] = []
  let totalCommission = 0

  for (const event of events) {
    const serviceId = (event.metadata as Record<string, unknown>)?.service_id as string | undefined
    if (!serviceId) continue

    const svc = serviceMap.get(serviceId)
    if (!svc) continue

    const rate = (event.metadata as Record<string, unknown>)?.commission_rate as number | undefined
    const price = (event.metadata as Record<string, unknown>)?.service_price as number | undefined
    const commissionAmount = Math.abs(event.amount)

    breakdown.push({
      appointment_id: event.entity_id,
      date: appointmentTimeMap.get(event.entity_id) || event.occurred_at,
      service_name: svc.name,
      service_price: price ?? 0,
      commission_rate: rate ?? 0,
      commission_amount: commissionAmount,
    })

    totalCommission += commissionAmount
  }

  return { breakdown, totalCommission }
}

async function calculateCommissionsLegacy(
  supabase: SClient,
  employeeId: string,
  periodStart: string,
  periodEnd: string,
  startDate: Date,
  endDate: Date,
  employeeRate: number
): Promise<{ breakdown: CommissionBreakdown[]; totalCommission: number }> {
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

  const allServiceIds = new Set<string>()
  for (const apt of appointments || []) {
    for (const as of apt.appointment_services || []) {
      allServiceIds.add(as.service_id)
    }
  }

  const { data: allServices } = await supabase
    .from('services')
    .select('id, name, price, has_commission')
    .in('id', [...allServiceIds])

  const serviceMap = new Map<string, ServiceRow>(
    (allServices || []).map(s => [s.id, s as ServiceRow])
  )

  const { data: allEmpServices } = await supabase
    .from('employee_services')
    .select('service_id, commission_rate, price_override')
    .eq('employee_id', employeeId)
    .in('service_id', [...allServiceIds])

  const empServiceMap = new Map(
    (allEmpServices || []).map(es => [es.service_id, es])
  )

  const breakdown: CommissionBreakdown[] = []
  let totalCommission = 0

  for (const apt of appointments || []) {
    if (!apt.is_commissionable) continue

    for (const as of apt.appointment_services || []) {
      const svc = serviceMap.get(as.service_id)
      if (!svc || !svc.has_commission) continue

      const empService = empServiceMap.get(as.service_id)
      const price = empService?.price_override ?? svc.price
      const rate = empService?.commission_rate ?? employeeRate ?? 0
      const commission = Number((price * (rate / 100)).toFixed(2))

      breakdown.push({
        appointment_id: apt.id,
        date: apt.start_time,
        service_name: svc.name,
        service_price: price,
        commission_rate: rate,
        commission_amount: commission,
      })

      totalCommission += commission
    }
  }

  return { breakdown, totalCommission }
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

  const emp = employee as EmployeeRow
  const defaultRate = emp.percentage ?? 0

  const startDate = new Date(periodStart)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(periodEnd)
  endDate.setHours(23, 59, 59, 999)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, start_time, is_commissionable')
    .eq('employee_id', employeeId)
    .eq('status', 'completed')
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: true })

  const appointmentIds = (appointments || []).map(a => a.id)

  // --- PATH 1: Event-first ---
  const eventsResult = await getCommissionsFromEvents(
    supabase, employeeId, appointmentIds, startDate, endDate
  )

  if (eventsResult) {
    // Reconciliation: run legacy in parallel and compare
    const legacyResult = await calculateCommissionsLegacy(
      supabase, employeeId, periodStart, periodEnd, startDate, endDate, defaultRate
    )

    const diff = Math.abs(eventsResult.totalCommission - legacyResult.totalCommission)
    if (diff > 0.01) {
      appLog('warn', '[calculateCommission] reconciliation drift', {
        employeeId,
        periodStart,
        periodEnd,
        eventsTotal: eventsResult.totalCommission,
        legacyTotal: legacyResult.totalCommission,
        difference: Number((eventsResult.totalCommission - legacyResult.totalCommission).toFixed(2)),
        sampleAppointmentIds: appointmentIds.slice(0, 5),
      })
    }

    const servicesTotal = eventsResult.breakdown.reduce((s, b) => s + b.service_price, 0)
    const dayGroups = buildDayGroups(eventsResult.breakdown)

    console.timeEnd(label)
    return {
      success: true,
      data: {
        employee_id: employeeId,
        period_start: periodStart,
        period_end: periodEnd,
        services: eventsResult.breakdown,
        total_services: Number(servicesTotal.toFixed(2)),
        total_commissionable: Number(servicesTotal.toFixed(2)),
        total_commission: Number(eventsResult.totalCommission.toFixed(2)),
        default_rate: defaultRate,
        payment_type: (emp.payment_type ?? 'porcentaje') as PaymentType,
        base_salary: emp.base_salary,
        dayGroups,
      },
    }
  }

  // --- PATH 2: Legacy fallback ---
  const legacy = await calculateCommissionsLegacy(
    supabase, employeeId, periodStart, periodEnd, startDate, endDate, defaultRate
  )

  const servicesTotal = legacy.breakdown.reduce((s, b) => s + b.service_price, 0)
  const dayGroups = buildDayGroups(legacy.breakdown)

  console.timeEnd(label)
  return {
    success: true,
    data: {
      employee_id: employeeId,
      period_start: periodStart,
      period_end: periodEnd,
      services: legacy.breakdown,
      total_services: Number(servicesTotal.toFixed(2)),
      total_commissionable: Number(servicesTotal.toFixed(2)),
      total_commission: Number(legacy.totalCommission.toFixed(2)),
      default_rate: defaultRate,
      payment_type: (emp.payment_type ?? 'porcentaje') as PaymentType,
      base_salary: emp.base_salary,
      dayGroups,
    },
  }
}

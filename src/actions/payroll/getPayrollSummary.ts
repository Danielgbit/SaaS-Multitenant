'use server'

import { createClient } from '@/lib/supabase/server'
import type { PayrollReceipt, PeriodType } from '@/types/payroll'

export type PayrollSummary = {
  employeeCount: number
  employeesWithCommission: number
  employeesWithSalary: number
  pendingCommissionsTotal: number
  pendingLoansTotal: number
  recentReceipts: PayrollReceipt[]
}

export async function getPayrollSummary(
  organizationId: string,
  periodStart?: string,
  periodEnd?: string
): Promise<{
  success: boolean
  data?: PayrollSummary
  error?: string
}> {
  const label = `[payroll] getPayrollSummary`
  console.time(label)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.timeEnd(label)
    return { success: false, error: 'No autorizado' }
  }

  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const startDate = periodStart || monday.toISOString().split('T')[0]
  const endDate = periodEnd || sunday.toISOString().split('T')[0]

  const { data: employees } = await (supabase as any)
    .from('employees')
    .select('id, default_commission_rate, payment_type, fixed_salary')
    .eq('organization_id', organizationId)
    .eq('active', true)

  if (!employees || employees.length === 0) {
    return {
      success: true,
      data: {
        employeeCount: 0,
        employeesWithCommission: 0,
        employeesWithSalary: 0,
        pendingCommissionsTotal: 0,
        pendingLoansTotal: 0,
        recentReceipts: [],
      },
    }
  }

  const employeesWithCommission = employees.filter(
    (e: any) => e.payment_type === 'commission' || e.payment_type === 'mixed'
  ).length

  const employeesWithSalary = employees.filter(
    (e: any) => e.payment_type === 'salary' || e.payment_type === 'mixed'
  ).length

  const employeeIds = employees.map((e: any) => e.id)

  // Batch fetch all appointments with their services
  const { data: appointments } = await (supabase as any)
    .from('appointments')
    .select(`
      id,
      employee_id,
      start_time,
      status,
      is_commissionable,
      appointment_services (
        service_id
      )
    `)
    .in('employee_id', employeeIds)
    .eq('status', 'completed')
    .eq('is_commissionable', true)
    .gte('start_time', startDate)
    .lte('start_time', endDate)

  // Collect all unique service_ids and (employee_id, service_id) pairs for batch lookup
  const allServiceIds = new Set<string>()
  const empServiceKeys = new Set<string>()
  
  for (const apt of appointments || []) {
    for (const as of apt.appointment_services || []) {
      allServiceIds.add(as.service_id)
      empServiceKeys.add(`${apt.employee_id}:${as.service_id}`)
    }
  }

  // Batch fetch all services in ONE query
  const { data: allServices } = await (supabase as any)
    .from('services')
    .select('id, price, has_commission')
    .in('id', [...allServiceIds])

  const serviceMap = new Map(
    (allServices || []).map((s: any) => [s.id, s])
  )

  // Batch fetch all employee_services in ONE query
  const employeeServicePairs = Array.from(empServiceKeys).map(key => {
    const [employee_id, service_id] = key.split(':')
    return { employee_id, service_id }
  })

  const { data: allEmpServices } = await (supabase as any)
    .from('employee_services')
    .select('employee_id, service_id, price_override, commission_rate')
    .in('employee_id', employeeIds)
    .in('service_id', [...allServiceIds])

  const empServiceMap = new Map(
    (allEmpServices || []).map((es: any) => [`${es.employee_id}:${es.service_id}`, es])
  )

  // Now compute commissions with O(1) lookups instead of N+1 queries
  let totalCommission = 0

  for (const apt of appointments || []) {
    const employee = employees.find((e: any) => e.id === apt.employee_id)
    if (!employee) continue

    for (const as of apt.appointment_services || []) {
      const service = serviceMap.get(as.service_id)
      if (!service || !(service as any).has_commission) continue

      const empService = empServiceMap.get(`${apt.employee_id}:${as.service_id}`)
      const price = (empService as any)?.price_override || (service as any).price
      const rate = (empService as any)?.commission_rate || employee.default_commission_rate
      totalCommission += price * (rate / 100)
    }
  }

  const { data: pendingLoans } = await (supabase as any)
    .from('employee_loans')
    .select('remaining_amount')
    .in('employee_id', employeeIds)
    .in('status', ['pending', 'partial'])

  const pendingLoansTotal = (pendingLoans || []).reduce(
    (sum: number, loan: any) => sum + loan.remaining_amount,
    0
  )

  const { data: recentReceipts } = await (supabase as any)
    .from('payroll_receipts')
    .select('*')
    .eq('organization_id', organizationId)
    .in('employee_id', employeeIds)
    .order('created_at', { ascending: false })
    .limit(5)

  console.timeEnd(label)
  console.log(`${label} → appointments: ${(appointments || []).length}, services: ${allServiceIds.size}, queries: 5 (batched)`)

  return {
    success: true,
    data: {
      employeeCount: employees.length,
      employeesWithCommission,
      employeesWithSalary,
      pendingCommissionsTotal: Math.round(totalCommission),
      pendingLoansTotal: Math.round(pendingLoansTotal),
      recentReceipts: (recentReceipts || []) as PayrollReceipt[],
    },
  }
}

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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
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

  let totalCommission = 0

  for (const apt of appointments || []) {
    const employee = employees.find((e: any) => e.id === apt.employee_id)
    if (!employee) continue

    const serviceIds = (apt.appointment_services || []).map((as: any) => as.service_id)
    if (serviceIds.length === 0) continue

    const { data: services } = await (supabase as any)
      .from('services')
      .select('id, price, has_commission')
      .in('id', serviceIds)

    for (const service of services || []) {
      if (!service.has_commission) continue

      const { data: empService } = await (supabase as any)
        .from('employee_services')
        .select('price_override, commission_rate')
        .eq('employee_id', apt.employee_id)
        .eq('service_id', service.id)
        .single()

      const price = empService?.price_override || service.price
      const rate = empService?.commission_rate || employee.default_commission_rate
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

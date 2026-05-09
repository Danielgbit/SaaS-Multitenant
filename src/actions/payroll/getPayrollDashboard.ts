'use server'

import { createClient } from '@/lib/supabase/server'
import type { PayrollDashboardSummary, PeriodEmployeeSummary } from '@/types/payroll'

async function enrichPeriodEmployees(supabase: any, period: any) {
  if (!period) return period
  const { data: items } = await (supabase as any)
    .from('payroll_items')
    .select(`
      employee_id,
      total_services,
      net_pay,
      contract_type,
      payment_type,
      employee:employees(name, percentage)
    `)
    .eq('payroll_period_id', period.id)

  const employees: PeriodEmployeeSummary[] = (items || []).map((item: any) => ({
    id: item.employee_id,
    name: item.employee?.name || 'Empleado',
    services_count: item.total_services || 0,
    net_pay: item.net_pay || 0,
    contract_type: item.contract_type || 'prestacion',
    payment_type: item.payment_type || 'porcentaje',
    commission_rate: item.employee?.percentage || 60,
  }))

  return { ...period, employees }
}

export async function getPayrollDashboard(organizationId: string): Promise<{
  success: boolean
  data?: PayrollDashboardSummary
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Get current month period
  const now = new Date()
  const currentPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`

  // Get all periods for org, ordered by period desc
  const { data: periods, error } = await (supabase as any)
    .from('payroll_periods')
    .select('*')
    .eq('organization_id', organizationId)
    .order('period', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  // Find current period (same month)
  const currentPeriodRecord = periods?.find((p: any) => p.period === currentPeriod) || null

  // Calculate pending totals (draft + approved)
  const pendingPeriods = periods?.filter((p: any) => p.status === 'draft' || p.status === 'approved') || []

  const totalPendingNet = pendingPeriods.reduce((sum: number, p: any) => sum + (p.total_net_pay || 0), 0)
  const totalPendingEmployees = pendingPeriods.reduce((sum: number, p: any) => sum + (p.total_employees || 0), 0)

  // Count employees ready to pay (approved status)
  const employeesReadyToPay = periods
    ?.filter((p: any) => p.status === 'approved')
    .reduce((sum: number, p: any) => sum + (p.total_employees || 0), 0) || 0

  // Previous periods (last 6) and enrich all periods with employee data
  const previousPeriods = periods?.filter((p: any) => p.status === 'paid').slice(0, 6) || []

  const enrichedCurrent = currentPeriodRecord ? await enrichPeriodEmployees(supabase, currentPeriodRecord) : null
  const enrichedPending = await Promise.all(pendingPeriods.map((p: any) => enrichPeriodEmployees(supabase, p)))
  const enrichedPrevious = await Promise.all(previousPeriods.map((p: any) => enrichPeriodEmployees(supabase, p)))

  // Get total employee debt
  const { data: loanData } = await (supabase as any)
    .from('employee_loans')
    .select('remaining_amount')
    .eq('organization_id', organizationId)
    .in('status', ['pending', 'partial'])

  const totalEmployeeDebt = (loanData || []).reduce(
    (sum: number, l: any) => sum + (l.remaining_amount || 0), 0
  )

  return {
    success: true,
    data: {
      current_period: enrichedCurrent,
      previous_periods: enrichedPrevious,
      pending_periods: enrichedPending,
      total_pending_net: totalPendingNet,
      total_pending_employees: totalPendingEmployees,
      employees_ready_to_pay: employeesReadyToPay,
      total_employee_debt: totalEmployeeDebt,
    },
  }
}

export async function getPayrollPeriods(organizationId: string, limit = 12): Promise<{
  success: boolean
  data?: PayrollPeriod[]
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('payroll_periods')
    .select('*')
    .eq('organization_id', organizationId)
    .order('period', { ascending: false })
    .limit(limit)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as PayrollPeriod[] }
}

export async function getPayrollPeriodById(periodId: string): Promise<{
  success: boolean
  data?: PayrollPeriod
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('payroll_periods')
    .select('*')
    .eq('id', periodId)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as PayrollPeriod }
}
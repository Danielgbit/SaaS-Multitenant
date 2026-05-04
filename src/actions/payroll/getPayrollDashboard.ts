'use server'

import { createClient } from '@/lib/supabase/server'
import type { PayrollDashboardSummary, PayrollPeriod } from '@/types/payroll'

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

  // Previous periods (last 6)
  const previousPeriods = periods?.filter((p: any) => p.status === 'paid').slice(0, 6) || []

  return {
    success: true,
    data: {
      current_period: currentPeriodRecord,
      previous_periods: previousPeriods as PayrollPeriod[],
      pending_periods: pendingPeriods as PayrollPeriod[],
      total_pending_net: totalPendingNet,
      total_pending_employees: totalPendingEmployees,
      employees_ready_to_pay: employeesReadyToPay,
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
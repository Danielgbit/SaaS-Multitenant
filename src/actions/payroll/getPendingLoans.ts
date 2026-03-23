'use server'

import { createClient } from '@/lib/supabase/server'
import type { PendingLoanSummary, EmployeeDebtInfo } from '@/types/payroll'

export async function getPendingLoans(
  employeeId: string
): Promise<{
  success: boolean
  data?: PendingLoanSummary[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data, error } = await (supabase as any)
    .from('employee_loans')
    .select('id, remaining_amount, concept, created_at')
    .eq('employee_id', employeeId)
    .in('status', ['pending', 'partial'])
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  const loans = (data || []).map((loan: any) => ({
    id: loan.id,
    amount: loan.amount,
    remaining_amount: loan.remaining_amount,
    concept: loan.concept,
    created_at: loan.created_at,
  }))

  return { success: true, data: loans }
}

export async function getEmployeeDebtInfo(
  employeeId: string
): Promise<{
  success: boolean
  data?: EmployeeDebtInfo
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: employee } = await (supabase as any)
    .from('employees')
    .select('max_debt_limit, debt_warning_threshold')
    .eq('id', employeeId)
    .single()

  if (!employee) {
    return { success: false, error: 'Empleado no encontrado' }
  }

  const { data: loans } = await (supabase as any)
    .from('employee_loans')
    .select('id, remaining_amount, concept, created_at, amount')
    .eq('employee_id', employeeId)
    .in('status', ['pending', 'partial'])

  const loansList: PendingLoanSummary[] = (loans || []).map((loan: any) => ({
    id: loan.id,
    amount: loan.amount,
    remaining_amount: loan.remaining_amount,
    concept: loan.concept,
    created_at: loan.created_at,
  }))

  const totalPending = loansList.reduce((sum, l) => sum + l.remaining_amount, 0)
  const limit = employee.max_debt_limit || null
  const warningThreshold = employee.debt_warning_threshold || 80

  const isOverLimit = limit ? totalPending > limit : false
  const isAtWarningThreshold = limit
    ? totalPending >= limit * (warningThreshold / 100)
    : false

  return {
    success: true,
    data: {
      total_pending: totalPending,
      loans: loansList,
      limit,
      warning_threshold: warningThreshold,
      is_over_limit: isOverLimit,
      is_at_warning_threshold: isAtWarningThreshold,
    },
  }
}

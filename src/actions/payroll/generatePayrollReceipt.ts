'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { calculateCommission } from './calculateCommission'
import { getPendingLoans } from './getPendingLoans'
import type { PayrollReceipt, PeriodType } from '@/types/payroll'

const GenerateReceiptSchema = z.object({
  employee_id: z.string().uuid('ID de empleado inválido'),
  period_start: z.string(),
  period_end: z.string(),
  period_type: z.enum(['weekly', 'biweekly', 'monthly', 'adhoc'] as const),
  deduct_loans: z.boolean().default(false),
  deduct_amount: z.number().optional(),
  is_salary_separate: z.boolean().default(false),
})

function toPeriodKey(dateStr: string): string {
  return dateStr.substring(0, 7)
}

export async function generatePayrollReceipt(input: {
  employee_id: string
  period_start: string
  period_end: string
  period_type: PeriodType
  deduct_loans?: boolean
  deduct_amount?: number
  is_salary_separate?: boolean
}): Promise<{
  success: boolean
  data?: PayrollReceipt
  error?: string
}> {
  const parsed = GenerateReceiptSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!orgMember) {
    return { success: false, error: 'No se encontró organización' }
  }

  const organizationId = orgMember.organization_id

  const commissionResult = await calculateCommission(
    input.employee_id,
    input.period_start,
    input.period_end
  )

  if (!commissionResult.success || !commissionResult.data) {
    return { success: false, error: commissionResult.error }
  }

  const commission = commissionResult.data

  const loansResult = await getPendingLoans(input.employee_id)
  const pendingLoans = loansResult.data || []

  let loansDeducted = 0
  const loansToApply: { loan_id: string; amount: number }[] = []

  if (input.deduct_loans && pendingLoans.length > 0) {
    const totalPending = pendingLoans.reduce(
      (sum, l) => sum + l.remaining_amount,
      0
    )
    const deductAmount = input.deduct_amount || totalPending

    let remaining = deductAmount
    for (const loan of pendingLoans) {
      if (remaining <= 0) break
      const deducted = Math.min(remaining, loan.remaining_amount)
      loansDeducted += deducted
      remaining -= deducted
      loansToApply.push({ loan_id: loan.id, amount: deducted })
    }
  }

  const grossServices = commission.total_services
  const commissionAmount = commission.total_commission
  const fixedSalary = commission.base_salary || 0

  let netAmount: number
  if (commission.payment_type === 'fijo') {
    netAmount = fixedSalary - loansDeducted
  } else if (commission.payment_type === 'mixed') {
    if (input.is_salary_separate) {
      netAmount = commissionAmount - loansDeducted
    } else {
      netAmount = fixedSalary + commissionAmount - loansDeducted
    }
  } else {
    netAmount = commissionAmount - loansDeducted
  }

  // --- V2: Find or create payroll_period ---
  const periodKey = toPeriodKey(input.period_start)

  const { data: existingPeriod } = await supabase
    .from('payroll_periods')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('period', periodKey)
    .maybeSingle()

  let payrollPeriodId: string

  if (existingPeriod) {
    payrollPeriodId = existingPeriod.id
  } else {
    const { data: newPeriod, error: periodError } = await supabase
      .from('payroll_periods')
      .insert({
        organization_id: organizationId,
        period: periodKey,
        status: 'draft',
      })
      .select('id')
      .single()

    if (periodError) {
      return { success: false, error: periodError.message }
    }

    payrollPeriodId = newPeriod.id
  }

  // --- V2: Upsert payroll_item ---
  const grossPay = commission.payment_type === 'fijo'
    ? fixedSalary
    : commission.payment_type === 'mixed' && input.is_salary_separate
      ? commissionAmount
      : fixedSalary + commissionAmount

  const { data: payrollItem, error: itemError } = await supabase
    .from('payroll_items')
    .upsert({
      payroll_period_id: payrollPeriodId,
      employee_id: input.employee_id,
      contract_type: 'commission',
      payment_type: commission.payment_type || 'porcentaje',
      total_services: grossServices,
      gross_commission: commissionAmount,
      base_salary: fixedSalary,
      salary_frequency: null,
      has_transport_subsidy: false,
      transport_subsidy_amount: 0,
      health_deduction: 0,
      pension_deduction: 0,
      total_deductions: loansDeducted,
      gross_pay: grossPay,
      net_pay: netAmount,
      loans_deducted: loansDeducted,
      notes: null,
    }, {
      onConflict: 'payroll_period_id,employee_id',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  if (itemError) {
    return { success: false, error: itemError.message }
  }

  // --- V2: Insert period_commissions ---
  const periodCommissions = commission.services.map(s => ({
    payroll_item_id: payrollItem.id,
    appointment_id: s.appointment_id,
    service_date: s.date,
    service_name: s.service_name,
    service_value: s.service_price,
    percentage_applied: s.commission_rate,
    commission_amount: s.commission_amount,
  }))

  if (periodCommissions.length > 0) {
    const { error: pcError } = await supabase
      .from('period_commissions')
      .insert(periodCommissions)

    if (pcError) {
      console.error('[generatePayrollReceipt] Error inserting period_commissions:', pcError.message)
    }
  }

  // --- V2: Insert payroll_item_loans ---
  for (const loanApply of loansToApply) {
    const { error: pilError } = await supabase
      .from('payroll_item_loans')
      .insert({
        payroll_item_id: payrollItem.id,
        loan_id: loanApply.loan_id,
        amount_deducted: loanApply.amount,
      })

    if (pilError) {
      console.error('[generatePayrollReceipt] Error inserting payroll_item_loans:', pilError.message)
    }

    const { data: loan } = await supabase
      .from('employee_loans')
      .select('remaining_amount')
      .eq('id', loanApply.loan_id)
      .single()

    if (loan) {
      const newRemaining = loan.remaining_amount - loanApply.amount
      await supabase
        .from('employee_loans')
        .update({
          remaining_amount: newRemaining,
          status: newRemaining <= 0 ? 'paid' : 'partial',
        })
        .eq('id', loanApply.loan_id)
    }
  }

  revalidatePath('/payroll')
  revalidatePath(`/payroll/${input.employee_id}`)
  revalidatePath('/employees')

  const receipt: PayrollReceipt = {
    id: payrollItem.id,
    employee_id: input.employee_id,
    organization_id: organizationId,
    payroll_period_id: payrollPeriodId,
    payment_date: new Date().toISOString().split('T')[0],
    period_type: input.period_type,
    period_start: input.period_start,
    period_end: input.period_end,
    status: 'pending',
    gross_services_value: grossServices,
    commission_amount: commissionAmount,
    fixed_salary_amount: fixedSalary,
    loans_deducted: loansDeducted,
    net_amount: netAmount,
    is_salary_separate: input.is_salary_separate || false,
    notes: null,
    created_at: payrollItem.created_at,
    updated_at: payrollItem.updated_at,
  }

  return { success: true, data: receipt }
}

/**
 * Reads payroll history from V2 canonical tables (payroll_items + payroll_periods).
 */
export async function getPayrollReceipts(
  employeeId: string
): Promise<{
  success: boolean
  data?: PayrollReceipt[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: items, error } = await supabase
    .from('payroll_items')
    .select(`
      id,
      employee_id,
      net_pay,
      total_services,
      gross_commission,
      base_salary,
      loans_deducted,
      total_deductions,
      gross_pay,
      notes,
      created_at,
      updated_at,
      payroll_period_id,
      payroll_periods!inner(
        id,
        organization_id,
        period,
        status,
        created_at
      )
    `)
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  const receipts: PayrollReceipt[] = (items || []).map((item: any) => ({
    id: item.id,
    employee_id: item.employee_id,
    organization_id: item.payroll_periods?.organization_id || '',
    payroll_period_id: item.payroll_period_id,
    payment_date: item.payroll_periods?.period || '',
    period_type: 'monthly' as PeriodType,
    period_start: item.payroll_periods?.period
      ? `${item.payroll_periods.period}-01`
      : '',
    period_end: item.payroll_periods?.period
      ? (() => {
          const [y, m] = item.payroll_periods.period.split('-').map(Number)
          const lastDay = new Date(y, m, 0).getDate()
          return `${item.payroll_periods.period}-${String(lastDay).padStart(2, '0')}`
        })()
      : '',
    status: item.payroll_periods?.status === 'paid' ? 'paid' : 'pending',
    gross_services_value: item.total_services || 0,
    commission_amount: item.gross_commission || 0,
    fixed_salary_amount: item.base_salary || 0,
    loans_deducted: item.loans_deducted || 0,
    net_amount: item.net_pay || 0,
    is_salary_separate: false,
    notes: item.notes,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }))

  return { success: true, data: receipts }
}

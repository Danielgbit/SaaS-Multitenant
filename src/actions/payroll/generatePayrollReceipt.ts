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
  const fixedSalary = commission.fixed_salary || 0

  let netAmount: number
  if (commission.payment_type === 'salary') {
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

  const { data: receipt, error: receiptError } = await (supabase as any)
    .from('payroll_receipts')
    .insert({
      employee_id: input.employee_id,
      organization_id: orgMember.organization_id,
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
    })
    .select()
    .single()

  if (receiptError) {
    return { success: false, error: receiptError.message }
  }

  const receiptServices = commission.services.map(s => ({
    receipt_id: receipt.id,
    appointment_id: s.appointment_id,
    service_name: s.service_name,
    service_price: s.service_price,
    commission_rate_applied: s.commission_rate,
    commission_amount: s.commission_amount,
  }))

  if (receiptServices.length > 0) {
    await (supabase as any)
      .from('payroll_receipt_services')
      .insert(receiptServices)
  }

  for (const loanApply of loansToApply) {
    await (supabase as any)
      .from('payroll_receipt_loans')
      .insert({
        receipt_id: receipt.id,
        loan_id: loanApply.loan_id,
        amount_deducted: loanApply.amount,
      })

    const { data: loan } = await (supabase as any)
      .from('employee_loans')
      .select('remaining_amount')
      .eq('id', loanApply.loan_id)
      .single()

    if (loan) {
      const newRemaining = loan.remaining_amount - loanApply.amount
      await (supabase as any)
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

  return { success: true, data: receipt as PayrollReceipt }
}

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

  const { data, error } = await (supabase as any)
    .from('payroll_receipts')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as PayrollReceipt[] }
}

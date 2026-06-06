'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@db/supabase'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

export async function approvePayrollPeriod(periodId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: period } = await supabase
    .from('payroll_periods')
    .select('id, organization_id, status')
    .eq('id', periodId)
    .single()

  if (!period) {
    return { success: false, error: 'Período no encontrado' }
  }

  if (period.status !== 'draft') {
    return { success: false, error: 'Solo se pueden aprobar períodos en estado draft' }
  }

  const access = await requireOrgAccess(period.organization_id, ['owner', 'admin'])
  if (!access.success) return access

  const { error } = await supabase
    .from('payroll_periods')
    .update({ status: 'approved' })
    .eq('id', periodId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/nomina')
  revalidatePath(`/nomina/periodo/${periodId}`)

  return { success: true }
}

export async function markPayrollPeriodAsPaid(
  periodId: string,
  paymentMethod?: string,
  paymentReference?: string
): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: period } = await supabase
    .from('payroll_periods')
    .select('id, organization_id, status')
    .eq('id', periodId)
    .single()

  if (!period) {
    return { success: false, error: 'Período no encontrado' }
  }

  if (period.status !== 'approved') {
    return { success: false, error: 'Solo se pueden marcar como pagados períodos en estado approved' }
  }

  const access = await requireOrgAccess(period.organization_id, ['owner', 'admin'])
  if (!access.success) return access

  const updateData: Database['public']['Tables']['payroll_periods']['Update'] = { status: 'paid' }

  const { error } = await supabase
    .from('payroll_periods')
    .update(updateData)
    .eq('id', periodId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/nomina')
  revalidatePath(`/nomina/periodo/${periodId}`)

  return { success: true }
}

export async function deletePayrollPeriod(periodId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: period } = await supabase
    .from('payroll_periods')
    .select('id, organization_id, status')
    .eq('id', periodId)
    .single()

  if (!period) {
    return { success: false, error: 'Período no encontrado' }
  }

  if (period.status === 'paid') {
    return { success: false, error: 'No se pueden eliminar períodos que ya fueron pagados' }
  }

  const access = await requireOrgAccess(period.organization_id, ['owner', 'admin'])
  if (!access.success) return access

  // Delete will cascade to payroll_items, period_commissions, payroll_item_loans
  const { error } = await supabase
    .from('payroll_periods')
    .delete()
    .eq('id', periodId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/nomina')

  return { success: true }
}

// Unified manager for payroll period actions
export type PayrollPeriodAction = 'approve' | 'markPaid' | 'delete'

export async function managePayrollPeriod(input: {
  periodId: string
  action: PayrollPeriodAction
  paymentMethod?: string
  paymentReference?: string
}): Promise<{
  success: boolean
  error?: string
}> {
  switch (input.action) {
    case 'approve':
      return approvePayrollPeriod(input.periodId)
    case 'markPaid':
      return markPayrollPeriodAsPaid(input.periodId, input.paymentMethod, input.paymentReference)
    case 'delete':
      return deletePayrollPeriod(input.periodId)
    default:
      return { success: false, error: 'Acción no válida' }
  }
}
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approvePayrollPeriod(periodId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Get period to verify ownership
  const { data: period } = await (supabase as any)
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

  // Check if user is owner/admin of this org
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', period.organization_id)
    .single()

  if (!orgMember || !['owner', 'admin'].includes(orgMember.role)) {
    return { success: false, error: 'Solo owners/admins pueden aprobar períodos' }
  }

  const { error } = await (supabase as any)
    .from('payroll_periods')
    .update({ status: 'approved' })
    .eq('id', periodId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/payroll')
  revalidatePath(`/payroll/${periodId}`)

  return { success: true }
}

export async function markPayrollPeriodAsPaid(periodId: string, paymentDate?: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Get period
  const { data: period } = await (supabase as any)
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

  // Check if user is owner/admin
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', period.organization_id)
    .single()

  if (!orgMember || !['owner', 'admin'].includes(orgMember.role)) {
    return { success: false, error: 'Solo owners/admins pueden marcar períodos como pagados' }
  }

  const updateData: Record<string, any> = { status: 'paid' }
  if (paymentDate) {
    updateData.notes = `Pagado el ${paymentDate}`
  }

  const { error } = await (supabase as any)
    .from('payroll_periods')
    .update(updateData)
    .eq('id', periodId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/payroll')
  revalidatePath(`/payroll/${periodId}`)

  return { success: true }
}

export async function deletePayrollPeriod(periodId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  // Get period
  const { data: period } = await (supabase as any)
    .from('payroll_periods')
    .select('id, organization_id, status')
    .eq('id', periodId)
    .single()

  if (!period) {
    return { success: false, error: 'Período no encontrado' }
  }

  if (period.status !== 'draft') {
    return { success: false, error: 'Solo se pueden eliminar períodos en estado draft' }
  }

  // Check if user is owner/admin
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', period.organization_id)
    .single()

  if (!orgMember || !['owner', 'admin'].includes(orgMember.role)) {
    return { success: false, error: 'Solo owners/admins pueden eliminar períodos' }
  }

  // Delete will cascade to payroll_items, period_commissions, payroll_item_loans
  const { error } = await (supabase as any)
    .from('payroll_periods')
    .delete()
    .eq('id', periodId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/payroll')

  return { success: true }
}
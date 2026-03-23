'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UpdateEmployeePayrollInput, PaymentType, SalaryFrequency } from '@/types/employees'

export async function updateEmployeePayroll(
  input: UpdateEmployeePayrollInput
): Promise<{
  success: boolean
  error?: string
}> {
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

  const updateData: Record<string, any> = {}

  if (input.default_commission_rate !== undefined) {
    updateData.default_commission_rate = input.default_commission_rate
  }
  if (input.payment_type !== undefined) {
    updateData.payment_type = input.payment_type
  }
  if (input.fixed_salary !== undefined) {
    updateData.fixed_salary = input.fixed_salary
  }
  if (input.salary_frequency !== undefined) {
    updateData.salary_frequency = input.salary_frequency
  }
  if (input.max_debt_limit !== undefined) {
    updateData.max_debt_limit = input.max_debt_limit
  }
  if (input.debt_warning_threshold !== undefined) {
    updateData.debt_warning_threshold = input.debt_warning_threshold
  }

  const { error } = await (supabase as any)
    .from('employees')
    .update(updateData)
    .eq('id', input.id)
    .eq('organization_id', orgMember.organization_id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/employees')
  revalidatePath(`/employees/${input.id}`)
  revalidatePath('/payroll')

  return { success: true }
}

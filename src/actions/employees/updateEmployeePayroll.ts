'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Database } from '@db/supabase'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

const UpdateEmployeePayrollSchema = z.object({
  id: z.string().uuid(),
  default_commission_rate: z.number().min(0).max(100).optional(),
  payment_type: z.enum(['fijo', 'porcentaje', 'mixed']).optional(),
  contract_type: z.enum(['laboral', 'prestacion']).optional(),
  base_salary: z.number().min(0).nullable().optional(),
  has_transport_subsidy: z.boolean().optional(),
  force_transport_subsidy: z.boolean().optional(),
  salary_frequency: z.enum(['weekly', 'biweekly', 'monthly']).nullable().optional(),
  max_debt_limit: z.number().min(0).optional(),
  debt_warning_threshold: z.number().min(0).max(100).optional(),
  employment_type: z.enum(['full_time', 'part_time']).optional(),
  part_time_percentage: z.number().min(1).max(100).optional(),
})

export async function updateEmployeePayroll(input: {
  id: string
  default_commission_rate?: number
  payment_type?: 'fijo' | 'porcentaje' | 'mixed'
  contract_type?: 'laboral' | 'prestacion'
  base_salary?: number | null
  has_transport_subsidy?: boolean
  force_transport_subsidy?: boolean
  salary_frequency?: 'weekly' | 'biweekly' | 'monthly' | null
  max_debt_limit?: number
  debt_warning_threshold?: number
  employment_type?: 'full_time' | 'part_time'
  part_time_percentage?: number
}): Promise<{ success: boolean; error?: string }> {
  const parsed = UpdateEmployeePayrollSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()

  // Get employee to verify organization
  const { data: employee } = await supabase
    .from('employees')
    .select('organization_id')
    .eq('id', input.id)
    .single()

  if (!employee) {
    return { success: false, error: 'Empleado no encontrado' }
  }

  const access = await requireOrgAccess(employee.organization_id, ['owner', 'admin', 'staff'])
  if (!access.success) return access

  const updateData: Database['public']['Tables']['employees']['Update'] = {}

  if (input.default_commission_rate !== undefined) {
    updateData.percentage = input.default_commission_rate
  }
  if (input.payment_type !== undefined) {
    updateData.payment_type = input.payment_type
  }
  if (input.contract_type !== undefined) {
    updateData.contract_type = input.contract_type
  }
  if (input.base_salary !== undefined) {
    updateData.base_salary = input.base_salary
  }
  if (input.has_transport_subsidy !== undefined) {
    updateData.has_transport_subsidy = input.has_transport_subsidy
  }
  if (input.force_transport_subsidy !== undefined) {
    updateData.force_transport_subsidy = input.force_transport_subsidy
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
  if (input.employment_type !== undefined) {
    updateData.employment_type = input.employment_type
  }
  if (input.part_time_percentage !== undefined) {
    updateData.part_time_percentage = input.part_time_percentage
  }

  const { error } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', input.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/employees')
  revalidatePath(`/employees/${input.id}`)

  return { success: true }
}
'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@db/supabase'
import { z } from 'zod'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { Database } from '@db/supabase'

const UpdatePayrollItemSchema = z.object({
  itemId: z.string().uuid('ID de item inválido'),
  changes: z.object({
    contract_type: z.enum(['laboral', 'prestacion']).optional(),
    payment_type: z.enum(['fijo', 'porcentaje', 'mixed']).optional(),
    base_salary: z.number().min(0).optional(),
    percentage: z.number().min(0).max(100).optional(),
  })
})

export async function updatePayrollItem(input: z.infer<typeof UpdatePayrollItemSchema>) {
  const parsed = UpdatePayrollItemSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { itemId, changes } = parsed.data

  const supabase = await createClient()

  const { data: item } = await supabase
    .from('payroll_items')
    .select('id, payroll_period_id, employee_id')
    .eq('id', itemId)
    .single()

  if (!item) {
    return { success: false, error: 'Item no encontrado' }
  }

  const { data: period } = await supabase
    .from('payroll_periods')
    .select('organization_id, status')
    .eq('id', item.payroll_period_id)
    .single()

  if (!period) {
    return { success: false, error: 'Período no encontrado' }
  }

  if (period.status !== 'draft') {
    return { success: false, error: 'Solo se pueden editar items de períodos en borrador' }
  }

  const access = await requireOrgAccess(period.organization_id, ['owner', 'admin'])
  if (!access.success) return access

  const updateData: Database['public']['Tables']['payroll_items']['Update'] = {}

  if (changes.contract_type !== undefined) {
    updateData.contract_type = changes.contract_type
  }
  if (changes.payment_type !== undefined) {
    updateData.payment_type = changes.payment_type
  }
  if (changes.base_salary !== undefined) {
    updateData.base_salary = changes.base_salary
  }


  if (Object.keys(updateData).length === 0) {
    return { success: true }
  }

  const { error } = await supabase
    .from('payroll_items')
    .update(updateData)
    .eq('id', itemId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/nomina')
  revalidatePath(`/nomina/periodo/${item.payroll_period_id}`)

  return { success: true }
}

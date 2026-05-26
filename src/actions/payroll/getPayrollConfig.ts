'use server'

import { createClient } from '@/lib/supabase/server'
import type { PayrollConfig } from '@/types/payroll'

export async function getPayrollConfig(year: number): Promise<{
  success: boolean
  data?: PayrollConfig
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payroll_config')
    .select('*')
    .eq('year', year)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as PayrollConfig }
}

export async function getCurrentPayrollConfig(): Promise<{
  success: boolean
  data?: PayrollConfig
  error?: string
}> {
  const currentYear = new Date().getFullYear()
  return getPayrollConfig(currentYear)
}

export async function updatePayrollConfig(input: {
  year: number
  smmlv?: number
  transport_subsidy?: number
  health_rate?: number
  pension_rate?: number
}): Promise<{
  success: boolean
  data?: PayrollConfig
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!orgMember || !['owner', 'admin'].includes(orgMember.role)) {
    return { success: false, error: 'Solo owners/admins pueden actualizar la config' }
  }

  const updateData: Record<string, any> = {}
  if (input.smmlv !== undefined) updateData.smlv = input.smmlv
  if (input.transport_subsidy !== undefined) updateData.transport_subsidy = input.transport_subsidy
  if (input.health_rate !== undefined) updateData.health_rate = input.health_rate
  if (input.pension_rate !== undefined) updateData.pension_rate = input.pension_rate

  const { data, error } = await supabase
    .from('payroll_config')
    .update(updateData)
    .eq('year', input.year)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as PayrollConfig }
}
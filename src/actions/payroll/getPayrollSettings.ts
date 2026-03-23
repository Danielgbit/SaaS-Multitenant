'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { OrganizationPayrollSettings, UpdatePayrollSettingsInput, PayrollType } from '@/types/payroll'

export async function getPayrollSettings(organizationId: string): Promise<{
  success: boolean
  data?: OrganizationPayrollSettings
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data, error } = await (supabase as any)
    .from('organization_payroll_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { success: false, error: error.message }
  }

  if (!data) {
    const defaultSettings = {
      organization_id: organizationId,
      payroll_type: 'weekly' as PayrollType,
      week_starts_on: 1,
      month_day: 1,
      allow_advance_payments: true,
    }

    const { data: newData, error: insertError } = await (supabase as any)
      .from('organization_payroll_settings')
      .insert(defaultSettings)
      .select()
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    return { success: true, data: newData as OrganizationPayrollSettings }
  }

  return { success: true, data: data as OrganizationPayrollSettings }
}

export async function updatePayrollSettings(
  organizationId: string,
  input: UpdatePayrollSettingsInput
): Promise<{
  success: boolean
  data?: OrganizationPayrollSettings
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data, error } = await (supabase as any)
    .from('organization_payroll_settings')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/payroll/settings')

  return { success: true, data: data as OrganizationPayrollSettings }
}

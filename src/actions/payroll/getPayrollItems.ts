'use server'

import { createClient } from '@/lib/supabase/server'
import type { PayrollItemWithEmployee } from '@/types/payroll'

export async function getPayrollItems(periodId: string): Promise<{
  success: boolean
  data?: PayrollItemWithEmployee[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data, error } = await supabase
    .from('payroll_items')
    .select(`
      *,
      employee:employees (
        id,
        name,
        percentage
      )
    `)
    .eq('payroll_period_id', periodId)
    .order('employee(name)')

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as PayrollItemWithEmployee[] }
}

export async function getPayrollItemById(itemId: string): Promise<{
  success: boolean
  data?: PayrollItemWithEmployee
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data, error } = await supabase
    .from('payroll_items')
    .select(`
      *,
      employee:employees (
        id,
        name
      )
    `)
    .eq('id', itemId)
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as PayrollItemWithEmployee }
}

export async function getPeriodCommissions(itemId: string): Promise<{
  success: boolean
  data?: any[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data, error } = await supabase
    .from('period_commissions')
    .select('*')
    .eq('payroll_item_id', itemId)
    .order('service_date', { ascending: true })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
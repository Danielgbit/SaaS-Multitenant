'use server'

import { createClient } from '@/lib/supabase/server'
import type { ClientAccountWithClient, ClientWithCreditInfo } from '@/types/clientAccounts'

export async function getClientAccounts(
  organizationId: string
): Promise<{
  success: boolean
  data?: ClientAccountWithClient[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: accounts, error } = await (supabase as any)
    .from('client_accounts')
    .select(`
      *,
      client:clients!client_id (
        id,
        name,
        phone,
        email
      )
    `)
    .eq('organization_id', organizationId)
    .order('balance', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    data: accounts.filter((a: any) => a.balance > 0 || a.total_purchased > 0),
  }
}

export async function getClientAccountsSummary(
  organizationId: string
): Promise<{
  success: boolean
  data?: {
    total_balance: number
    total_credit_used: number
    total_credit_available: number
    clients_with_balance: number
    clients_at_warning: number
    clients_over_limit: number
  }
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: accounts, error } = await (supabase as any)
    .from('client_accounts')
    .select('balance, credit_limit, is_over_limit, is_at_warning_threshold')
    .eq('organization_id', organizationId)

  if (error) {
    return { success: false, error: error.message }
  }

  const summary = {
    total_balance: 0,
    total_credit_used: 0,
    total_credit_available: 0,
    clients_with_balance: 0,
    clients_at_warning: 0,
    clients_over_limit: 0,
  }

  for (const acc of accounts || []) {
    summary.total_balance += acc.balance
    summary.total_credit_used += acc.balance
    summary.total_credit_available += acc.credit_limit - acc.balance
    if (acc.balance > 0) summary.clients_with_balance++
    if (acc.is_at_warning_threshold) summary.clients_at_warning++
    if (acc.is_over_limit) summary.clients_over_limit++
  }

  return { success: true, data: summary }
}

export async function getAllClientsWithCreditInfo(
  organizationId: string
): Promise<{
  success: boolean
  data?: ClientWithCreditInfo[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: clients, error } = await (supabase as any)
    .from('clients')
    .select(`
      *,
      account:client_accounts (
        *
      )
    `)
    .eq('organization_id', organizationId)
    .order('name')

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: clients }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import type { ClientAccountTransactionWithDetails } from '@/types/clientAccounts'

export async function getClientAccountDetail(
  clientId: string,
  organizationId: string
): Promise<{
  success: boolean
  data?: {
    account: {
      id: string
      balance: number
      total_purchased: number
      total_paid: number
      credit_limit: number
      is_over_limit: boolean
      is_at_warning_threshold: boolean
    }
    client: {
      id: string
      name: string
      phone: string | null
      email: string | null
    }
    transactions: ClientAccountTransactionWithDetails[]
  }
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: client, error: clientError } = await (supabase as any)
    .from('clients')
    .select('id, name, phone, email')
    .eq('id', clientId)
    .eq('organization_id', organizationId)
    .single()

  if (clientError || !client) {
    return { success: false, error: 'Cliente no encontrado' }
  }

  const { data: account, error: accountError } = await (supabase as any)
    .from('client_accounts')
    .select('id, balance, total_purchased, total_paid, credit_limit, is_over_limit, is_at_warning_threshold')
    .eq('client_id', clientId)
    .eq('organization_id', organizationId)
    .single()

  if (accountError && accountError.code !== 'PGRST116') {
    return { success: false, error: accountError.message }
  }

  const { data: transactions, error: transactionsError } = await (supabase as any)
    .from('client_account_transactions')
    .select(`
      *,
      product_sales:client_product_sales (
        *,
        inventory_item:inventory_items (
          id,
          name,
          sku
        )
      )
    `)
    .eq('account_id', account?.id || 'none')
    .order('created_at', { ascending: false })
    .limit(50)

  if (transactionsError) {
    return { success: false, error: transactionsError.message }
  }

  return {
    success: true,
    data: {
      account: account || {
        id: '',
        balance: 0,
        total_purchased: 0,
        total_paid: 0,
        credit_limit: 0,
        is_over_limit: false,
        is_at_warning_threshold: false,
      },
      client,
      transactions: transactions || [],
    },
  }
}

export async function getClientDiscounts(
  clientId: string
): Promise<{
  success: boolean
  data?: {
    inventory_item_id: string
    discount_percent: number
    product_name: string
  }[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: discounts, error } = await (supabase as any)
    .from('client_product_discounts')
    .select(`
      inventory_item_id,
      discount_percent,
      inventory_item:inventory_items (
        name
      )
    `)
    .eq('client_id', clientId)

  if (error) {
    return { success: false, error: error.message }
  }

  const formatted = (discounts || []).map((d: any) => ({
    inventory_item_id: d.inventory_item_id,
    discount_percent: d.discount_percent,
    product_name: d.inventory_item?.name || 'Producto',
  }))

  return { success: true, data: formatted }
}

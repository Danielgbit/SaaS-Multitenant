'use server'

import { createClient } from '@/lib/supabase/server'
import type { CreateSaleInput } from '@/types/clientAccounts'
import { revalidatePath } from 'next/cache'

export async function recordSale(
  organizationId: string,
  input: CreateSaleInput
): Promise<{
  success: boolean
  data?: {
    transaction_id: string
    total_amount: number
    new_balance: number
  }
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: client } = await (supabase as any)
    .from('clients')
    .select('id, name')
    .eq('id', input.client_id)
    .eq('organization_id', organizationId)
    .single()

  if (!client) {
    return { success: false, error: 'Cliente no encontrado' }
  }

  let accountId: string
  const totalAmount = input.products.reduce((sum, p) => {
    const discount = (p.unit_price * (p.discount_percent || 0)) / 100
    return sum + (p.unit_price - discount) * p.quantity
  }, 0)

  const { data: existingAccount } = await (supabase as any)
    .from('client_accounts')
    .select('id, balance')
    .eq('client_id', input.client_id)
    .eq('organization_id', organizationId)
    .single()

  if (existingAccount) {
    accountId = existingAccount.id
    
    const newBalance = existingAccount.balance + totalAmount
    
    if (newBalance > existingAccount.balance && existingAccount.balance > 0) {
      return { success: false, error: 'Cliente tiene cuenta bloqueada por deuda vencida' }
    }
  } else {
    const { data: newAccount, error: createError } = await (supabase as any)
      .from('client_accounts')
      .insert({
        client_id: input.client_id,
        organization_id: organizationId,
        balance: 0,
        total_purchased: 0,
        total_paid: 0,
        credit_limit: 0,
      })
      .select('id')
      .single()

    if (createError) {
      return { success: false, error: createError.message }
    }
    accountId = newAccount.id
  }

  const { data: transaction, error: transactionError } = await (supabase as any)
    .from('client_account_transactions')
    .insert({
      account_id: accountId,
      organization_id: organizationId,
      transaction_type: 'sale',
      amount: totalAmount,
      balance_after: 0,
      payment_method: input.payment_method || null,
      notes: input.notes || `Venta a ${client.name}`,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (transactionError) {
    return { success: false, error: transactionError.message }
  }

  for (const product of input.products) {
    const discount = (product.unit_price * (product.discount_percent || 0)) / 100
    const totalPrice = (product.unit_price - discount) * product.quantity

    const { error: saleError } = await (supabase as any)
      .from('client_product_sales')
      .insert({
        transaction_id: transaction.id,
        inventory_item_id: product.inventory_item_id,
        product_name: '',
        quantity: product.quantity,
        unit_price: product.unit_price,
        discount_percent: product.discount_percent || 0,
        total_price: totalPrice,
      })

    if (saleError) {
      console.error('Error inserting product sale:', saleError)
    }

    if (product.inventory_item_id) {
      const { data: currentItem } = await (supabase as any)
        .from('inventory_items')
        .select('quantity')
        .eq('id', product.inventory_item_id)
        .single()
      
      if (currentItem) {
        await (supabase as any)
          .from('inventory_items')
          .update({
            quantity: currentItem.quantity - product.quantity,
          })
          .eq('id', product.inventory_item_id)
      }
    }
  }

  const { data: updatedAccount } = await (supabase as any)
    .from('client_accounts')
    .select('balance')
    .eq('id', accountId)
    .single()

  revalidatePath(`/clients/${input.client_id}/account`)
  revalidatePath('/clients')

  return {
    success: true,
    data: {
      transaction_id: transaction.id,
      total_amount: totalAmount,
      new_balance: updatedAccount?.balance || 0,
    },
  }
}

export async function recordPayment(
  organizationId: string,
  input: {
    client_id: string
    amount: number
    payment_method: string
    payment_reference?: string
    notes?: string
  }
): Promise<{
  success: boolean
  data?: {
    transaction_id: string
    new_balance: number
  }
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  const { data: account, error: accountError } = await (supabase as any)
    .from('client_accounts')
    .select('id, balance')
    .eq('client_id', input.client_id)
    .eq('organization_id', organizationId)
    .single()

  if (accountError || !account) {
    return { success: false, error: 'Cliente no tiene cuenta abierta' }
  }

  if (input.amount > account.balance) {
    return { success: false, error: 'El monto no puede exceder el saldo pendiente' }
  }

  const { data: client } = await (supabase as any)
    .from('clients')
    .select('name')
    .eq('id', input.client_id)
    .single()

  const { data: transaction, error: transactionError } = await (supabase as any)
    .from('client_account_transactions')
    .insert({
      account_id: account.id,
      organization_id: organizationId,
      transaction_type: 'payment',
      amount: input.amount,
      balance_after: account.balance - input.amount,
      payment_method: input.payment_method,
      payment_reference: input.payment_reference || null,
      notes: input.notes || `Pago de ${client?.name || 'Cliente'}`,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (transactionError) {
    return { success: false, error: transactionError.message }
  }

  revalidatePath(`/clients/${input.client_id}/account`)
  revalidatePath('/clients')

  return {
    success: true,
    data: {
      transaction_id: transaction.id,
      new_balance: account.balance - input.amount,
    },
  }
}

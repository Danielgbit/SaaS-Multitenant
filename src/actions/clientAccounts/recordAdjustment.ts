'use server'

import { createClient } from '@/lib/supabase/server'
import type { RecordAdjustmentInput } from '@/types/clientAccounts'
import { revalidatePath } from 'next/cache'
import { createEntryFromSource } from '@/actions/cash-sessions/createEntryFromSource'

export async function recordAdjustment(
  organizationId: string,
  input: RecordAdjustmentInput
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

  if (input.amount <= 0) {
    return { success: false, error: 'El monto debe ser mayor a 0' }
  }

  if (!input.description || input.description.trim().length === 0) {
    return { success: false, error: 'La descripción es requerida' }
  }

  const { data: account, error: accountError } = await supabase
    .from('client_accounts')
    .select('id, balance')
    .eq('client_id', input.client_id)
    .eq('organization_id', organizationId)
    .single()

  if (accountError || !account) {
    return { success: false, error: 'Cliente no tiene cuenta abierta' }
  }

  const { data: client } = await supabase
    .from('clients')
    .select('name')
    .eq('id', input.client_id)
    .single()

  const { data: transaction, error: transactionError } = await supabase
    .from('client_account_transactions')
    .insert({
      account_id: account.id,
      organization_id: organizationId,
      transaction_type: 'adjustment',
      amount: input.amount,
      balance_after: account.balance + input.amount,
      payment_method: null,
      payment_reference: input.reference || null,
      notes: input.description,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (transactionError) {
    return { success: false, error: transactionError.message }
  }

  // Registrar en caja
  const entryResult = await createEntryFromSource({
    organization_id: organizationId,
    source_type: 'client_account_payment',
    source_id: transaction.id,
    entry_type: 'adjustment',
    direction: 'in',
    amount: input.amount,
    payment_method: undefined,
    title: `Ajuste: ${input.description}${client?.name ? ' - ' + client.name : ''}`,
    created_by: user.id,
    created_via: 'manual',
  })

  if (!entryResult.success) {
    console.error('[recordAdjustment] Error al crear entry en caja:', entryResult.error)
    return { success: false, error: 'Error al registrar en caja: ' + entryResult.error }
  }

  const { data: updatedAccount } = await supabase
    .from('client_accounts')
    .select('balance')
    .eq('id', account.id)
    .single()

  revalidatePath(`/clients/${input.client_id}/account`)
  revalidatePath('/clients')
  revalidatePath('/caja')

  return {
    success: true,
    data: {
      transaction_id: transaction.id,
      new_balance: updatedAccount?.balance || account.balance + input.amount,
    },
  }
}

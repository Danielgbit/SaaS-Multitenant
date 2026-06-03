'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { voidEntry } from '@/actions/operation-entries/voidEntry'

interface VoidTransactionInput {
  transaction_id: string
  reason: string
}

export async function voidTransaction(
  organizationId: string,
  input: VoidTransactionInput
): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autorizado' }
  }

  if (!input.reason || input.reason.trim().length === 0) {
    return { success: false, error: 'El motivo de anulación es requerido' }
  }

  // Fetch the transaction
  const { data: transaction, error: fetchError } = await (supabase as any)
    .from('client_account_transactions')
    .select('id, account_id, transaction_type, amount, is_voided, organization_id')
    .eq('id', input.transaction_id)
    .single()

  if (fetchError || !transaction) {
    return { success: false, error: 'Transacción no encontrada' }
  }

  if (transaction.is_voided) {
    return { success: false, error: 'La transacción ya está anulada' }
  }

  if (transaction.organization_id !== organizationId) {
    return { success: false, error: 'No autorizado' }
  }

  // Check permissions
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single()

  if (!member || !['owner', 'admin'].includes(member.role)) {
    return { success: false, error: 'Sin permiso para anular transacciones' }
  }

  // Mark as voided (trigger handles balance recalculation)
  const { error: voidError } = await (supabase as any)
    .from('client_account_transactions')
    .update({
      is_voided: true,
      voided_by: user.id,
      voided_at: new Date().toISOString(),
    })
    .eq('id', input.transaction_id)

  if (voidError) {
    return { success: false, error: 'Error al anular: ' + voidError.message }
  }

  // Restore stock for sales
  if (transaction.transaction_type === 'sale') {
    const { data: productSales } = await supabase
      .from('client_product_sales')
      .select('inventory_item_id, quantity')
      .eq('transaction_id', input.transaction_id)

    if (productSales && productSales.length > 0) {
      for (const sale of productSales) {
        if (sale.inventory_item_id) {
          const { data: item } = await supabase
            .from('inventory_items')
            .select('quantity')
            .eq('id', sale.inventory_item_id)
            .single()

          if (item) {
            await supabase
              .from('inventory_items')
              .update({ quantity: item.quantity + sale.quantity })
              .eq('id', sale.inventory_item_id)
          }
        }
      }
    }
  }

  // Void related operation_entries (fire-and-forget, best effort)
  // Search for both source_types: payments/adjustments use 'client_account_payment',
  // sales (contado) use 'inventory_sale'
  const { data: relatedEntries } = await (supabase as any)
    .from('operation_entries')
    .select('id')
    .or('source_type.eq.client_account_payment,source_type.eq.inventory_sale')
    .eq('source_id', input.transaction_id)
    .eq('entry_status', 'active')

  if (relatedEntries && relatedEntries.length > 0) {
    for (const entry of relatedEntries) {
      await voidEntry({ entry_id: entry.id, reason: input.reason }).catch(() => {
        // Best effort - don't fail the whole operation
      })
    }
  }

  revalidatePath(`/clients`)
  revalidatePath('/caja')

  return { success: true }
}

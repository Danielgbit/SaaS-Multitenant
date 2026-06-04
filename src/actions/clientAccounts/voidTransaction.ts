'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { voidEntry } from '@/actions/operation-entries/voidEntry'
import { captureError } from '@/lib/error-logger'
import { recordInventoryMovement } from '@/lib/inventory/inventory-movement'
import * as inventoryService from '@/lib/inventory/inventory-service'
import type { Database } from '@db/supabase'

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
  const { data: transaction, error: fetchError } = await supabase
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
  const voidPayload: Database['public']['Tables']['client_account_transactions']['Update'] = {
    is_voided: true,
    voided_by: user.id,
    voided_at: new Date().toISOString(),
  }
  const { error: voidError } = await supabase
    .from('client_account_transactions')
    .update(voidPayload)
    .eq('id', input.transaction_id)

  if (voidError) {
    return { success: false, error: 'Error al anular: ' + voidError.message }
  }

  // Restore stock for sales via atomic RPC
  if (transaction.transaction_type === 'sale') {
    const { data: productSales } = await supabase
      .from('client_product_sales')
      .select('inventory_item_id, quantity')
      .eq('transaction_id', input.transaction_id)

    if (productSales && productSales.length > 0) {
      for (const sale of productSales) {
        if (sale.inventory_item_id) {
          const { data: rpcRaw, error: rpcError } = await supabase.rpc('inventory_increment_stock', {
            p_item_id: sale.inventory_item_id,
            p_quantity: sale.quantity,
            p_organization_id: organizationId,
          })

          const rpcResult = Array.isArray(rpcRaw) ? rpcRaw[0] : rpcRaw
          if (rpcError || !rpcResult?.success) {
            captureError('inventory_void_restore_failed', new Error(rpcError?.message || rpcResult?.error || 'unknown'), {
              transactionId: input.transaction_id,
              itemId: sale.inventory_item_id,
              quantity: sale.quantity,
              organizationId,
            })
          } else {
            await inventoryService.restore({
              item_id: sale.inventory_item_id,
              quantity: sale.quantity,
              organization_id: organizationId,
              created_by: user.id,
              recordMovement: true,
              movementType: 'void',
              sourceOperationId: input.transaction_id,
              referenceType: 'transaction',
              referenceId: input.transaction_id,
              reason: input.reason,
            })
          }
        }
      }
    }
  }

  // Void related operation_entries
  const { data: relatedEntries } = await supabase
    .from('operation_entries')
    .select('id')
    .or('source_type.eq.client_account_payment,source_type.eq.inventory_sale')
    .eq('source_id', input.transaction_id)
    .eq('entry_status', 'active')

  if (relatedEntries && relatedEntries.length > 0) {
    for (const entry of relatedEntries) {
      const voidResult = await voidEntry({ entry_id: entry.id, reason: input.reason })
      if (voidResult.error) {
        captureError('inventory_void_entry_failed', new Error(voidResult.error), {
          transactionId: input.transaction_id,
          entryId: entry.id,
        })
      }
    }
  }

  revalidatePath(`/clients`)
  revalidatePath('/caja')

  return { success: true }
}

import { createClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/error-logger'
import type { DecrementItem, DecrementResult } from './inventory-types'

export async function retryCompensation(
  organizationId: string,
  items: { item_id: string; quantity: number }[],
  context: string
): Promise<{ allSucceeded: boolean; failures: { item_id: string; error: string }[] }> {
  const supabase = await createClient()
  const failures: { item_id: string; error: string }[] = []

  for (const item of items) {
    const { error: compError } = await supabase.rpc('inventory_increment_stock', {
      p_item_id: item.item_id,
      p_quantity: item.quantity,
      p_organization_id: organizationId,
    })
    if (compError) {
      failures.push({ item_id: item.item_id, error: compError.message })
      captureError('inventory_compensation_retry_failed', compError, {
        context,
        organizationId,
        itemId: item.item_id,
        quantity: item.quantity,
      })
    }
  }

  return { allSucceeded: failures.length === 0, failures }
}

export async function decrementMultipleItemsOrRollback(
  items: DecrementItem[],
  organizationId: string,
  context: string
): Promise<{ success: boolean; results: DecrementResult[]; error?: string }> {
  const supabase = await createClient()
  const committed: DecrementResult[] = []

  // Normalize duplicates: same item_id -> single total
  const byItem = new Map<string, number>()
  for (const item of items) {
    byItem.set(item.item_id, (byItem.get(item.item_id) || 0) + item.quantity)
  }

  const normalizedItems: DecrementItem[] = []
  byItem.forEach((quantity, item_id) => normalizedItems.push({ item_id, quantity }))

  for (const item of normalizedItems) {
    const { data: rpcRaw, error: rpcError } = await supabase.rpc('inventory_decrement_stock', {
      p_item_id: item.item_id,
      p_quantity: item.quantity,
      p_organization_id: organizationId,
    })

    const row = Array.isArray(rpcRaw) ? rpcRaw[0] : rpcRaw

    if (rpcError || !row?.success) {
      const compensationResult = await retryCompensation(
        organizationId,
        committed.map(c => ({ item_id: c.item_id, quantity: normalizedItems.find(i => i.item_id === c.item_id)?.quantity ?? 0 })),
        context
      )

      if (!compensationResult.allSucceeded) {
        captureError('inventory_compensation_partial_failure', new Error(
          compensationResult.failures.map(r => `${r.item_id}:${r.error}`).join('; ')
        ), {
          context,
          organizationId,
          normalizedItems: JSON.stringify(normalizedItems),
        })
      }

      captureError('inventory_sale_compensation', new Error(row?.error || rpcError?.message || 'unknown'), {
        context,
        organizationId,
        failedItem: item.item_id,
        failedQuantity: item.quantity,
        committed: committed.map(r => ({ item_id: r.item_id, qty: normalizedItems.find(i => i.item_id === r.item_id)?.quantity ?? 0 })),
      })

      return {
        success: false,
        results: [...committed, { success: false, item_id: item.item_id, error: row?.error || rpcError?.message }],
        error: row?.error === 'insufficient_stock'
          ? 'Stock insuficiente para uno de los productos.'
          : 'Error al procesar el stock.',
      }
    }

    committed.push({
      success: true,
      item_id: item.item_id,
      quantity_before: row.quantity_before ?? undefined,
      quantity_after: row.quantity_after ?? undefined,
    })
  }

  return { success: true, results: committed }
}

import { createClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/error-logger'
import type { DecrementItem, DecrementResult } from './inventory-types'

export async function decrementMultipleItemsOrRollback(
  items: DecrementItem[],
  organizationId: string,
  context: string
): Promise<{ success: boolean; results: DecrementResult[]; error?: string }> {
  const supabase = await createClient()
  const committed: DecrementResult[] = []
  const rollbackFailures: { item_id: string; quantity: number; error: string }[] = []

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
      for (const done of committed) {
        const { error: compError } = await supabase.rpc('inventory_increment_stock', {
          p_item_id: done.item_id,
          p_quantity: normalizedItems.find(i => i.item_id === done.item_id)?.quantity ?? 0,
          p_organization_id: organizationId,
        })
        if (compError) {
          rollbackFailures.push({ item_id: done.item_id, quantity: normalizedItems.find(i => i.item_id === done.item_id)?.quantity ?? 0, error: compError.message })
        }
      }

      if (rollbackFailures.length > 0) {
        captureError('inventory_compensation_failed', new Error(rollbackFailures.map(r => `${r.item_id}:${r.error}`).join('; ')), {
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

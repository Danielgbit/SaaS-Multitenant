'use server'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { appLog } from '@/lib/app-logger'
import { captureError } from '@/lib/error-logger'
import type { Database } from '@db/supabase'

interface Divergence {
  id: string
  inventory_item_id: string
  name: string
  organization_id: string
  current_stock: number
  ledger_stock: number
  delta: number
  last_movement_id: string | null
  last_movement_created_at: string | null
}

export interface ReconciliationResult {
  total_checked: number
  total_diverged: number
  new_divergences: number
  resolved_divergences: number
  errors: string[]
}

import { ASSISTED_RECONCILIATION_MAX_DELTA } from '@/lib/inventory/constants'

const DUPLICATE_DIVERGENCE_CODE = '23505'

export async function runInventoryReconciliation(): Promise<ReconciliationResult> {
  const supabase = createServiceRoleClient()
  const result: ReconciliationResult = {
    total_checked: 0,
    total_diverged: 0,
    new_divergences: 0,
    resolved_divergences: 0,
    errors: [],
  }

  // 1. Fetch current divergences
  const { data: divergences, error: fetchError } = await supabase.rpc('get_inventory_divergences')

  if (fetchError) {
    captureError('inventory_reconciliation_fetch_failed', fetchError)
    return { ...result, errors: [fetchError.message] }
  }

  const items = (divergences as Divergence[]) || []
  result.total_checked = items.length
  result.total_diverged = items.length

  // 2. Load currently open divergences
  const { data: existingOpen } = await supabase
    .from('inventory_divergences')
    .select('inventory_item_id, id')
    .eq('status', 'open')

  const openSet = new Map((existingOpen || []).map((r: { inventory_item_id: string; id: string }) => [r.inventory_item_id, r.id]))

  // 3. Process each divergence
  for (const item of items) {
    const existingDivergenceId = openSet.get(item.inventory_item_id)

    if (existingDivergenceId) {
      const { error: updateErr } = await supabase
        .from('inventory_divergences')
        .update({
          current_stock: item.current_stock,
          ledger_stock: item.ledger_stock,
          delta: item.delta,
          last_movement_id: item.last_movement_id,
          last_movement_created_at: item.last_movement_created_at,
          last_checked_at: new Date().toISOString(),
          last_detected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          suggested_action: Math.abs(item.delta) <= ASSISTED_RECONCILIATION_MAX_DELTA
            ? 'align_to_ledger'
            : 'investigate',
        } satisfies Database["public"]["Tables"]["inventory_divergences"]["Update"])
        .eq('id', existingDivergenceId)

      if (updateErr) result.errors.push(updateErr.message)
    } else {
      const { error: insertErr } = await supabase
        .from('inventory_divergences')
        .insert({
          inventory_item_id: item.inventory_item_id,
          organization_id: item.organization_id,
          current_stock: item.current_stock,
          ledger_stock: item.ledger_stock,
          delta: item.delta,
          last_movement_id: item.last_movement_id,
          last_movement_created_at: item.last_movement_created_at,
          status: 'open',
          suggested_action: Math.abs(item.delta) <= ASSISTED_RECONCILIATION_MAX_DELTA
            ? 'align_to_ledger'
            : 'investigate',
        } satisfies Database["public"]["Tables"]["inventory_divergences"]["Insert"])

      if (insertErr && insertErr.code !== DUPLICATE_DIVERGENCE_CODE) {
        result.errors.push(insertErr.message)
        captureError('inventory_divergence_insert_failed', insertErr, {
          itemId: item.inventory_item_id,
          organizationId: item.organization_id,
        })
      }

      if (!insertErr || insertErr.code === DUPLICATE_DIVERGENCE_CODE) {
        result.new_divergences++

        if (!insertErr) {
          captureError('inventory_divergence_detected', new Error(
            `Stock diverge: ${item.name} (${item.inventory_item_id}) ` +
            `actual=${item.current_stock} ledger=${item.ledger_stock} delta=${item.delta > 0 ? '+' : ''}${item.delta}`
          ), {
            itemId: item.inventory_item_id,
            itemName: item.name,
            organizationId: item.organization_id,
            currentStock: item.current_stock,
            ledgerStock: item.ledger_stock,
            delta: item.delta,
          })
        }
      }
    }
  }

  // 4. Resolve divergences that no longer exist
  const currentItemIds = new Set(items.map(i => i.inventory_item_id))
  for (const [itemId, recordId] of openSet) {
    if (!currentItemIds.has(itemId)) {
      const { data: existingRecord } = await supabase
        .from('inventory_divergences')
        .select('action_taken')
        .eq('id', recordId)
        .single()

      await supabase
        .from('inventory_divergences')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution: existingRecord?.action_taken === 'none'
            ? 'auto_resolved_before_action'
            : 'resolved_after_new_movement',
          updated_at: new Date().toISOString(),
        } satisfies Database["public"]["Tables"]["inventory_divergences"]["Update"])
        .eq('id', recordId)

      result.resolved_divergences++
    }
  }

  if (result.new_divergences > 0 || result.resolved_divergences > 0) {
    appLog('info', 'inventory_reconciliation_complete', {
      totalChecked: result.total_checked,
      totalDiverged: result.total_diverged,
      newDivergences: result.new_divergences,
      resolvedDivergences: result.resolved_divergences,
      errors: result.errors.length,
    })
  }

  return result
}

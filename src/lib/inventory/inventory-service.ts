import { createClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/error-logger'
import { recordInventoryMovement } from './inventory-movement'
import { decrementMultipleItemsOrRollback } from './batch-decrement'
import type {
  InventoryResult,
  InventoryBatchResult,
  MovementType,
  ReferenceType,
  DecrementItem,
} from './inventory-types'

// ─── adjust ───────────────────────────────────────────

export async function adjust(params: {
  item_id: string
  quantity: number
  organization_id: string
  created_by: string
  metadata?: Record<string, unknown>
}): Promise<InventoryResult> {
  const supabase = await createClient()

  const { data: rpcRaw } = await supabase.rpc('inventory_set_stock', {
    p_item_id: params.item_id,
    p_quantity: params.quantity,
    p_organization_id: params.organization_id,
  })

  const rpcResult = Array.isArray(rpcRaw) ? rpcRaw[0] : rpcRaw

  if (!rpcResult?.success) {
    return { success: false, error: 'Error al ajustar el stock.' }
  }

  const delta = rpcResult.quantity_after - rpcResult.quantity_before

  const movementResult = await recordInventoryMovement({
    inventoryItemId: params.item_id,
    organizationId: params.organization_id,
    movementType: 'adjustment',
    quantityChange: delta,
    quantityBefore: rpcResult.quantity_before,
    quantityAfter: rpcResult.quantity_after,
    metadata: {
      ...params.metadata,
      quantity_before: rpcResult.quantity_before,
      quantity_after: rpcResult.quantity_after,
    },
    createdBy: params.created_by,
  })

  if (!movementResult.success) {
    const { error: compError } = await supabase.rpc('inventory_set_stock', {
      p_item_id: params.item_id,
      p_quantity: rpcResult.quantity_before,
      p_organization_id: params.organization_id,
    })
    if (compError) {
      captureError('inventory_adjust_inconsistent_state', compError, {
        itemId: params.item_id,
        targetQuantity: params.quantity,
        organizationId: params.organization_id,
      })
      return { success: false, error: 'Error crítico: falló el ajuste y también la compensación.' }
    }
    return { success: false, error: 'Error al registrar el movimiento de ajuste.' }
  }

  return { success: true }
}

// ─── restore ──────────────────────────────────────────

export async function restore(params: {
  item_id: string
  quantity: number
  organization_id: string
  created_by: string
  recordMovement?: boolean
  movementType?: MovementType
  sourceOperationId?: string
  referenceType?: ReferenceType
  referenceId?: string
  reason?: string
}): Promise<InventoryResult> {
  if (params.recordMovement && !params.movementType) {
    return { success: false, error: 'movementType es requerido cuando recordMovement=true' }
  }

  const supabase = await createClient()

  const { data: rpcRaw } = await supabase.rpc('inventory_increment_stock', {
    p_item_id: params.item_id,
    p_quantity: params.quantity,
    p_organization_id: params.organization_id,
  })

  const rpcResult = Array.isArray(rpcRaw) ? rpcRaw[0] : rpcRaw

  if (!rpcResult?.success) {
    return { success: false, error: 'Error al restaurar stock.' }
  }

  if (params.recordMovement) {
    const movementResult = await recordInventoryMovement({
      inventoryItemId: params.item_id,
      organizationId: params.organization_id,
      movementType: params.movementType!,
      quantityChange: params.quantity,
      quantityBefore: rpcResult.quantity_before,
      quantityAfter: rpcResult.quantity_after,
      sourceOperationId: params.sourceOperationId,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      reason: params.reason,
      createdBy: params.created_by,
    })

    if (!movementResult.success) {
      const { error: compError } = await supabase.rpc('inventory_decrement_stock', {
        p_item_id: params.item_id,
        p_quantity: params.quantity,
        p_organization_id: params.organization_id,
      })
      if (compError) {
        captureError('inventory_restore_inconsistent_state', compError, {
          itemId: params.item_id,
          quantity: params.quantity,
          organizationId: params.organization_id,
        })
        return { success: false, error: 'Error crítico: falló la restauración y también la compensación.' }
      }
      return { success: false, error: 'Error al registrar el movimiento de restauración.' }
    }
  }

  return { success: true }
}

// ─── alignToLedger ─────────────────────────────────────

export async function alignToLedger(params: {
  item_id: string
  target_quantity: number
  organization_id: string
  created_by: string
  divergence_id: string
}): Promise<InventoryResult> {
  return adjust({
    item_id: params.item_id,
    quantity: params.target_quantity,
    organization_id: params.organization_id,
    created_by: params.created_by,
    metadata: {
      source: 'assisted_reconciliation',
      divergence_id: params.divergence_id,
    },
  })
}

// ─── decrementBatch ───────────────────────────────────

export async function decrementBatch(params: {
  items: DecrementItem[]
  organization_id: string
  context: string
}): Promise<InventoryBatchResult> {
  return decrementMultipleItemsOrRollback(params.items, params.organization_id, params.context)
}

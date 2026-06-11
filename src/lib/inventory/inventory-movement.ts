import { createClient } from '@/lib/supabase/server'
import { captureError } from '@/lib/error-logger'
import type { Database, Json } from '@db/supabase'
import type { MovementBatchResult, MovementType, ReferenceType } from './inventory-types'

export interface InventoryMovementInput {
  inventoryItemId: string
  organizationId: string
  movementType: MovementType
  quantityChange: number
  quantityBefore: number
  quantityAfter: number
  sourceOperationId?: string
  referenceType?: ReferenceType
  referenceId?: string
  reason?: string
  metadata?: Record<string, unknown>
  createdBy: string
}

function toRow(input: InventoryMovementInput): Database["public"]["Tables"]["inventory_movements"]["Insert"] {
  const row: Database["public"]["Tables"]["inventory_movements"]["Insert"] = {
    organization_id: input.organizationId,
    inventory_item_id: input.inventoryItemId,
    movement_type: input.movementType,
    quantity_change: input.quantityChange,
    quantity_before: input.quantityBefore,
    quantity_after: input.quantityAfter,
    metadata: (input.metadata ?? {}) as Json,
    created_by: input.createdBy,
  }
  if (input.sourceOperationId) row.source_operation_id = input.sourceOperationId
  if (input.referenceType) row.reference_type = input.referenceType
  if (input.referenceId) row.reference_id = input.referenceId
  if (input.reason) row.reason = input.reason
  return row
}

export async function recordInventoryMovement(
  input: InventoryMovementInput
): Promise<{ success: boolean }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('inventory_movements')
    .insert(toRow(input))

  if (error) {
    captureError('inventory_movement_insert_failed', error, {
      inventoryItemId: input.inventoryItemId,
      movementType: input.movementType,
      organizationId: input.organizationId,
      sourceOperationId: input.sourceOperationId,
    })
    return { success: false }
  }

  return { success: true }
}

export async function recordInventoryMovementsBatch(
  inputs: InventoryMovementInput[]
): Promise<MovementBatchResult> {
  if (inputs.length === 0) return { success: true }

  const supabase = await createClient()

  const { error } = await supabase
    .from('inventory_movements')
    .insert(inputs.map(toRow))

  if (error) {
    captureError('inventory_movement_batch_insert_failed', error, {
      count: inputs.length,
      firstItemId: inputs[0]?.inventoryItemId,
      movementType: inputs[0]?.movementType,
    })
    return { success: false, error: error.message }
  }

  return { success: true }
}

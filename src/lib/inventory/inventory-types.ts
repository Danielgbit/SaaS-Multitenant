export type MovementType = 'purchase' | 'sale' | 'consumption' | 'adjustment' | 'void' | 'return'
export type ReferenceType = 'transaction' | 'purchase' | 'adjustment' | 'consumption'

export type InventoryResult =
  | { success: true }
  | { success: false; error: string }

export type InventoryBatchResult =
  | { success: true; results: DecrementResult[] }
  | { success: false; results: DecrementResult[]; error?: string }

export type DecrementItem = {
  item_id: string
  quantity: number
}

export type DecrementResult = {
  success: boolean
  item_id: string
  quantity_before?: number
  quantity_after?: number
  error?: string
}

'use server'

import { createClient } from '@/lib/supabase/server'

export interface InventoryMovement {
  id: string
  organization_id: string
  inventory_item_id: string
  movement_type: string
  quantity_change: number
  quantity_before: number
  quantity_after: number
  source_operation_id: string | null
  reference_type: string | null
  reference_id: string | null
  reason: string | null
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
}

export async function getInventoryMovements(
  itemId: string,
  organizationId: string,
  limit = 20
): Promise<InventoryMovement[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*')
    .eq('inventory_item_id', itemId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[getInventoryMovements] Error:', error)
    return []
  }

  return (data as unknown as InventoryMovement[]) || []
}

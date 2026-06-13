'use server'

import { createClient } from '@/lib/supabase/server'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { captureError } from '@/lib/error-logger'

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

export type GetInventoryMovementsOptions = {
  limit?: number
  offset?: number
}

export async function getInventoryMovements(
  itemId: string,
  organizationId: string,
  options: GetInventoryMovementsOptions = {}
): Promise<{ data: InventoryMovement[]; total: number }> {
  const access = await requireOrgAccess(organizationId)
  if (!access.success) return { data: [], total: 0 }
  const supabase = await createClient()

  const limit = options.limit ?? 20
  const offset = options.offset ?? 0

  const { data, error, count } = await supabase
    .from('inventory_movements')
    .select('*', { count: 'exact' })
    .eq('inventory_item_id', itemId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    captureError('inventory_movements_error', error, { itemId, organizationId })
    return { data: [], total: 0 }
  }

  return { data: (data as unknown as InventoryMovement[]) ?? [], total: count ?? 0 }
}

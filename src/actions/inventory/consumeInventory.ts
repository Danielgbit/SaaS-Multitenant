'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateColombia } from '@/lib/utils/colombia-dates'
import type { Database } from '@db/supabase'
import { recordInventoryMovement } from '@/lib/inventory/inventory-movement'

export async function consumeInventory(input: {
  item_id: string
  quantity: number
  estimated_cost?: number
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado.' }

  const { data: item } = await supabase
    .from('inventory_items')
    .select('id, name, quantity, organization_id')
    .eq('id', input.item_id)
    .single()

  if (!item) return { success: false, error: 'Producto no encontrado.' }

  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', item.organization_id)
    .single()

  if (!orgMember || !['owner', 'admin', 'staff'].includes(orgMember.role)) {
    return { success: false, error: 'Sin permiso.' }
  }

  if (input.quantity <= 0) return { success: false, error: 'Cantidad debe ser > 0.' }

  // Atomic decrement via RPC
  const { data: rpcRaw, error: rpcError } = await supabase.rpc('inventory_decrement_stock', {
    p_item_id: input.item_id,
    p_quantity: input.quantity,
    p_organization_id: item.organization_id,
  })

  const rpcResult = Array.isArray(rpcRaw) ? rpcRaw[0] : rpcRaw

  if (rpcError || !rpcResult?.success) {
    const msg = rpcResult?.error === 'insufficient_stock'
      ? 'Stock insuficiente.'
      : 'Error al actualizar stock.'
    return { success: false, error: msg }
  }

  // Auditar movimiento
  await recordInventoryMovement({
    inventoryItemId: input.item_id,
    organizationId: item.organization_id,
    movementType: 'consumption',
    quantityChange: -input.quantity,
    quantityBefore: rpcResult.quantity_before,
    quantityAfter: rpcResult.quantity_after,
    reason: input.notes || undefined,
    metadata: { estimated_cost: input.estimated_cost || null },
    createdBy: user.id,
  })

  // Registrar consumo interno en caja (informativo, NO afecta expected_cash)
  const today = getTodayDateColombia()
  const { data: session } = await supabase
    .from('cash_sessions')
    .select('id')
    .eq('organization_id', item.organization_id)
    .eq('session_date', today)
    .eq('status', 'open')
    .maybeSingle()

  if (session) {
    const entry: Database['public']['Tables']['operation_entries']['Insert'] = {
      cash_session_id: session.id,
      entry_type: 'inventory_out',
      entry_group: 'inventory',
      entry_status: 'active',
      created_via: 'inventory_auto',
      direction: null,
      title: `Consumo: ${item.name} x${input.quantity}`,
      description: input.notes || null,
      amount: 0,
      payment_method: null,
      source_type: 'inventory',
      source_id: input.item_id,
      created_by: user.id,
      metadata: {
        quantity: input.quantity,
        estimated_cost: input.estimated_cost || null,
        remaining_stock: rpcResult.quantity_after,
      },
    }
    await supabase.from('operation_entries').insert(entry)
  }

  revalidatePath('/inventory')
  revalidatePath('/caja')

  return { success: true }
}

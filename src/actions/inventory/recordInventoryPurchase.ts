'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateColombia } from '@/lib/utils/colombia-dates'
import type { PaymentMethod } from '@/types/cash-sessions'
import type { Database } from '@db/supabase'
import { recordInventoryMovement } from '@/lib/inventory/inventory-movement'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { captureError } from '@/lib/error-logger'

export async function recordInventoryPurchase(input: {
  item_id: string
  quantity: number
  unit_cost: number
  payment_status: 'paid' | 'pending'
  payment_method?: PaymentMethod
  notes?: string
}): Promise<{ success: boolean; error?: string; partialSuccess?: boolean }> {
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('inventory_items')
    .select('id, name, quantity, organization_id')
    .eq('id', input.item_id)
    .single()

  if (!item) return { success: false, error: 'Producto no encontrado.' }

  const access = await requireOrgAccess(item.organization_id, ['owner', 'admin'], supabase)
  if (!access.success) return access

  if (input.quantity <= 0 || input.unit_cost <= 0) {
    return { success: false, error: 'Cantidad y costo deben ser > 0.' }
  }

  const totalCost = input.quantity * input.unit_cost

  // Validar cash session antes de modificar stock (FIX-007)
  let cashSessionId: string | null = null
  if (input.payment_status === 'paid') {
    const today = getTodayDateColombia()
    const { data: session } = await supabase
      .from('cash_sessions')
      .select('id')
      .eq('organization_id', item.organization_id)
      .eq('session_date', today)
      .eq('status', 'open')
      .maybeSingle()

    if (!session) {
      return { success: false, error: 'No hay sesión de caja abierta para registrar la compra.' }
    }
    cashSessionId = session.id
  }

  // Incrementar stock via RPC
  const { data: rpcRaw, error: rpcError } = await supabase.rpc('inventory_increment_stock', {
    p_item_id: input.item_id,
    p_quantity: input.quantity,
    p_organization_id: item.organization_id,
  })

  const rpcResult = Array.isArray(rpcRaw) ? rpcRaw[0] : rpcRaw

  if (rpcError || !rpcResult?.success) {
    return { success: false, error: 'Error al actualizar stock.' }
  }

  // Auditar movimiento (FIX-006: verificar retorno)
  const movementResult = await recordInventoryMovement({
    inventoryItemId: input.item_id,
    organizationId: item.organization_id,
    movementType: 'purchase',
    quantityChange: input.quantity,
    quantityBefore: rpcResult.quantity_before,
    quantityAfter: rpcResult.quantity_after,
    metadata: { unit_cost: input.unit_cost, total_cost: totalCost, payment_status: input.payment_status },
    createdBy: access.context.userId,
  })

  if (!movementResult.success) {
    const { error: compError } = await supabase.rpc('inventory_decrement_stock', {
      p_item_id: input.item_id,
      p_quantity: input.quantity,
      p_organization_id: item.organization_id,
    })
    if (compError) {
      captureError('inventory_purchase_inconsistent_state', compError, {
        itemId: input.item_id,
        quantity: input.quantity,
        organizationId: item.organization_id,
      })
      return { success: false, error: 'Error crítico: falló el movimiento y también la compensación.' }
    }
    return { success: false, error: 'Error al registrar el movimiento de inventario.' }
  }

  // Crear movimiento de caja (FIX-008: verificar retorno)
  if (cashSessionId) {
    const entry: Database['public']['Tables']['operation_entries']['Insert'] = {
      cash_session_id: cashSessionId,
      entry_type: 'inventory_purchase',
      entry_group: 'inventory',
      entry_status: 'active',
      created_via: 'inventory_auto',
      direction: 'out',
      title: `Compra: ${item.name} x${input.quantity}`,
      description: input.notes || null,
      amount: totalCost,
      payment_method: input.payment_method || null,
      source_type: 'inventory',
      source_id: input.item_id,
      created_by: access.context.userId,
      metadata: { quantity: input.quantity, unit_cost: input.unit_cost, payment_status: input.payment_status },
    }
    const { error: entryError } = await supabase.from('operation_entries').insert(entry)

    if (entryError) {
      captureError('inventory_purchase_entry_failed', entryError, {
        itemId: input.item_id,
        organizationId: item.organization_id,
      })
      return {
        success: false,
        error: 'La compra fue registrada, pero falló el registro en caja.',
        partialSuccess: true,
      }
    }
  }

  revalidatePath('/inventario')
  revalidatePath('/caja')

  return { success: true }
}

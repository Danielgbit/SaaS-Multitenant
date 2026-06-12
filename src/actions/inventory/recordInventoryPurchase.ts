'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateColombia } from '@/lib/utils/colombia-dates'
import type { PaymentMethod } from '@/types/cash-sessions'
import { requireOrgAccess } from '@/lib/auth/require-org-access'
import { captureError } from '@/lib/error-logger'

export async function recordInventoryPurchase(input: {
  item_id: string
  quantity: number
  unit_cost: number
  payment_status: 'paid' | 'pending'
  payment_method?: PaymentMethod
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('inventory_items')
    .select('id, name, organization_id')
    .eq('id', input.item_id)
    .single()

  if (!item) return { success: false, error: 'Producto no encontrado.' }

  const access = await requireOrgAccess(item.organization_id, ['owner', 'admin'], supabase)
  if (!access.success) return access

  if (input.quantity <= 0 || input.unit_cost <= 0) {
    return { success: false, error: 'Cantidad y costo deben ser > 0.' }
  }

  const totalCost = input.quantity * input.unit_cost

  let cashSessionId: string | undefined
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

  const { data: rpcRaw, error: rpcError } = await supabase.rpc('inventory_record_purchase', {
    p_item_id: input.item_id,
    p_quantity: input.quantity,
    p_organization_id: item.organization_id,
    p_created_by: access.context.userId,
    p_unit_cost: input.unit_cost,
    p_total_cost: totalCost,
    p_payment_status: input.payment_status,
    p_cash_session_id: cashSessionId,
    p_notes: input.notes ?? undefined,
    p_payment_method: input.payment_method ?? undefined,
  })

  const rpcResult = Array.isArray(rpcRaw) ? rpcRaw[0] : rpcRaw

  if (rpcError || !rpcResult?.success) {
    const errCode = rpcResult?.error ?? rpcError?.message ?? 'unknown'
    captureError('inventory_purchase_rpc_failed', new Error(errCode), {
      itemId: input.item_id,
      organizationId: item.organization_id,
      rpcError: errCode,
    })
    const userMsg =
      errCode === 'item_not_found' ? 'Producto no encontrado.' :
      errCode === 'invalid_payment_method' ? 'Método de pago inválido.' :
      'Error al registrar la compra.'
    return { success: false, error: userMsg }
  }

  revalidatePath('/inventario')
  revalidatePath('/caja')

  return { success: true }
}

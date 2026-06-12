'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getTodayDateColombia } from '@/lib/utils/colombia-dates'
import { requireOrgAccess } from '@/lib/auth/require-org-access'

export async function consumeInventory(input: {
  item_id: string
  quantity: number
  estimated_cost?: number
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

  if (input.quantity <= 0) return { success: false, error: 'Cantidad debe ser > 0.' }

  const today = getTodayDateColombia()
  const { data: session } = await supabase
    .from('cash_sessions')
    .select('id')
    .eq('organization_id', item.organization_id)
    .eq('session_date', today)
    .eq('status', 'open')
    .maybeSingle()

  const { data: rpcRaw, error: rpcError } = await supabase.rpc('inventory_record_consumption', {
    p_item_id: input.item_id,
    p_quantity: input.quantity,
    p_organization_id: item.organization_id,
    p_created_by: access.context.userId,
    p_estimated_cost: input.estimated_cost ?? undefined,
    p_notes: input.notes ?? undefined,
    p_cash_session_id: session?.id ?? undefined,
  })

  const rpcResult = Array.isArray(rpcRaw) ? rpcRaw[0] : rpcRaw

  if (rpcError || !rpcResult?.success) {
    const msg = rpcResult?.error === 'insufficient_stock'
      ? 'Stock insuficiente.'
      : 'Error al consumir inventario.'
    return { success: false, error: msg }
  }

  revalidatePath('/inventario')
  revalidatePath('/caja')

  return { success: true }
}
